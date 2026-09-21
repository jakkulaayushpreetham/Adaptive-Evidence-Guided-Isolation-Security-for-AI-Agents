from __future__ import annotations

from datetime import datetime
from typing import Literal
from pydantic import BaseModel, Field


class CapabilityGrantRequest(BaseModel):
    operation: Literal["READ_FILE", "WRITE_FILE", "NETWORK", "EXECUTE", "DELETE_FILE"]
    resource: str = Field(..., min_length=1, max_length=500)
    lifetime_seconds: int | None = Field(default=900, ge=60, le=86400)


class TaskCreateRequest(BaseModel):
    description: str = Field(..., json_schema_extra={"example": "Read research.txt, summarize it, and save summary.txt"})
    agent_id: str | None = None
    task_id: str | None = None
    capabilities: list[CapabilityGrantRequest] | None = Field(default=None, max_length=12)


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


class TaskAnalysisRequest(BaseModel):
    """Task brief analyzed with the server-managed local/cloud configuration."""

    task_description: str = Field(..., min_length=8, max_length=5000)


class PlannedAction(BaseModel):
    name: str
    operation: Literal["READ_FILE", "WRITE_FILE", "NETWORK", "EXECUTE", "DELETE_FILE"]
    resource: str
    rationale: str


class PlannedCapability(BaseModel):
    operation: Literal["READ_FILE", "WRITE_FILE", "NETWORK"]
    resource: str
    rationale: str
    risk: Literal["LOW", "MEDIUM", "HIGH"]


class LLMUsage(BaseModel):
    input_tokens: int = 0
    output_tokens: int = 0
    total_tokens: int = 0


class TaskAnalysisResponse(BaseModel):
    title: str
    summary: str
    actions: list[PlannedAction]
    capabilities: list[PlannedCapability]
    security_notes: list[str]
    provider: Literal["openai", "gemini", "ollama"]
    model: str
    analysis_id: str | None = None
    generated_at: datetime
    latency_ms: int = Field(ge=0)
    usage: LLMUsage
    fallback_from: str | None = None
