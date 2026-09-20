from pathlib import Path
import pytest

from agent.agent_client import AgentClient
from agent.tools.secure_network import SecureNetwork
from agent.tools.secure_read import SecureRead
from agent.tools.secure_write import SecureWrite
from backend.capability.capability import Operation
from backend.capability.capability_manager import CapabilityManager
from backend.capability.capability_store import CapabilityStore
from backend.policy.policy_engine import AdaptivePolicyEngine
from backend.policy.security_states import SecurityState
from backend.reference_monitor.monitor import ReferenceMonitor
from backend.revocation.revocation_controller import RevocationController
from backend.runtime.security_runtime import SecurityRuntime
from backend.trust_engine.dempster_shafer import DempsterShaferEngine
from backend.trust_engine.evidence_mapper import EvidenceMapper


def build_environment(workspace: Path):
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


def test_attack_story_pure_suspicious_sequence(tmp_path: Path):
    """
    Direct attack sequence matching the D-S worked example:
    1. Initial capabilities: READ input, WRITE output
    2. Suspicious NETWORK request -> m(U)=0.60 -> RESTRICTED -> WRITE revoked
    3. WRITE attempt -> physically DENIED by reference monitor
    4. Private file access -> fuses to m(U) >= 0.85 -> CRITICAL -> ALL revoked
    5. Final READ attempt -> DENIED
    """
    runtime, manager = build_environment(tmp_path)

    agent_id = "ATTACK-AGENT-001"
    task_id = "ATTACK-TASK-001"

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

    client = AgentClient(
        agent_id=agent_id,
        task_id=task_id,
        runtime=runtime,
    )

    # Act 1: Unauthorized network request
    net_res = client.request(
        operation=Operation.NETWORK,
        resource="/network/c2-server",
    )
    assert not net_res.authorization.allowed
    assert net_res.security_state is SecurityState.RESTRICTED
    assert net_res.untrustworthy == pytest.approx(0.60)

    # Act 2: Attempt WRITE using tool -> must fail due to revocation
    write_tool = SecureWrite(client, workspace_root=tmp_path)
    with pytest.raises(PermissionError) as exc_write:
        write_tool.execute(
            resource="/workspace/output/summary.txt",
            content="Summary content",
        )
    assert "AEGIS denied WRITE_FILE" in str(exc_write.value)
    assert "CAPABILITY_REVOKED" in str(exc_write.value)

    # Act 3: Unauthorized private file access -> escalates to CRITICAL
    priv_res = client.request(
        operation=Operation.READ_FILE,
        resource="/workspace/input/private_keys.txt",
    )
    assert not priv_res.authorization.allowed
    assert priv_res.security_state is SecurityState.CRITICAL
    assert priv_res.untrustworthy > 0.85
    assert priv_res.isolation_required

    # Act 4: Attempt previously-valid READ using tool -> must now fail
    read_tool = SecureRead(client, workspace_root=tmp_path)
    with pytest.raises(PermissionError) as exc_read:
        read_tool.execute(
            resource="/workspace/input/research.txt",
        )
    assert "AEGIS denied READ_FILE" in str(exc_read.value)
    assert "CAPABILITY_REVOKED" in str(exc_read.value)


def test_attack_story_with_prior_authorized_read(tmp_path: Path):
    """
    Demonstrates actual accumulated D-S evidence where a benign read
    is followed by accumulating violations until policy escalates.
    """
    runtime, manager = build_environment(tmp_path)

    agent_id = "ATTACK-AGENT-002"
    task_id = "ATTACK-TASK-002"

    input_file = tmp_path / "input" / "research.txt"
    input_file.parent.mkdir(parents=True, exist_ok=True)
    input_file.write_text("Legitimate research content", encoding="utf-8")

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

    client = AgentClient(
        agent_id=agent_id,
        task_id=task_id,
        runtime=runtime,
    )

    read_tool = SecureRead(client, workspace_root=tmp_path)
    write_tool = SecureWrite(client, workspace_root=tmp_path)
    network_tool = SecureNetwork(client)

    # Step 1: Benign authorized read succeeds
    content = read_tool.execute("/workspace/input/research.txt")
    assert content == "Legitimate research content"
    assert runtime.get_security_state(
        agent_id=agent_id, task_id=task_id
    ) is SecurityState.NORMAL

    # Step 2: Agent attempts unauthorized network egress
    with pytest.raises(PermissionError):
        network_tool.execute("/network/external")

    # Step 3: Repeated violations drive untrustworthy mass higher
    with pytest.raises(PermissionError):
        network_tool.execute("/network/external-2")

    with pytest.raises(PermissionError):
        read_tool.execute("/workspace/input/passwords.txt")

    # The accumulated violations must drive state to RESTRICTED or CRITICAL
    final_state = runtime.get_security_state(
        agent_id=agent_id, task_id=task_id
    )
    assert final_state in {SecurityState.RESTRICTED, SecurityState.CRITICAL}

    # Under RESTRICTED/CRITICAL, WRITE capability is revoked
    with pytest.raises(PermissionError) as exc_write:
        write_tool.execute(
            resource="/workspace/output/summary.txt",
            content="summary",
        )
    assert "CAPABILITY_REVOKED" in str(exc_write.value)
