"""Defines security states: NORMAL, RESTRICTED, CRITICAL."""
from __future__ import annotations

from enum import IntEnum


class SecurityState(IntEnum):
    """
    Ordered AEGIS-AI runtime security states.

    Higher numeric values represent increasingly restrictive states.
    """

    NORMAL = 0
    RESTRICTED = 1
    CRITICAL = 2

    def more_severe_than(
        self,
        other: "SecurityState",
    ) -> bool:
        return self.value > other.value