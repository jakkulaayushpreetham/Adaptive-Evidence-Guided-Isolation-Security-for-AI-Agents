from backend.capability.capability import Operation
from backend.capability.capability_manager import CapabilityManager
from backend.capability.capability_store import CapabilityStore
from backend.reference_monitor.authorization import Decision
from backend.reference_monitor.monitor import ReferenceMonitor


def build_security_core():
    store = CapabilityStore()
    manager = CapabilityManager(store)
    monitor = ReferenceMonitor(store)

    return store, manager, monitor


def test_authorized_read_is_allowed():
    _, manager, monitor = build_security_core()

    manager.grant(
        agent_id="AGENT-001",
        task_id="TASK-001",
        operation=Operation.READ_FILE,
        resource="/workspace/input/research.txt",
    )

    result, event = monitor.authorize(
        agent_id="AGENT-001",
        task_id="TASK-001",
        operation=Operation.READ_FILE,
        resource="/workspace/input/research.txt",
    )

    assert result.decision is Decision.ALLOW
    assert result.allowed
    assert event.decision is Decision.ALLOW


def test_unrelated_file_is_denied():
    _, manager, monitor = build_security_core()

    manager.grant(
        agent_id="AGENT-001",
        task_id="TASK-001",
        operation=Operation.READ_FILE,
        resource="/workspace/input/research.txt",
    )

    result, event = monitor.authorize(
        agent_id="AGENT-001",
        task_id="TASK-001",
        operation=Operation.READ_FILE,
        resource="/workspace/input/private.txt",
    )

    assert result.decision is Decision.DENY
    assert not result.allowed
    assert event.reason == "RESOURCE_MISMATCH"


def test_missing_network_capability_is_denied():
    _, manager, monitor = build_security_core()

    manager.grant(
        agent_id="AGENT-001",
        task_id="TASK-001",
        operation=Operation.READ_FILE,
        resource="/workspace/input/research.txt",
    )

    result, _ = monitor.authorize(
        agent_id="AGENT-001",
        task_id="TASK-001",
        operation=Operation.NETWORK,
        resource="/network/example",
    )

    assert result.decision is Decision.DENY
    assert result.reason == "NO_CAPABILITY"