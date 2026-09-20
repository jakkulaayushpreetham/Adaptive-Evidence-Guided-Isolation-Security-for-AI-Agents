"""Asymmetric capability restoration policy."""
from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True, slots=True)
class RestorationDecision:
    allowed: bool
    reason: str


class RestorationPolicy:
    """
    Conservative privilege-restoration policy.

    AEGIS-AI Phase 3 does not automatically restore revoked
    capabilities during the same task execution.
    """

    def evaluate(
        self,
        *,
        explicit_authorization: bool = False,
        new_task: bool = False,
    ) -> RestorationDecision:

        if new_task:
            return RestorationDecision(
                allowed=True,
                reason=(
                    "Privilege reconsideration allowed for "
                    "a newly validated task."
                ),
            )

        if explicit_authorization:
            return RestorationDecision(
                allowed=True,
                reason=(
                    "Privilege restoration explicitly authorized."
                ),
            )

        return RestorationDecision(
            allowed=False,
            reason=(
                "Automatic privilege restoration is disabled."
            ),
        )