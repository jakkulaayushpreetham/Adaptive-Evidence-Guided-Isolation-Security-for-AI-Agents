from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime, timezone

from backend.trust_engine.dempster_shafer import DempsterShaferEngine
from backend.trust_engine.evidence import Evidence
from backend.trust_engine.mass_function import MassFunction


@dataclass(slots=True)
class TrustState:
    """
    Accumulated D-S evidence state for one agent/task pair with dynamic temporal
    decay and compliance tracking.
    """

    agent_id: str
    task_id: str

    mass: MassFunction = field(default_factory=MassFunction.vacuous)

    last_conflict: float = 0.0
    maximum_conflict: float = 0.0
    evidence_count: int = 0

    # Dynamic compliance and probation recovery attributes
    compliance_streak: int = 0
    total_violations: int = 0
    last_violation_at: datetime | None = None

    updated_at: datetime = field(
        default_factory=lambda: datetime.now(timezone.utc)
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

    def record_compliance(self) -> int:
        """Increments compliance streak upon successful verified authorized action."""
        self.compliance_streak += 1
        return self.compliance_streak

    def record_violation(self) -> None:
        """Resets compliance streak and increments violation counter."""
        self.compliance_streak = 0
        self.total_violations += 1
        self.last_violation_at = datetime.now(timezone.utc)

    def apply_temporal_decay(self, decay_engine: Any) -> float:
        """
        Applies exponential temporal decay to untrustworthy mass based on elapsed time.
        Reduces stale disbelief and transfers mass to uncertainty.
        """
        now = datetime.now(timezone.utc)
        elapsed = (now - self.updated_at).total_seconds()
        if elapsed <= 0 or self.mass.untrustworthy <= 0.02:
            return self.mass.untrustworthy

        decayed_u = decay_engine.compute_decay(self.mass.untrustworthy, elapsed)
        delta_u = self.mass.untrustworthy - decayed_u

        if delta_u > 0.001:
            new_u = decayed_u
            new_theta = min(0.95, round(self.mass.uncertainty + delta_u, 4))
            new_t = round(max(0.0, 1.0 - new_u - new_theta), 4)

            self.mass = MassFunction(
                trustworthy=new_t,
                untrustworthy=new_u,
                uncertainty=new_theta,
            )
            self.updated_at = now

        return self.mass.untrustworthy

    def attenuate_disbelief(self, recovery_factor: float = 0.40) -> None:
        """
        Attenuates untrustworthy mass during compliance-driven probation recovery.
        Redistributes disbelief into trustworthiness and uncertainty.
        """
        current_u = self.mass.untrustworthy
        reduced_u = round(max(0.02, current_u * (1.0 - recovery_factor)), 4)
        released_mass = current_u - reduced_u

        new_t = min(0.92, round(self.mass.trustworthy + (released_mass * 0.70), 4))
        new_theta = round(max(0.05, 1.0 - new_t - reduced_u), 4)

        # Normalize
        total = new_t + reduced_u + new_theta
        self.mass = MassFunction(
            trustworthy=round(new_t / total, 4),
            untrustworthy=round(reduced_u / total, 4),
            uncertainty=round(new_theta / total, 4),
        )
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