from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime, timezone
from enum import Enum
from uuid import uuid4

from backend.capability.capability import Operation
from backend.reference_monitor.authorization import Decision


class SecurityEventType(str, Enum):
    AUTHORIZED_OPERATION = "AUTHORIZED_OPERATION"
    UNAUTHORIZED_OPERATION = "UNAUTHORIZED_OPERATION"
    CAPABILITY_REVOKED = "CAPABILITY_REVOKED"
    POLICY_TRANSITION = "POLICY_TRANSITION"
    AGENT_ISOLATED = "AGENT_ISOLATED"


@dataclass(frozen=True, slots=True)
class SecurityEvent:
    agent_id: str
    task_id: str
    event_type: SecurityEventType
    operation: Operation
    resource: str
    decision: Decision
    reason: str

    capability_id: str | None = None

    event_id: str = field(
        default_factory=lambda:
        f"EVT-{uuid4().hex[:12].upper()}"
    )

    timestamp: datetime = field(
        default_factory=lambda:
        datetime.now(timezone.utc)
    )