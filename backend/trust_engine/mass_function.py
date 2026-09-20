from __future__ import annotations

from dataclasses import dataclass
import math


class InvalidMassFunction(ValueError):
    """Raised when a Dempster-Shafer mass assignment is invalid."""


@dataclass(frozen=True, slots=True)
class MassFunction:
    """
    Mass assignment over the binary frame Θ = {T, U}.

    trustworthy   -> m(T)
    untrustworthy -> m(U)
    uncertainty   -> m(Θ)

    Required invariant:
        m(T) + m(U) + m(Θ) = 1
    """

    trustworthy: float
    untrustworthy: float
    uncertainty: float

    TOLERANCE = 1e-9

    def __post_init__(self) -> None:
        values = (
            self.trustworthy,
            self.untrustworthy,
            self.uncertainty,
        )

        if not all(math.isfinite(value) for value in values):
            raise InvalidMassFunction(
                "All mass values must be finite."
            )

        if any(value < 0.0 or value > 1.0 for value in values):
            raise InvalidMassFunction(
                "Every mass value must be in the interval [0, 1]."
            )

        total = sum(values)

        if not math.isclose(
            total,
            1.0,
            rel_tol=self.TOLERANCE,
            abs_tol=self.TOLERANCE,
        ):
            raise InvalidMassFunction(
                f"Masses must sum to 1.0; received {total:.12f}."
            )

    @classmethod
    def vacuous(cls) -> "MassFunction":
        """
        Complete ignorance:
            m(T)=0
            m(U)=0
            m(Θ)=1
        """
        return cls(
            trustworthy=0.0,
            untrustworthy=0.0,
            uncertainty=1.0,
        )

    @property
    def belief_trustworthy(self) -> float:
        return self.trustworthy

    @property
    def plausibility_trustworthy(self) -> float:
        return self.trustworthy + self.uncertainty

    @property
    def belief_untrustworthy(self) -> float:
        return self.untrustworthy

    @property
    def plausibility_untrustworthy(self) -> float:
        return self.untrustworthy + self.uncertainty

    def as_tuple(self) -> tuple[float, float, float]:
        return (
            self.trustworthy,
            self.untrustworthy,
            self.uncertainty,
        )