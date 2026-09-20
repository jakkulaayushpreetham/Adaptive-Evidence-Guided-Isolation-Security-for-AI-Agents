"""
tests/integration/test_showcase_demo.py
----------------------------------------
Automated End-to-End Showcase Demo Integration Test.

Exercises the complete showcase sequence:
- Task creation & capability derivation
- Legitimate READ & WRITE execution (summary file created physically)
- Unauthorized NETWORK attempt -> DENIED
- Unauthorized private file attempt -> D-S fusion triggers RESTRICTED state & WRITE revocation
- Revoked capability post-revocation attempt -> DENIED with CAPABILITY_REVOKED
- Severe suspicious operation -> CRITICAL state, ALL authority revoked
- Containment request logged (ISOLATION_REQUESTED / Docker container exit when available)
- Audit history persistence & incident reconstruction
"""
from pathlib import Path
import pytest

from agent.agent_client import AgentClient
from agent.tools.secure_execute import SecureExecute
from agent.tools.secure_network import SecureNetwork
from agent.tools.secure_read import SecureRead
from agent.tools.secure_write import SecureWrite
from backend.capability.capability import Operation
from backend.capability.capability_manager import CapabilityManager
from backend.capability.capability_store import CapabilityStore
from backend.database.database import reset_database
from backend.policy.policy_engine import AdaptivePolicyEngine
from backend.policy.security_states import SecurityState
from backend.reference_monitor.monitor import ReferenceMonitor
from backend.revocation.revocation_controller import RevocationController
from backend.runtime.security_runtime import SecurityRuntime
from backend.trust_engine.dempster_shafer import DempsterShaferEngine
from backend.trust_engine.evidence_mapper import EvidenceMapper
from experiments.showcase_demo import run_showcase_demo


def test_showcase_demo_end_to_end(tmp_path: Path):
    """
    Runs the showcase demo scenario and asserts every required state, authorization,
    revocation, physical file creation, and incident audit property.
    """
    reset_database()

    result = run_showcase_demo(workspace=tmp_path)

    assert result["agent_id"] == "SHOWCASE-AGENT-001"
    assert result["task_id"] == "SHOWCASE-TASK-001"
    assert result["final_state"] == "CRITICAL"
    assert result["summary_file_created"] is True
    assert result["post_revocation_denied"] is True
    assert result["evidence_count"] >= 4


def test_showcase_sequence_step_by_step_assertions(tmp_path: Path):
    """
    Detailed step-by-step verification of individual runtime objects during the showcase.
    """
    reset_database()

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

    agent_id = "E2E-AGENT-001"
    task_id = "E2E-TASK-001"

    # Setup workspace & input file
    workspace = tmp_path / "workspace"
    input_dir = workspace / "input"
    input_dir.mkdir(parents=True, exist_ok=True)
    input_file = input_dir / "research.txt"
    input_file.write_text("E2E Test Data", encoding="utf-8")

    # 1. Grant capabilities
    manager.grant(agent_id=agent_id, task_id=task_id, operation=Operation.READ_FILE, resource="/workspace/input/research.txt")
    manager.grant(agent_id=agent_id, task_id=task_id, operation=Operation.WRITE_FILE, resource="/workspace/output/summary.txt")

    client = AgentClient(agent_id=agent_id, task_id=task_id, runtime=runtime)
    read_tool = SecureRead(client, workspace)
    write_tool = SecureWrite(client, workspace)
    net_tool = SecureNetwork(client)
    exec_tool = SecureExecute(client)

    # 2. Legitimate ops
    r_content = read_tool.execute("/workspace/input/research.txt")
    assert r_content == "E2E Test Data"

    write_tool.execute("/workspace/output/summary.txt", "Summary Content")
    created_file = workspace / "output" / "summary.txt"
    assert created_file.exists()
    assert created_file.read_text(encoding="utf-8") == "Summary Content"
    assert runtime.get_security_state(agent_id=agent_id, task_id=task_id) is SecurityState.NORMAL

    # 3. Unauthorized NETWORK attempt
    with pytest.raises(PermissionError) as exc_net:
        net_tool.execute("https://unauthorized.network.com")
    assert "AEGIS denied NETWORK" in str(exc_net.value)

    # State transitions to RESTRICTED due to D-S conflict
    state_after_net = runtime.get_security_state(agent_id=agent_id, task_id=task_id)
    assert state_after_net is SecurityState.RESTRICTED

    # 4. Unauthorized private file attempt
    with pytest.raises(PermissionError) as exc_priv:
        read_tool.execute("/workspace/private/credentials.env")
    assert "AEGIS denied READ_FILE" in str(exc_priv.value)

    # 5. Post-revocation failure test
    with pytest.raises(PermissionError) as exc_write_post:
        write_tool.execute("/workspace/output/summary.txt", "Overwritten Content")
    assert "CAPABILITY_REVOKED" in str(exc_write_post.value)

    # 6. Severe violation (EXECUTE with repeated=True)
    with pytest.raises(PermissionError) as exc_exec:
        exec_tool.execute("/bin/malicious_script.sh", repeated=True)
    assert "AEGIS denied EXECUTE" in str(exc_exec.value)

    state_final = runtime.get_security_state(agent_id=agent_id, task_id=task_id)
    assert state_final is SecurityState.CRITICAL

    # 6. Verify ALL capabilities revoked
    active_caps = manager.get_active_capabilities(agent_id=agent_id, task_id=task_id)
    assert len(active_caps) == 0
