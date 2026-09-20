"""Dempster-Shafer combination rule implementation."""
from __future__ import annotations

from dataclasses import dataclass

from backend.trust_engine.mass_function import MassFunction


class TotalConflictError(RuntimeError):
    """Raised when Dempster normalization is undefined."""


@dataclass(frozen=True, slots=True)
class CombinationResult:
    mass: MassFunction
    conflict: float


class DempsterShaferEngine:
    """
    Normalized Dempster combination for:

        Θ = {T, U}

    Focal sets:
        {T}
        {U}
        Θ
    """

    CONFLICT_EPSILON = 1e-12

    def combine(
        self,
        first: MassFunction,
        second: MassFunction,
    ) -> CombinationResult:

        t1 = first.trustworthy
        u1 = first.untrustworthy
        theta1 = first.uncertainty

        t2 = second.trustworthy
        u2 = second.untrustworthy
        theta2 = second.uncertainty

        # Conflict:
        # {T} ∩ {U} = ∅
        # {U} ∩ {T} = ∅
        conflict = (
            (t1 * u2)
            + (u1 * t2)
        )

        denominator = 1.0 - conflict

        if denominator <= self.CONFLICT_EPSILON:
            raise TotalConflictError(
                "Evidence is in total or near-total conflict; "
                "normalized Dempster combination is undefined."
            )

        # Intersections producing {T}
        raw_t = (
            (t1 * t2)
            + (t1 * theta2)
            + (theta1 * t2)
        )

        # Intersections producing {U}
        raw_u = (
            (u1 * u2)
            + (u1 * theta2)
            + (theta1 * u2)
        )

        # Θ ∩ Θ = Θ
        raw_theta = theta1 * theta2

        combined = MassFunction(
            trustworthy=raw_t / denominator,
            untrustworthy=raw_u / denominator,
            uncertainty=raw_theta / denominator,
        )

        return CombinationResult(
            mass=combined,
            conflict=conflict,
        )