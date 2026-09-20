from __future__ import annotations

from dataclasses import dataclass
from enum import Enum


class ConflictLevel(str, Enum):
    LOW = "LOW"
    MODERATE = "MODERATE"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"


@dataclass(frozen=True, slots=True)
class ConflictAssessment:
    conflict: float
    level: ConflictLevel
    privilege_expansion_allowed: bool


class ConflictHandler:
    """
    Interprets D-S conflict for policy consumption.

    Thresholds here are AEGIS-AI prototype policy parameters,
    not mathematical constants of Dempster-Shafer theory.
    """

    def assess(
        self,
        conflict: float,
    ) -> ConflictAssessment:

        if not 0.0 <= conflict <= 1.0:
            raise ValueError(
                "Conflict K must be within [0, 1]."
            )

        if conflict < 0.25:
            level = ConflictLevel.LOW

        elif conflict < 0.50:
            level = ConflictLevel.MODERATE

        elif conflict < 0.80:
            level = ConflictLevel.HIGH

        else:
            level = ConflictLevel.CRITICAL

        privilege_expansion_allowed = level in {
            ConflictLevel.LOW,
            ConflictLevel.MODERATE,
        }

        return ConflictAssessment(
            conflict=conflict,
            level=level,
            privilege_expansion_allowed=privilege_expansion_allowed,
        )