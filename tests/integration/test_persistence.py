from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import pytest

from backend.capability.capability import Operation
from backend.capability.capability_manager import CapabilityManager
from backend.capability.capability_store import CapabilityStore
from backend.database.database import Base
from backend.database.repositories.capability_repository import CapabilityRepository
from backend.database.repositories.event_repository import EventRepository
from backend.database.repositories.task_repository import TaskRepository
from backend.database.repositories.trust_repository import TrustRepository
from backend.policy.policy_engine import AdaptivePolicyEngine
from backend.policy.security_states import SecurityState
from backend.reference_monitor.monitor import ReferenceMonitor
from backend.revocation.revocation_controller import RevocationController
from backend.runtime.security_runtime import SecurityRuntime
from backend.services.audit_sink import SqlAlchemyAuditSink
from backend.trust_engine.dempster_shafer import DempsterShaferEngine
from backend.trust_engine.evidence_mapper import EvidenceMapper


def test_audit_data_persists_across_sessions(tmp_path):
    db_file = tmp_path / "test_persistence.db"
    test_db_url = f"sqlite:///{db_file}"
    test_engine = create_engine(test_db_url, connect_args={"check_same_thread": False})
    Base.metadata.create_all(bind=test_engine)
    TestSession = sessionmaker(bind=test_engine)

    agent_id = "AGT-PERSIST-001"
    task_id = "TASK-PERSIST-001"

    # --- SESSION 1: Create Task and Run Security Operations ---
    audit_sink = SqlAlchemyAuditSink(TestSession)
    store = CapabilityStore()
    manager = CapabilityManager(store)
    monitor = ReferenceMonitor(store)
    mapper = EvidenceMapper()
    ds_engine = DempsterShaferEngine()
    policy = AdaptivePolicyEngine()
    revocation = RevocationController(manager)

    runtime = SecurityRuntime(
        reference_monitor=monitor,
        evidence_mapper=mapper,
        ds_engine=ds_engine,
        policy_engine=policy,
        revocation_controller=revocation,
        audit_sink=audit_sink,
    )

    with TestSession() as session1:
        task_repo = TaskRepository(session1)
        task_repo.create(
            task_id=task_id,
            agent_id=agent_id,
            description="Audit persistence verification task",
        )

    # Initial grants
    cap = manager.grant(
        agent_id=agent_id,
        task_id=task_id,
        operation=Operation.WRITE_FILE,
        resource="/workspace/output/summary.txt",
    )
    audit_sink.record_capability_grant(cap)

    # Operation 1: Unauthorized Network -> Triggers RESTRICTED & Revocation of WRITE
    runtime.evaluate(
        agent_id=agent_id,
        task_id=task_id,
        operation=Operation.NETWORK,
        resource="/network/exfil",
    )

    # Completely destroy session 1, runtime references, and local stores
    del runtime
    del audit_sink
    del manager
    del store

    # --- SESSION 2: Independent Database Verification ---
    with TestSession() as session2:
        event_repo = EventRepository(session2)
        trust_repo = TrustRepository(session2)
        cap_repo = CapabilityRepository(session2)

        # 1. Verify SecurityEvent persisted
        events = event_repo.list_by_task(task_id)
        assert len(events) == 1
        assert events[0].operation == "NETWORK"
        assert events[0].decision == "DENY"
        assert events[0].resource == "/network/exfil"

        # 2. Verify TrustSnapshot persisted
        snapshot = trust_repo.get_latest_snapshot(task_id)
        assert snapshot is not None
        assert snapshot.m_U == pytest.approx(0.60)
        assert snapshot.m_T == pytest.approx(0.10)
        assert snapshot.m_Theta == pytest.approx(0.30)
        assert snapshot.evidence_count == 1

        # 3. Verify PolicyTransition persisted
        transitions = trust_repo.list_policy_transitions(task_id)
        assert len(transitions) == 1
        assert transitions[0].previous_state == "NORMAL"
        assert transitions[0].new_state == "RESTRICTED"

        # 4. Verify Capability Revocation persisted in history
        caps = cap_repo.list_by_task(task_id)
        assert len(caps) >= 1
        write_caps = [c for c in caps if c.operation == "WRITE_FILE"]
        assert write_caps[0].status == "REVOKED"
