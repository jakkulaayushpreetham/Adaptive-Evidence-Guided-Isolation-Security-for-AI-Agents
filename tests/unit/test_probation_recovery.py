"""Unit tests for compliance-driven probation recovery."""
from backend.policy.policy_engine import AdaptivePolicyEngine
from backend.policy.probation_recovery import ProbationRecoveryController
from backend.policy.security_states import SecurityState
from backend.trust_engine.mass_function import MassFunction
from backend.trust_engine.trust_state import TrustState


def test_probation_recovery_after_compliance_streak():
    controller = ProbationRecoveryController(required_compliance_streak=4)
    state = TrustState(agent_id="AGENT-PROB", task_id="TASK-PROB")

    # Incur an unauthorized incident
    state.mass = MassFunction(trustworthy=0.30, untrustworthy=0.45, uncertainty=0.25)

    # 1. Less than required streak -> remains in probation
    for _ in range(3):
        state.record_compliance()

    decision = controller.evaluate_recovery(state, SecurityState.RESTRICTED)
    assert not decision.recovered
    assert decision.target_state is SecurityState.RESTRICTED

    # 2. 4th compliant operation -> recovery achieved
    state.record_compliance()
    decision = controller.evaluate_recovery(state, SecurityState.RESTRICTED)
    assert decision.recovered
    assert decision.target_state is SecurityState.NORMAL
    # Untrustworthy mass was attenuated
    assert state.untrustworthy < 0.45


def test_critical_state_fail_closed():
    controller = ProbationRecoveryController(allow_critical_recovery=False)
    state = TrustState(agent_id="AGENT-CRIT", task_id="TASK-CRIT")
    state.mass = MassFunction(trustworthy=0.10, untrustworthy=0.88, uncertainty=0.02)

    for _ in range(10):
        state.record_compliance()

    decision = controller.evaluate_recovery(state, SecurityState.CRITICAL)
    assert not decision.recovered
    assert decision.target_state is SecurityState.CRITICAL


def test_adaptive_policy_engine_with_dynamic_recovery():
    engine = AdaptivePolicyEngine(allow_dynamic_recovery=True)
    state = TrustState(agent_id="AGENT-ENG", task_id="TASK-ENG")
    state.mass = MassFunction(trustworthy=0.40, untrustworthy=0.35, uncertainty=0.25)

    # Before streak: downgrade suppressed
    decision_before = engine.evaluate(state, SecurityState.RESTRICTED)
    assert decision_before.proposed_state is SecurityState.RESTRICTED

    # After 4 compliant operations: recovery kicks in
    for _ in range(4):
        state.record_compliance()

    decision_after = engine.evaluate(state, SecurityState.RESTRICTED)
    assert decision_after.proposed_state is SecurityState.NORMAL
    assert "Compliance-driven recovery" in decision_after.reason
