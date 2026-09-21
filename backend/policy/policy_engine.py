"""Executes security state transitions and triggers actions."""
from __future__ import annotations

from backend.policy.adaptive_policy import PolicyDecision
from backend.policy.probation_recovery import ProbationRecoveryController
from backend.policy.security_states import SecurityState
from backend.policy.thresholds import PolicyThresholds
from backend.trust_engine.trust_state import TrustState


class AdaptivePolicyEngine:
    """
    Converts D-S evidence state into an AEGIS-AI security state.

    Supports both strict monotonic ratchet mode and dynamic self-healing
    probation recovery when verified compliance is established.
    """

    def __init__(
        self,
        thresholds: PolicyThresholds | None = None,
        allow_dynamic_recovery: bool = False,
        recovery_controller: ProbationRecoveryController | None = None,
    ) -> None:
        self._thresholds = (
            thresholds
            if thresholds is not None
            else PolicyThresholds()
        )
        self.allow_dynamic_recovery = allow_dynamic_recovery
        self._recovery_controller = (
            recovery_controller
            if recovery_controller is not None
            else ProbationRecoveryController()
        )

    def evaluate(
        self,
        trust_state: TrustState,
        current_state: SecurityState,
    ) -> PolicyDecision:

        mass = trust_state.mass
        conflict = trust_state.last_conflict

        proposed_state, reason = self._classify(
            untrustworthy=mass.untrustworthy,
            uncertainty=mass.uncertainty,
            conflict=conflict,
        )

        # Evaluate potential dynamic compliance-driven recovery
        if proposed_state.value < current_state.value:
            if self.allow_dynamic_recovery:
                recovery_decision = self._recovery_controller.evaluate_recovery(
                    trust_state,
                    current_state,
                )
                if recovery_decision.recovered:
                    proposed_state = recovery_decision.target_state
                    reason = recovery_decision.reason
                else:
                    proposed_state = current_state
                    reason = recovery_decision.reason
            else:
                proposed_state = current_state
                reason = (
                    "Automatic security-state downgrade suppressed; "
                    "privilege restoration requires separate policy."
                )

        return PolicyDecision(
            previous_state=current_state,
            proposed_state=proposed_state,
            reason=reason,
            untrustworthy_mass=mass.untrustworthy,
            uncertainty_mass=mass.uncertainty,
            conflict=conflict,
        )

    def _classify(
        self,
        *,
        untrustworthy: float,
        uncertainty: float,
        conflict: float,
    ) -> tuple[SecurityState, str]:

        thresholds = self._thresholds

        # Extremely conflicting evidence should never cause
        # privilege expansion. Treat severe conflict conservatively.

        if conflict >= thresholds.critical_conflict:
            return (
                SecurityState.CRITICAL,
                "Critical evidence conflict threshold reached.",
            )

        if (
            untrustworthy
            >= thresholds.critical_untrustworthy
        ):
            return (
                SecurityState.CRITICAL,
                "Untrustworthy evidence crossed "
                "the critical policy threshold.",
            )

        if conflict >= thresholds.high_conflict:
            return (
                SecurityState.RESTRICTED,
                "High evidence conflict requires "
                "conservative privilege restriction.",
            )

        if (
            untrustworthy
            >= thresholds.restricted_untrustworthy
        ):
            return (
                SecurityState.RESTRICTED,
                "Untrustworthy evidence crossed "
                "the restriction policy threshold.",
            )

        return (
            SecurityState.NORMAL,
            "Evidence remains within normal policy bounds.",
        )