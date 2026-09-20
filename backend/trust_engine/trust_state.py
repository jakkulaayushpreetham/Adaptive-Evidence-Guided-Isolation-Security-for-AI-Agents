from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime, timezone

from backend.trust_engine.dempster_shafer import (
    DempsterShaferEngine,
)
from backend.trust_engine.evidence import Evidence
from backend.trust_engine.mass_function import MassFunction


@dataclass(slots=True)
class TrustState:
    """
    Accumulated D-S evidence state for one agent/task pair.
    """

    agent_id: str
    task_id: str

    mass: MassFunction = field(
        default_factory=MassFunction.vacuous
    )

    last_conflict: float = 0.0
    maximum_conflict: float = 0.0
    evidence_count: int = 0

    updated_at: datetime = field(
        default_factory=lambda:
        datetime.now(timezone.utc)
    )

    def apply(
        self,
        evidence: Evidence,
        engine: DempsterShaferEngine,
    ) -> None:

        result = engine.combine(
            self.mass,
            evidence.mass,
        )

        self.mass = result.mass
        self.last_conflict = result.conflict
        self.maximum_conflict = max(
            self.maximum_conflict,
            result.conflict,
        )

        self.evidence_count += 1
        self.updated_at = datetime.now(timezone.utc)

    @property
    def trustworthy(self) -> float:
        return self.mass.trustworthy

    @property
    def untrustworthy(self) -> float:
        return self.mass.untrustworthy

    @property
    def uncertainty(self) -> float:
        return self.mass.uncertainty

    @property
    def belief_trustworthy(self) -> float:
        return self.mass.belief_trustworthy

    @property
    def plausibility_trustworthy(self) -> float:
        return self.mass.plausibility_trustworthy