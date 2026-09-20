from __future__ import annotations

from datetime import datetime
from pydantic import BaseModel


class AgentResponse(BaseModel):
    agent_id: str
    status: str
    created_at: datetime
