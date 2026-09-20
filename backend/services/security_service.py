from __future__ import annotations

from pathlib import Path
from typing import Any

from backend.capability.capability_manager import CapabilityManager
from backend.capability.capability_store import CapabilityStore
from backend.database.database import SessionLocal
from backend.policy.policy_engine import AdaptivePolicyEngine
from backend.reference_monitor.monitor import ReferenceMonitor
from backend.revocation.isolation_manager import IsolationManager
from backend.revocation.revocation_controller import RevocationController
from backend.runtime.security_runtime import SecurityRuntime
from backend.services.audit_sink import SqlAlchemyAuditSink
from backend.trust_engine.dempster_shafer import DempsterShaferEngine
from backend.trust_engine.evidence_mapper import EvidenceMapper


class SecurityService:
    """Manages the lifecycle of the SecurityRuntime and shared security subsystems."""

    def __init__(
        self,
        *,
        isolation_manager: IsolationManager | None = None,
        workspace_root: Path | None = None,
    ) -> None:
        self.store = CapabilityStore()
        self.manager = CapabilityManager(self.store)
        self.monitor = ReferenceMonitor(self.store)
        self.evidence_mapper = EvidenceMapper()
        self.ds_engine = DempsterShaferEngine()
        self.policy_engine = AdaptivePolicyEngine()
        self.revocation_controller = RevocationController(self.manager)
        self.isolation_manager = isolation_manager
        self.workspace_root = workspace_root or Path("./sandbox/workspace").resolve()

        # Database audit sink
        self.audit_sink = SqlAlchemyAuditSink(SessionLocal)

        self.runtime = SecurityRuntime(
            reference_monitor=self.monitor,
            evidence_mapper=self.evidence_mapper,
            ds_engine=self.ds_engine,
            policy_engine=self.policy_engine,
            revocation_controller=self.revocation_controller,
            isolation_manager=self.isolation_manager,
            audit_sink=self.audit_sink,
        )


# Global singleton for FastAPI application dependency injection
_security_service: SecurityService | None = None


def get_security_service() -> SecurityService:
    global _security_service
    if _security_service is None:
        _security_service = SecurityService()
    return _security_service
