from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from backend.database.database import get_db
from backend.schemas.capability_schema import CapabilityResponse
from backend.schemas.event_schema import SecurityEventResponse
from backend.schemas.task_schema import TaskAnalysisRequest, TaskAnalysisResponse, TaskCreateRequest, TaskResponse, TaskRunResponse
from backend.schemas.trust_schema import TrustStateResponse
from backend.services.security_service import get_security_service
from backend.services.task_analyzer_service import TaskAnalyzerService
from backend.services.task_service import TaskService

router = APIRouter(prefix="/api/tasks", tags=["Tasks"])


def get_task_service(db: Session = Depends(get_db)) -> TaskService:
    sec_service = get_security_service()
    return TaskService(
        db=db,
        runtime=sec_service.runtime,
        capability_manager=sec_service.manager,
        audit_sink=sec_service.audit_sink,
        workspace_root=sec_service.workspace_root,
    )


@router.post("", response_model=TaskResponse, status_code=status.HTTP_201_CREATED)
def create_task(
    request: TaskCreateRequest,
    service: TaskService = Depends(get_task_service),
):
    try:
        task = service.create_task(
            description=request.description,
            agent_id=request.agent_id,
            task_id=request.task_id,
            capabilities=(
                [capability.model_dump() for capability in request.capabilities]
                if request.capabilities is not None
                else None
            ),
        )
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    return task


@router.post("/analyze", response_model=TaskAnalysisResponse)
def analyze_task(request: TaskAnalysisRequest):
    """Generate a GPU-local/cloud plan; model output never grants permissions directly."""
    return TaskAnalyzerService().analyze(
        task_description=request.task_description,
        scenario=request.scenario or "COMPLIANT",
    )


@router.get("/{task_id}", response_model=TaskResponse)
def get_task(
    task_id: str,
    service: TaskService = Depends(get_task_service),
):
    task = service.get_task(task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return task


@router.post("/{task_id}/run", response_model=TaskRunResponse)
def run_task(
    task_id: str,
    service: TaskService = Depends(get_task_service),
):
    try:
        result = service.run_task(task_id)
        return {
            "task_id": task_id,
            "completed": result.completed,
            "executed_actions": result.executed_actions,
            "error": result.error,
        }
    except KeyError:
        raise HTTPException(status_code=404, detail="Task not found")


class MissionRequest(BaseModel):
    persona: str = "BENIGN_WORKER"
    delay_seconds: float = 0.4


@router.post("/{task_id}/run-mission")
def run_autonomous_mission(
    task_id: str,
    request: MissionRequest,
    service: TaskService = Depends(get_task_service),
):
    try:
        res = service.run_mission(
            task_id=task_id,
            persona_str=request.persona,
            delay_seconds=request.delay_seconds,
        )
        return {
            "persona": res.persona.value,
            "agent_id": res.agent_id,
            "task_id": res.task_id,
            "total_steps": res.total_steps,
            "completed": res.completed,
            "final_security_state": res.final_security_state,
            "trace": [
                {
                    "step_number": s.step_number,
                    "thought": s.thought,
                    "operation": s.operation,
                    "resource": s.resource,
                    "allowed": s.allowed,
                    "decision": s.decision,
                    "reason": s.reason,
                    "security_state": s.security_state,
                    "trustworthy": s.trustworthy,
                    "untrustworthy": s.untrustworthy,
                    "uncertainty": s.uncertainty,
                    "conflict": s.conflict,
                    "isolation_required": s.isolation_required,
                    "canary_tripped": s.canary_tripped,
                }
                for s in res.trace
            ],
        }
    except KeyError:
        raise HTTPException(status_code=404, detail="Task not found")


@router.get("/{task_id}/capabilities", response_model=list[CapabilityResponse])
def get_task_capabilities(
    task_id: str,
    service: TaskService = Depends(get_task_service),
):
    return service.get_capabilities(task_id)


@router.get("/{task_id}/trust", response_model=TrustStateResponse)
def get_task_trust(
    task_id: str,
    service: TaskService = Depends(get_task_service),
):
    trust = service.get_trust(task_id)
    if not trust:
        raise HTTPException(status_code=404, detail="Task trust state not found")
    return trust


@router.get("/{task_id}/events", response_model=list[SecurityEventResponse])
def get_task_events(
    task_id: str,
    service: TaskService = Depends(get_task_service),
):
    return service.get_events(task_id)


@router.get("/{task_id}/timeline")
def get_task_timeline(
    task_id: str,
    service: TaskService = Depends(get_task_service),
):
    return service.get_timeline(task_id)
