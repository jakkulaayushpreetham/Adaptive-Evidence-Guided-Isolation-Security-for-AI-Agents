"""Adaptive policy rules mapping trust states to actions."""
from __future__ import annotations

from dataclasses import dataclass

from backend.policy.security_states import SecurityState


@dataclass(frozen=True, slots=True)
class PolicyDecision:
    previous_state: SecurityState
    proposed_state: SecurityState

    reason: str

    untrustworthy_mass: float
    uncertainty_mass: float
    conflict: float

    @property
    def state_changed(self) -> bool:
        return self.previous_state != self.proposed_state

    @property
    def escalation(self) -> bool:
        return self.proposed_state.more_severe_than(
            self.previous_state
        )