from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime, timezone
from enum import Enum
from uuid import uuid4


class Operation(str, Enum):
    READ_FILE = "READ_FILE"
    WRITE_FILE = "WRITE_FILE"
    NETWORK = "NETWORK"
    EXECUTE = "EXECUTE"
    DELETE_FILE = "DELETE_FILE"


class CapabilityStatus(str, Enum):
    ACTIVE = "ACTIVE"
    REVOKED = "REVOKED"
    EXPIRED = "EXPIRED"


@dataclass(slots=True)
class Capability:
    agent_id: str
    task_id: str
    operation: Operation
    resource: str

    capability_id: str = field(
        default_factory=lambda: f"CAP-{uuid4().hex[:12].upper()}"
    )

    status: CapabilityStatus = CapabilityStatus.ACTIVE

    created_at: datetime = field(
        default_factory=lambda: datetime.now(timezone.utc)
    )

    revoked_at: datetime | None = None
    revocation_reason: str | None = None

    def is_active(self) -> bool:
        return self.status is CapabilityStatus.ACTIVE

    def revoke(self, reason: str) -> None:
        if self.status is CapabilityStatus.REVOKED:
            return

        self.status = CapabilityStatus.REVOKED
        self.revoked_at = datetime.now(timezone.utc)
        self.revocation_reason = reason