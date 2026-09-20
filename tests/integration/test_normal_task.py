from pathlib import Path
import pytest

from agent.agent import AutonomousAgent
from agent.agent_client import AgentClient
from agent.planner import Planner
from agent.tools.secure_execute import SecureExecute
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


def test_agent_completes_authorized_normal_task(tmp_path: Path):
    runtime, manager = build_environment(tmp_path)

    agent_id = "AGENT-NORMAL"
    task_id = "TASK-NORMAL"

    # Setup sample research input file
    input_dir = tmp_path / "input"
    output_dir = tmp_path / "output"
    input_dir.mkdir(parents=True, exist_ok=True)

    sample_text = (
        "Adaptive operating systems enforce security by dynamically "
        "modulating access rights based on continuous runtime observation."
    )
    input_file = input_dir / "research.txt"
    input_file.write_text(sample_text, encoding="utf-8")

    # Grant only the required least-privilege task capabilities
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
    execute_tool = SecureExecute(client)

    agent = AutonomousAgent(
        planner=Planner(),
        secure_read=read_tool,
        secure_write=write_tool,
        secure_network=network_tool,
        secure_execute=execute_tool,
    )

    result = agent.run_summary_task()

    output_file = output_dir / "summary.txt"

    # All 4 required assertions
    assert result.completed
    assert output_file.exists()
    assert output_file.read_text(encoding="utf-8")
    assert runtime.get_security_state(
        agent_id=agent_id,
        task_id=task_id,
    ) is SecurityState.NORMAL


def test_denied_tool_does_not_perform_underlying_operation(tmp_path: Path):
    runtime, _ = build_environment(tmp_path)

    agent_id = "AGENT-UNAUTH"
    task_id = "TASK-UNAUTH"

    client = AgentClient(
        agent_id=agent_id,
        task_id=task_id,
        runtime=runtime,
    )

    # No write capability granted
    write_tool = SecureWrite(client, workspace_root=tmp_path)

    target_file = tmp_path / "output" / "unauthorized.txt"

    with pytest.raises(PermissionError) as exc_info:
        write_tool.execute(
            resource="/workspace/output/unauthorized.txt",
            content="malicious payload",
        )

    assert "AEGIS denied WRITE_FILE" in str(exc_info.value)
    # File must NOT have been created on the filesystem
    assert not target_file.exists()
