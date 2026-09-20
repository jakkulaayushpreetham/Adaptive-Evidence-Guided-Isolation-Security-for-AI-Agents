"""Unit test: Adaptive policy state transitions."""
from backend.policy.policy_engine import AdaptivePolicyEngine
from backend.policy.security_states import SecurityState
from backend.trust_engine.mass_function import MassFunction
from backend.trust_engine.trust_state import TrustState


def make_state(
    *,
    trustworthy: float,
    untrustworthy: float,
    uncertainty: float,
    conflict: float = 0.0,
) -> TrustState:

    state = TrustState(
        agent_id="AGENT-001",
        task_id="TASK-001",
    )

    state.mass = MassFunction(
        trustworthy=trustworthy,
        untrustworthy=untrustworthy,
        uncertainty=uncertainty,
    )

    state.last_conflict = conflict

    return state


def test_low_distrust_remains_normal():
    engine = AdaptivePolicyEngine()

    trust = make_state(
        trustworthy=0.75,
        untrustworthy=0.05,
        uncertainty=0.20,
    )

    decision = engine.evaluate(
        trust,
        SecurityState.NORMAL,
    )

    assert decision.proposed_state is SecurityState.NORMAL


def test_restriction_threshold_causes_restricted_state():
    engine = AdaptivePolicyEngine()

    trust = make_state(
        trustworthy=0.10,
        untrustworthy=0.60,
        uncertainty=0.30,
    )

    decision = engine.evaluate(
        trust,
        SecurityState.NORMAL,
    )

    assert (
        decision.proposed_state
        is SecurityState.RESTRICTED
    )

    assert decision.escalation


def test_critical_distrust_causes_critical_state():
    engine = AdaptivePolicyEngine()

    trust = make_state(
        trustworthy=0.05,
        untrustworthy=0.87,
        uncertainty=0.08,
    )

    decision = engine.evaluate(
        trust,
        SecurityState.RESTRICTED,
    )

    assert (
        decision.proposed_state
        is SecurityState.CRITICAL
    )


def test_high_conflict_is_handled_conservatively():
    engine = AdaptivePolicyEngine()

    trust = make_state(
        trustworthy=0.40,
        untrustworthy=0.20,
        uncertainty=0.40,
        conflict=0.60,
    )

    decision = engine.evaluate(
        trust,
        SecurityState.NORMAL,
    )

    assert (
        decision.proposed_state
        is SecurityState.RESTRICTED
    )


def test_automatic_downgrade_is_prevented():
    engine = AdaptivePolicyEngine()

    trust = make_state(
        trustworthy=0.80,
        untrustworthy=0.05,
        uncertainty=0.15,
    )

    decision = engine.evaluate(
        trust,
        SecurityState.CRITICAL,
    )

    assert (
        decision.proposed_state
        is SecurityState.CRITICAL
    )