from __future__ import annotations

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session

from backend.capability.capability import Operation
from backend.database.database import get_db
from backend.database.repositories.event_repository import EventRepository
from backend.schemas.event_schema import SecurityEventResponse
from backend.services.security_service import get_security_service

router = APIRouter(prefix="/api/security", tags=["Security"])


class SimulateOperationRequest(BaseModel):
    agent_id: str
    task_id: str
    operation: Operation
    resource: str


class SimulateOperationResponse(BaseModel):
    allowed: bool
    decision: str
    reason: str
    security_state: str
    untrustworthy: float
    uncertainty: float
    conflict: float
    isolation_required: bool


@router.get("/events", response_model=list[SecurityEventResponse])
def list_recent_events(limit: int = 50, db: Session = Depends(get_db)):
    repo = EventRepository(db)
    return repo.list_all(limit=limit)


@router.post("/simulate", response_model=SimulateOperationResponse)
def simulate_operation(request: SimulateOperationRequest):
    """
    Simulates an agent attempting a real protected operation through SecurityRuntime.
    Does NOT manufacture trust or bypass the reference monitor.
    """
    sec_service = get_security_service()
    result = sec_service.runtime.evaluate(
        agent_id=request.agent_id,
        task_id=request.task_id,
        operation=request.operation,
        resource=request.resource,
    )

    return {
        "allowed": result.authorization.allowed,
        "decision": result.authorization.decision.value,
        "reason": result.authorization.reason,
        "security_state": result.security_state.name,
        "untrustworthy": result.untrustworthy,
        "uncertainty": result.uncertainty,
        "conflict": result.conflict,
        "isolation_required": result.isolation_required,
    }
