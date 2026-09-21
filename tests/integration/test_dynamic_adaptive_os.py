"""
Integration test: End-to-end dynamic adaptive OS lifecycle.

Demonstrates:
1. Nominal operation with authorized reads
2. Violation triggering RESTRICTED state
3. Self-healing compliance streak triggering dynamic recovery back to NORMAL
4. Canary tripwire access triggering immediate CRITICAL lockdown
"""
from backend.capability.capability import Operation
from backend.capability.capability_manager import CapabilityManager
from backend.capability.capability_store import CapabilityStore
from backend.policy.policy_engine import AdaptivePolicyEngine
from backend.policy.security_states import SecurityState
from backend.reference_monitor.monitor import ReferenceMonitor
from backend.revocation.revocation_controller import RevocationController
from backend.runtime.security_runtime import SecurityRuntime
from backend.trust_engine.dempster_shafer import DempsterShaferEngine
from backend.trust_engine.dynamic_evidence_engine import DynamicMassGenerator
from backend.trust_engine.evidence_mapper import EvidenceMapper


def test_dynamic_adaptive_os_lifecycle():
    store = CapabilityStore()
    manager = CapabilityManager(store)
    monitor = ReferenceMonitor(store)

    dynamic_gen = DynamicMassGenerator()
    evidence_mapper = EvidenceMapper(dynamic_generator=dynamic_gen, use_dynamic=True)
    ds_engine = DempsterShaferEngine()
    policy_engine = AdaptivePolicyEngine(allow_dynamic_recovery=True)
    revocation = RevocationController(manager)

    runtime = SecurityRuntime(
        reference_monitor=monitor,
        evidence_mapper=evidence_mapper,
        ds_engine=ds_engine,
        policy_engine=policy_engine,
        revocation_controller=revocation,
    )

    agent_id = "AGENT-DYNAMIC-001"
    task_id = "TASK-DYNAMIC-001"

    # Grant initial read capability
    manager.grant(
        agent_id=agent_id,
        task_id=task_id,
        operation=Operation.READ_FILE,
        resource="/workspace/input/research.txt",
    )

    # 1. Nominal initial operation
    res1 = runtime.evaluate(
        agent_id=agent_id,
        task_id=task_id,
        operation=Operation.READ_FILE,
        resource="/workspace/input/research.txt",
    )
    assert res1.authorization.allowed
    assert res1.security_state is SecurityState.NORMAL

    # 2. Unauthorized write triggers RESTRICTED state
    res2 = runtime.evaluate(
        agent_id=agent_id,
        task_id=task_id,
        operation=Operation.WRITE_FILE,
        resource="/etc/hosts",
    )
    assert not res2.authorization.allowed
    assert res2.security_state is SecurityState.RESTRICTED

    # 3. Sustained compliance: 4 valid read operations in restricted envelope
    for i in range(4):
        res_comp = runtime.evaluate(
            agent_id=agent_id,
            task_id=task_id,
            operation=Operation.READ_FILE,
            resource="/workspace/input/research.txt",
        )
        assert res_comp.authorization.allowed

    # Dynamic recovery restored state to NORMAL
    assert runtime.get_security_state(agent_id=agent_id, task_id=task_id) is SecurityState.NORMAL

    # 4. Honeytoken tripwire access triggers immediate CRITICAL state
    res_canary = runtime.evaluate(
        agent_id=agent_id,
        task_id=task_id,
        operation=Operation.READ_FILE,
        resource="/workspace/.canary/vault_key.json",
    )
    assert not res_canary.authorization.allowed
    assert res_canary.security_state is SecurityState.CRITICAL
    assert res_canary.isolation_required
    assert res_canary.telemetry.get("canary_tripped") is True
