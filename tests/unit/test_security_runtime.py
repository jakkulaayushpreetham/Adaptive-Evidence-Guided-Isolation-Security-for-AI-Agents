import pytest

from backend.capability.capability import Operation
from backend.capability.capability_manager import CapabilityManager
from backend.capability.capability_store import CapabilityStore
from backend.policy.policy_engine import AdaptivePolicyEngine
from backend.policy.security_states import SecurityState
from backend.reference_monitor.authorization import Decision
from backend.reference_monitor.monitor import ReferenceMonitor
from backend.revocation.revocation_controller import RevocationController
from backend.runtime.security_runtime import SecurityRuntime
from backend.trust_engine.dempster_shafer import DempsterShaferEngine
from backend.trust_engine.evidence_mapper import EvidenceMapper


def build_runtime():
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
    )

    return runtime, manager


def test_security_runtime_authorized_operation():
    runtime, manager = build_runtime()

    agent_id = "AGENT-001"
    task_id = "TASK-001"

    manager.grant(
        agent_id=agent_id,
        task_id=task_id,
        operation=Operation.READ_FILE,
        resource="/workspace/input/research.txt",
    )

    result = runtime.evaluate(
        agent_id=agent_id,
        task_id=task_id,
        operation=Operation.READ_FILE,
        resource="/workspace/input/research.txt",
    )

    assert result.authorization.decision is Decision.ALLOW
    assert result.security_state is SecurityState.NORMAL
    assert result.trustworthy == pytest.approx(0.75)
    assert not result.isolation_required


def test_security_runtime_unauthorized_operation():
    runtime, manager = build_runtime()

    agent_id = "AGENT-001"
    task_id = "TASK-001"

    # No capabilities granted
    result = runtime.evaluate(
        agent_id=agent_id,
        task_id=task_id,
        operation=Operation.NETWORK,
        resource="/network/unauthorized",
    )

    assert result.authorization.decision is Decision.DENY
    # Unauthorized network gives (0.10, 0.60, 0.30) => threshold for restricted is 0.60
    assert result.security_state is SecurityState.RESTRICTED
    assert result.untrustworthy == pytest.approx(0.60)
    assert not result.isolation_required
