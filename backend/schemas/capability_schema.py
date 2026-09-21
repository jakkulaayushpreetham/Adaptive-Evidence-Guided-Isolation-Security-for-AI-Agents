from __future__ import annotations

from datetime import datetime
from pydantic import BaseModel


class CapabilityResponse(BaseModel):
    capability_id: str
    agent_id: str
    task_id: str
    operation: str
    resource: str
    status: str
    created_at: datetime
    expires_at: datetime | None = None
    revoked_at: datetime | None = None
    revocation_reason: str | None = None
