from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime, timezone
from uuid import uuid4

from backend.trust_engine.mass_function import MassFunction


@dataclass(frozen=True, slots=True)
class Evidence:
    """
    Dempster-Shafer evidence derived from one security observation.
    """

    source_event_id: str
    source_type: str
    mass: MassFunction

    evidence_id: str = field(
        default_factory=lambda:
        f"EVD-{uuid4().hex[:12].upper()}"
    )

    created_at: datetime = field(
        default_factory=lambda:
        datetime.now(timezone.utc)
    )