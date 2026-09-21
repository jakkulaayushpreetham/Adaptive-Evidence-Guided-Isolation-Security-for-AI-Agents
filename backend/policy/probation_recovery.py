"""
Probation Recovery and Compliance-Driven De-escalation Controller.

Enables self-healing adaptive operating system security. When an agent is placed
under RESTRICTED or PROBATION posture, sustained compliant behavior over an
observation window can dynamically earn back trust and restore attenuated capabilities.
"""
from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timezone

from backend.policy.security_states import SecurityState
from backend.trust_engine.trust_state import TrustState


@dataclass(frozen=True, slots=True)
class RecoveryDecision:
    recovered: bool
    target_state: SecurityState
    reason: str
    streak: int
    untrustworthy_mass: float


class ProbationRecoveryController:
    """
    Evaluates compliance streak and behavioral compliance to decide whether
    an agent can transition from RESTRICTED back to NORMAL.
    """

    def __init__(
        self,
        *,
        required_compliance_streak: int = 4,
        max_recovery_untrustworthy: float = 0.50,
        recovery_disbelief_decay: float = 0.40,
        allow_critical_recovery: bool = False,
    ) -> None:
        self.required_compliance_streak = required_compliance_streak
        self.max_recovery_untrustworthy = max_recovery_untrustworthy
        self.recovery_disbelief_decay = recovery_disbelief_decay
        self.allow_critical_recovery = allow_critical_recovery

    def evaluate_recovery(
        self,
        trust_state: TrustState,
        current_state: SecurityState,
    ) -> RecoveryDecision:
        # CRITICAL state is fail-closed by default for safety
        if current_state is SecurityState.CRITICAL and not self.allow_critical_recovery:
            return RecoveryDecision(
                recovered=False,
                target_state=SecurityState.CRITICAL,
                reason="CRITICAL security state requires explicit operator authorization for containment release.",
                streak=trust_state.compliance_streak,
                untrustworthy_mass=trust_state.untrustworthy,
            )

        if current_state is SecurityState.NORMAL:
            return RecoveryDecision(
                recovered=False,
                target_state=SecurityState.NORMAL,
                reason="Agent is already in nominal state.",
                streak=trust_state.compliance_streak,
                untrustworthy_mass=trust_state.untrustworthy,
            )

        # For RESTRICTED: Check compliance streak and disbelief threshold
        if (
            trust_state.compliance_streak >= self.required_compliance_streak
            and trust_state.untrustworthy <= self.max_recovery_untrustworthy
        ):
            # Attenuate remaining disbelief to reflect empirical rehabilitation
            trust_state.attenuate_disbelief(self.recovery_disbelief_decay)

            return RecoveryDecision(
                recovered=True,
                target_state=SecurityState.NORMAL,
                reason=(
                    f"Compliance-driven recovery: agent completed {trust_state.compliance_streak} "
                    f"consecutive verified operations without violation. Trust restored to NORMAL."
                ),
                streak=trust_state.compliance_streak,
                untrustworthy_mass=trust_state.untrustworthy,
            )

        needed = max(0, self.required_compliance_streak - trust_state.compliance_streak)
        return RecoveryDecision(
            recovered=False,
            target_state=current_state,
            reason=f"Probation active: {needed} more compliant operations required for dynamic recovery.",
            streak=trust_state.compliance_streak,
            untrustworthy_mass=trust_state.untrustworthy,
        )
