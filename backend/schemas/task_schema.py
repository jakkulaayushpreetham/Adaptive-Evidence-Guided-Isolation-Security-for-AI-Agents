from __future__ import annotations

from datetime import datetime
from pydantic import BaseModel, Field


class TaskCreateRequest(BaseModel):
    description: str = Field(..., json_schema_extra={"example": "Read research.txt, summarize it, and save summary.txt"})
    agent_id: str | None = None
    task_id: str | None = None


class TaskResponse(BaseModel):
    task_id: str
    agent_id: str
    description: str
    status: str
    created_at: datetime
    updated_at: datetime | None = None


class TaskRunResponse(BaseModel):
    task_id: str
    completed: bool
    executed_actions: int
    error: str | None = None
