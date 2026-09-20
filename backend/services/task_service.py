from __future__ import annotations

from pathlib import Path
import uuid
from sqlalchemy.orm import Session

from agent.agent import AutonomousAgent, AgentRunResult
from agent.agent_client import AgentClient
from agent.planner import Planner
from agent.tools.secure_execute import SecureExecute
from agent.tools.secure_network import SecureNetwork
from agent.tools.secure_read import SecureRead
from agent.tools.secure_write import SecureWrite
from backend.capability.capability import Operation
from backend.capability.capability_manager import CapabilityManager
from backend.database.repositories.agent_repository import AgentRepository
from backend.database.repositories.capability_repository import CapabilityRepository
from backend.database.repositories.event_repository import EventRepository
from backend.database.repositories.revocation_repository import RevocationRepository
from backend.database.repositories.task_repository import TaskRepository
from backend.database.repositories.trust_repository import TrustRepository
from backend.runtime.security_runtime import SecurityRuntime
from backend.services.audit_sink import SecurityAuditSink


class TaskService:
    """Orchestrates task lifecycle, capability provisioning, and agent execution."""

    def __init__(
        self,
        db: Session,
        runtime: SecurityRuntime,
        capability_manager: CapabilityManager,
        audit_sink: SecurityAuditSink | None = None,
        workspace_root: Path | None = None,
    ) -> None:
        self.db = db
        self.runtime = runtime
        self.capability_manager = capability_manager
        self.audit_sink = audit_sink
        self.workspace_root = workspace_root or Path("./sandbox/workspace").resolve()

        self.agent_repo = AgentRepository(db)
        self.task_repo = TaskRepository(db)
        self.cap_repo = CapabilityRepository(db)
        self.event_repo = EventRepository(db)
        self.trust_repo = TrustRepository(db)
        self.rev_repo = RevocationRepository(db)

    def create_task(
        self,
        *,
        description: str,
        agent_id: str | None = None,
        task_id: str | None = None,
    ) -> dict:
        agent_id = agent_id or f"AGT-{uuid.uuid4().hex[:8].upper()}"
        task_id = task_id or f"TASK-{uuid.uuid4().hex[:8].upper()}"

        # Ensure agent exists
        self.agent_repo.create(agent_id=agent_id, status="ACTIVE")

        # Create task record
        task_model = self.task_repo.create(
            task_id=task_id,
            agent_id=agent_id,
            description=description,
            status="CREATED",
        )

        # Provision task-scoped least privilege capabilities
        read_cap = self.capability_manager.grant(
            agent_id=agent_id,
            task_id=task_id,
            operation=Operation.READ_FILE,
            resource="/workspace/input/research.txt",
        )
        write_cap = self.capability_manager.grant(
            agent_id=agent_id,
            task_id=task_id,
            operation=Operation.WRITE_FILE,
            resource="/workspace/output/summary.txt",
        )

        if self.audit_sink:
            self.audit_sink.record_capability_grant(read_cap)
            self.audit_sink.record_capability_grant(write_cap)
            initial_trust = self.runtime.get_trust_state(agent_id=agent_id, task_id=task_id)
            self.audit_sink.record_trust_snapshot(agent_id, task_id, initial_trust)

        return {
            "task_id": task_model.task_id,
            "agent_id": task_model.agent_id,
            "description": task_model.description,
            "status": task_model.status,
            "created_at": task_model.created_at,
        }

    def run_task(self, task_id: str) -> AgentRunResult:
        task = self.task_repo.get(task_id)
        if not task:
            raise KeyError(f"Task not found: {task_id}")

        self.task_repo.update_status(task_id, "RUNNING")
        try:
            from backend.api.websocket import manager as ws_manager
            ws_manager.broadcast_sync(ws_manager.create_envelope("TASK_STATUS_CHANGED", task_id, {"task_id": task_id, "status": "RUNNING"}))
        except Exception:
            pass

        client = AgentClient(
            agent_id=task.agent_id,
            task_id=task.task_id,
            runtime=self.runtime,
        )

        read_tool = SecureRead(client, workspace_root=self.workspace_root)
        write_tool = SecureWrite(client, workspace_root=self.workspace_root)
        network_tool = SecureNetwork(client)
        execute_tool = SecureExecute(client)

        agent = AutonomousAgent(
            planner=Planner(),
            secure_read=read_tool,
            secure_write=write_tool,
            secure_network=network_tool,
            secure_execute=execute_tool,
        )

        result = agent.run_summary_task()

        final_status = "COMPLETED" if result.completed else "FAILED"
        self.task_repo.update_status(task_id, final_status)
        try:
            from backend.api.websocket import manager as ws_manager
            ws_manager.broadcast_sync(ws_manager.create_envelope("TASK_STATUS_CHANGED", task_id, {"task_id": task_id, "status": final_status}))
        except Exception:
            pass

        return result

    def get_task(self, task_id: str) -> dict | None:
        task = self.task_repo.get(task_id)
        if not task:
            return None
        return {
            "task_id": task.task_id,
            "agent_id": task.agent_id,
            "description": task.description,
            "status": task.status,
            "created_at": task.created_at,
            "updated_at": task.updated_at,
        }

    def get_capabilities(self, task_id: str) -> list[dict]:
        task = self.task_repo.get(task_id)
        if not task:
            return []
        caps = self.cap_repo.list_by_task(task_id)
        return [
            {
                "capability_id": c.capability_id,
                "agent_id": c.agent_id,
                "task_id": c.task_id,
                "operation": c.operation,
                "resource": c.resource,
                "status": c.status,
                "created_at": c.created_at,
                "revoked_at": c.revoked_at,
                "revocation_reason": c.revocation_reason,
            }
            for c in caps
        ]

    def get_trust(self, task_id: str) -> dict | None:
        task = self.task_repo.get(task_id)
        if not task:
            return None

        sec_state = self.runtime.get_security_state(
            agent_id=task.agent_id,
            task_id=task.task_id,
        )
        trust_state = self.runtime.get_trust_state(
            agent_id=task.agent_id,
            task_id=task.task_id,
        )

        return {
            "task_id": task_id,
            "security_state": sec_state.name,
            "mass": {
                "trustworthy": trust_state.trustworthy,
                "untrustworthy": trust_state.untrustworthy,
                "uncertainty": trust_state.uncertainty,
            },
            "belief_trustworthy": trust_state.belief_trustworthy,
            "plausibility_trustworthy": trust_state.plausibility_trustworthy,
            "conflict": trust_state.last_conflict,
            "evidence_count": trust_state.evidence_count,
        }

    def get_events(self, task_id: str) -> list[dict]:
        events = self.event_repo.list_by_task(task_id)
        return [
            {
                "event_id": e.event_id,
                "agent_id": e.agent_id,
                "task_id": e.task_id,
                "operation": e.operation,
                "resource": e.resource,
                "decision": e.decision,
                "reason": e.reason,
                "capability_id": e.capability_id,
                "timestamp": e.timestamp,
            }
            for e in events
        ]

    def get_timeline(self, task_id: str) -> list[dict]:
        events = self.event_repo.list_by_task(task_id)
        transitions = self.trust_repo.list_policy_transitions(task_id)
        revocations = self.rev_repo.list_by_task(task_id)

        items = []
        for e in events:
            items.append({
                "type": "SECURITY_EVENT",
                "timestamp": e.timestamp,
                "details": f"{e.operation} {e.resource} -> {e.decision} ({e.reason})",
            })
        for t in transitions:
            items.append({
                "type": "POLICY_TRANSITION",
                "timestamp": t.timestamp,
                "details": f"Transition from {t.previous_state} to {t.new_state}: {t.reason}",
            })
        for r in revocations:
            items.append({
                "type": "CAPABILITY_REVOKED",
                "timestamp": r.timestamp,
                "details": f"Capability {r.capability_id} revoked: {r.reason}",
            })

        items.sort(key=lambda x: x["timestamp"])
        return items
