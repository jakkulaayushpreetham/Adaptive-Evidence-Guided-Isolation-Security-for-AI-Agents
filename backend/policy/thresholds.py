"""Calibrated evidence thresholds for policy transitions."""
from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True, slots=True)
class PolicyThresholds:
    """
    Prototype AEGIS-AI policy thresholds.

    These are configurable experimental policy parameters.
    They are NOT constants defined by Dempster-Shafer theory.
    """

    restricted_untrustworthy: float = 0.60
    critical_untrustworthy: float = 0.85

    high_conflict: float = 0.50
    critical_conflict: float = 0.80

    def __post_init__(self) -> None:
        values = (
            self.restricted_untrustworthy,
            self.critical_untrustworthy,
            self.high_conflict,
            self.critical_conflict,
        )

        if any(value < 0.0 or value > 1.0 for value in values):
            raise ValueError(
                "All policy thresholds must be within [0, 1]."
            )

        if (
            self.restricted_untrustworthy
            >= self.critical_untrustworthy
        ):
            raise ValueError(
                "Restricted threshold must be below "
                "critical threshold."
            )

        if self.high_conflict >= self.critical_conflict:
            raise ValueError(
                "High-conflict threshold must be below "
                "critical-conflict threshold."
            )