from backend.capability.capability import Operation
from backend.capability.capability_manager import CapabilityManager
from backend.capability.capability_store import CapabilityStore
from backend.policy.policy_engine import AdaptivePolicyEngine
from backend.policy.security_states import SecurityState
from backend.reference_monitor.authorization import Decision
from backend.reference_monitor.monitor import ReferenceMonitor
from backend.revocation.revocation_controller import (
    RevocationController,
)
from backend.trust_engine.dempster_shafer import (
    DempsterShaferEngine,
)
from backend.trust_engine.evidence_mapper import EvidenceMapper
from backend.trust_engine.trust_state import TrustState


def test_suspicious_behavior_causes_real_dynamic_revocation():
    # ---------------------------------------------------------
    # Build AEGIS security pipeline
    # ---------------------------------------------------------

    store = CapabilityStore()
    manager = CapabilityManager(store)
    monitor = ReferenceMonitor(store)

    mapper = EvidenceMapper()
    ds_engine = DempsterShaferEngine()
    policy = AdaptivePolicyEngine()
    revocation = RevocationController(manager)

    agent_id = "AGENT-001"
    task_id = "TASK-001"

    # Setup Sandbox & Isolation
    from backend.revocation.isolation_manager import IsolationManager
    from backend.sandbox.docker_manager import (
        ContainerInfo,
        ContainerState,
        DockerManager,
        DockerUnavailableError,
    )
    from backend.sandbox.sandbox_manager import (
        SandboxManager,
        SandboxRecord,
    )

    try:
        dm = DockerManager()
        dm.ping()
        sandboxes = SandboxManager(dm)
        sandboxes.create(agent_id=agent_id, task_id=task_id)
        sandboxes.start(agent_id=agent_id, task_id=task_id)
    except DockerUnavailableError:
        class LocalSandboxManager:
            def __init__(self):
                self._state = ContainerState.RUNNING

            def require(self, *, agent_id: str, task_id: str) -> SandboxRecord:
                return SandboxRecord(agent_id, task_id, "cont-aegis-sim", "aegis-sim")

            def inspect(self, *, agent_id: str, task_id: str) -> ContainerInfo:
                return ContainerInfo(
                    "cont-aegis-sim",
                    "aegis-sim",
                    self._state,
                    self._state.value.lower(),
                )

            def stop(self, *, agent_id: str, task_id: str) -> ContainerInfo:
                self._state = ContainerState.EXITED
                return self.inspect(agent_id=agent_id, task_id=task_id)

        sandboxes = LocalSandboxManager()

    isolation = IsolationManager(sandboxes)

    trust = TrustState(
        agent_id=agent_id,
        task_id=task_id,
    )

    security_state = SecurityState.NORMAL

    # ---------------------------------------------------------
    # Initial task capabilities
    # ---------------------------------------------------------

    manager.grant(
        agent_id=agent_id,
        task_id=task_id,
        operation=Operation.READ_FILE,
        resource="/workspace/input/research.txt",
    )

    manager.grant(
        agent_id=agent_id,
        task_id=task_id,
        operation=Operation.WRITE_FILE,
        resource="/workspace/output/summary.txt",
    )

    # ---------------------------------------------------------
    # Authorized task operation
    # ---------------------------------------------------------

    allowed_read, _ = monitor.authorize(
        agent_id=agent_id,
        task_id=task_id,
        operation=Operation.READ_FILE,
        resource="/workspace/input/research.txt",
    )

    assert allowed_read.decision is Decision.ALLOW

    # ---------------------------------------------------------
    # Suspicious event #1:
    # unauthorized network request
    # ---------------------------------------------------------

    network_result, network_event = monitor.authorize(
        agent_id=agent_id,
        task_id=task_id,
        operation=Operation.NETWORK,
        resource="/network/external",
    )

    assert network_result.decision is Decision.DENY

    network_evidence = mapper.map(network_event)

    trust.apply(
        network_evidence,
        ds_engine,
    )

    decision = policy.evaluate(
        trust,
        security_state,
    )

    revocation_result = revocation.apply(
        agent_id=agent_id,
        task_id=task_id,
        decision=decision,
    )

    security_state = decision.proposed_state

    assert security_state is SecurityState.RESTRICTED
    assert not revocation_result.isolation_required

    # ---------------------------------------------------------
    # PROOF OF REAL DYNAMIC REVOCATION
    #
    # WRITE existed at task start.
    # Policy has now revoked it.
    # ---------------------------------------------------------

    write_after_revocation, _ = monitor.authorize(
        agent_id=agent_id,
        task_id=task_id,
        operation=Operation.WRITE_FILE,
        resource="/workspace/output/summary.txt",
    )

    assert write_after_revocation.decision is Decision.DENY

    # READ remains available under RESTRICTED.
    read_after_restriction, _ = monitor.authorize(
        agent_id=agent_id,
        task_id=task_id,
        operation=Operation.READ_FILE,
        resource="/workspace/input/research.txt",
    )

    assert read_after_restriction.decision is Decision.ALLOW

    # ---------------------------------------------------------
    # Suspicious event #2:
    # unauthorized private-file access
    # ---------------------------------------------------------

    private_result, private_event = monitor.authorize(
        agent_id=agent_id,
        task_id=task_id,
        operation=Operation.READ_FILE,
        resource="/workspace/input/private.txt",
    )

    assert private_result.decision is Decision.DENY

    private_evidence = mapper.map(private_event)

    trust.apply(
        private_evidence,
        ds_engine,
    )

    decision = policy.evaluate(
        trust,
        security_state,
    )

    revocation_result = revocation.apply(
        agent_id=agent_id,
        task_id=task_id,
        decision=decision,
    )

    security_state = decision.proposed_state

    # D-S result should now be strongly untrustworthy.
    assert trust.untrustworthy > 0.85

    assert security_state is SecurityState.CRITICAL
    assert revocation_result.isolation_required

    # ---------------------------------------------------------
    # Physical isolation of agent sandbox
    # ---------------------------------------------------------

    isolation_result = isolation.isolate(
        agent_id=agent_id,
        task_id=task_id,
        reason=decision.reason,
    )

    assert isolation_result.isolated
    assert isolation_result.final_state is not ContainerState.RUNNING

    # ---------------------------------------------------------
    # CRITICAL means even READ is now gone.
    # ---------------------------------------------------------

    final_read, _ = monitor.authorize(
        agent_id=agent_id,
        task_id=task_id,
        operation=Operation.READ_FILE,
        resource="/workspace/input/research.txt",
    )

    assert final_read.decision is Decision.DENY
