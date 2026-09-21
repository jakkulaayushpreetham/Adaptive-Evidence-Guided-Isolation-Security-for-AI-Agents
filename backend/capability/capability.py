from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime, timedelta, timezone
from enum import Enum
from uuid import uuid4


class Operation(str, Enum):
    READ_FILE = "READ_FILE"
    WRITE_FILE = "WRITE_FILE"
    NETWORK = "NETWORK"
    EXECUTE = "EXECUTE"
    DELETE_FILE = "DELETE_FILE"
    DATABASE_QUERY = "DATABASE_QUERY"
    KEYSTORE_ACCESS = "KEYSTORE_ACCESS"
    IPC_CALL = "IPC_CALL"
    MEMORY_READ = "MEMORY_READ"
    MEMORY_WRITE = "MEMORY_WRITE"


class CapabilityStatus(str, Enum):
    ACTIVE = "ACTIVE"
    ATTENUATED = "ATTENUATED"
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

    expires_at: datetime | None = None

    revoked_at: datetime | None = None
    revocation_reason: str | None = None

    # Dynamic Capability Attenuation fields
    is_attenuated: bool = False
    rate_limit_per_minute: int | None = None
    attenuated_resource: str | None = None
    original_resource: str | None = None
    original_expires_at: datetime | None = None

    def is_active(self) -> bool:
        if (
            self.status in {CapabilityStatus.ACTIVE, CapabilityStatus.ATTENUATED}
            and self.expires_at is not None
            and datetime.now(timezone.utc) >= self.expires_at
        ):
            self.status = CapabilityStatus.EXPIRED

        return self.status in {CapabilityStatus.ACTIVE, CapabilityStatus.ATTENUATED}

    def attenuate(
        self,
        *,
        narrowed_resource: str | None = None,
        compressed_ttl_seconds: int | None = None,
        rate_limit_per_minute: int | None = None,
    ) -> None:
        """Dynamically restricts capability scope, lifetime, or velocity under probation."""
        if not self.is_attenuated:
            self.original_resource = self.resource
            self.original_expires_at = self.expires_at

        if narrowed_resource is not None:
            self.resource = narrowed_resource
            self.attenuated_resource = narrowed_resource

        if compressed_ttl_seconds is not None:
            self.expires_at = datetime.now(timezone.utc) + timedelta(seconds=compressed_ttl_seconds)

        if rate_limit_per_minute is not None:
            self.rate_limit_per_minute = rate_limit_per_minute

        self.is_attenuated = True
        self.status = CapabilityStatus.ATTENUATED

    def restore_attenuation(self) -> None:
        """Restores original unattenuated parameters following successful probation recovery."""
        if not self.is_attenuated:
            return

        if self.original_resource is not None:
            self.resource = self.original_resource

        if self.original_expires_at is not None:
            self.expires_at = self.original_expires_at

        self.rate_limit_per_minute = None
        self.attenuated_resource = None
        self.is_attenuated = False
        self.status = CapabilityStatus.ACTIVE

    def revoke(self, reason: str) -> None:
        if self.status is CapabilityStatus.REVOKED:
            return

        self.status = CapabilityStatus.REVOKED
        self.revoked_at = datetime.now(timezone.utc)
        self.revocation_reason = reason
