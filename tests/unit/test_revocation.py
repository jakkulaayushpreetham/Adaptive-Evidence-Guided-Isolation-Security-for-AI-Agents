from backend.capability.capability import Operation
from backend.capability.capability_manager import CapabilityManager
from backend.capability.capability_store import CapabilityStore
from backend.policy.adaptive_policy import PolicyDecision
from backend.policy.security_states import SecurityState
from backend.reference_monitor.authorization import Decision
from backend.reference_monitor.monitor import ReferenceMonitor
from backend.revocation.revocation_controller import (
    RevocationController,
)


def test_revoked_capability_is_actually_denied():
    store = CapabilityStore()
    manager = CapabilityManager(store)
    monitor = ReferenceMonitor(store)

    capability = manager.grant(
        agent_id="AGENT-001",
        task_id="TASK-001",
        operation=Operation.WRITE_FILE,
        resource="/workspace/output/summary.txt",
    )

    # --------------------------------------------------------
    # BEFORE REVOCATION
    # --------------------------------------------------------

    before, _ = monitor.authorize(
        agent_id="AGENT-001",
        task_id="TASK-001",
        operation=Operation.WRITE_FILE,
        resource="/workspace/output/summary.txt",
    )

    assert before.decision is Decision.ALLOW

    # --------------------------------------------------------
    # REVOKE
    # --------------------------------------------------------

    manager.revoke(
        capability.capability_id,
        reason="Adaptive security restriction",
    )

    # --------------------------------------------------------
    # AFTER REVOCATION
    # --------------------------------------------------------

    after, event = monitor.authorize(
        agent_id="AGENT-001",
        task_id="TASK-001",
        operation=Operation.WRITE_FILE,
        resource="/workspace/output/summary.txt",
    )

    assert after.decision is Decision.DENY
    assert after.reason == "CAPABILITY_REVOKED"
    assert event.decision is Decision.DENY


def test_restricted_state_revokes_write_but_keeps_read():
    store = CapabilityStore()
    manager = CapabilityManager(store)
    monitor = ReferenceMonitor(store)

    controller = RevocationController(manager)

    manager.grant(
        agent_id="AGENT-001",
        task_id="TASK-001",
        operation=Operation.READ_FILE,
        resource="/workspace/input/research.txt",
    )

    manager.grant(
        agent_id="AGENT-001",
        task_id="TASK-001",
        operation=Operation.WRITE_FILE,
        resource="/workspace/output/summary.txt",
    )

    decision = PolicyDecision(
        previous_state=SecurityState.NORMAL,
        proposed_state=SecurityState.RESTRICTED,
        reason="Test restriction",
        untrustworthy_mass=0.70,
        uncertainty_mass=0.20,
        conflict=0.10,
    )

    result = controller.apply(
        agent_id="AGENT-001",
        task_id="TASK-001",
        decision=decision,
    )

    assert result.state is SecurityState.RESTRICTED
    assert not result.isolation_required

    read_result, _ = monitor.authorize(
        agent_id="AGENT-001",
        task_id="TASK-001",
        operation=Operation.READ_FILE,
        resource="/workspace/input/research.txt",
    )

    write_result, _ = monitor.authorize(
        agent_id="AGENT-001",
        task_id="TASK-001",
        operation=Operation.WRITE_FILE,
        resource="/workspace/output/summary.txt",
    )

    assert read_result.decision is Decision.ALLOW
    assert write_result.decision is Decision.DENY


def test_critical_state_revokes_everything():
    store = CapabilityStore()
    manager = CapabilityManager(store)
    monitor = ReferenceMonitor(store)

    controller = RevocationController(manager)

    manager.grant(
        agent_id="AGENT-001",
        task_id="TASK-001",
        operation=Operation.READ_FILE,
        resource="/workspace/input/research.txt",
    )

    manager.grant(
        agent_id="AGENT-001",
        task_id="TASK-001",
        operation=Operation.WRITE_FILE,
        resource="/workspace/output/summary.txt",
    )

    decision = PolicyDecision(
        previous_state=SecurityState.RESTRICTED,
        proposed_state=SecurityState.CRITICAL,
        reason="Critical security state",
        untrustworthy_mass=0.90,
        uncertainty_mass=0.05,
        conflict=0.05,
    )

    result = controller.apply(
        agent_id="AGENT-001",
        task_id="TASK-001",
        decision=decision,
    )

    assert result.isolation_required

    read_result, _ = monitor.authorize(
        agent_id="AGENT-001",
        task_id="TASK-001",
        operation=Operation.READ_FILE,
        resource="/workspace/input/research.txt",
    )

    write_result, _ = monitor.authorize(
        agent_id="AGENT-001",
        task_id="TASK-001",
        operation=Operation.WRITE_FILE,
        resource="/workspace/output/summary.txt",
    )

    assert read_result.decision is Decision.DENY
    assert write_result.decision is Decision.DENY


def test_isolation_manager_shuts_down_sandbox():
    from backend.revocation.isolation_manager import IsolationManager
    from backend.sandbox.docker_manager import ContainerInfo, ContainerState
    from backend.sandbox.sandbox_manager import SandboxRecord

    class FakeSandboxManager:
        def __init__(self):
            self.current_state = ContainerState.RUNNING

        def require(self, agent_id: str, task_id: str) -> SandboxRecord:
            return SandboxRecord(
                agent_id=agent_id,
                task_id=task_id,
                container_id="cont-test-123",
                container_name="aegis-agent-task",
            )

        def inspect(self, agent_id: str, task_id: str) -> ContainerInfo:
            return ContainerInfo(
                container_id="cont-test-123",
                name="aegis-agent-task",
                state=self.current_state,
                raw_status=self.current_state.value.lower(),
            )

        def stop(self, agent_id: str, task_id: str) -> ContainerInfo:
            self.current_state = ContainerState.EXITED
            return self.inspect(agent_id, task_id)

    fake_sandboxes = FakeSandboxManager()
    isolation = IsolationManager(fake_sandboxes)

    result = isolation.isolate(
        agent_id="AGENT-001",
        task_id="TASK-001",
        reason="AEGIS CRITICAL security state",
    )

    assert result.isolated
    assert result.final_state is ContainerState.EXITED
    assert result.container_id == "cont-test-123"