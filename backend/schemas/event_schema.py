from __future__ import annotations

from datetime import datetime
from pydantic import BaseModel


class SecurityEventResponse(BaseModel):
    event_id: str
    agent_id: str
    task_id: str
    operation: str
    resource: str
    decision: str
    reason: str
    capability_id: str | None = None
    timestamp: datetime
