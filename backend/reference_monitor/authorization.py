from __future__ import annotations

from dataclasses import dataclass
from enum import Enum


class Decision(str, Enum):
    ALLOW = "ALLOW"
    DENY = "DENY"


class DenialReason(str, Enum):
    NO_CAPABILITY = "NO_CAPABILITY"
    CAPABILITY_REVOKED = "CAPABILITY_REVOKED"
    RESOURCE_MISMATCH = "RESOURCE_MISMATCH"
    TASK_MISMATCH = "TASK_MISMATCH"
    INVALID_REQUEST = "INVALID_REQUEST"


@dataclass(frozen=True, slots=True)
class AuthorizationResult:
    decision: Decision
    reason: str
    capability_id: str | None = None

    @property
    def allowed(self) -> bool:
        return self.decision is Decision.ALLOW