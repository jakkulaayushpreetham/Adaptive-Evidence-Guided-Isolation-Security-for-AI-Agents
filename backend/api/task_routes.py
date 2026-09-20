from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from backend.database.database import get_db
from backend.schemas.capability_schema import CapabilityResponse
from backend.schemas.event_schema import SecurityEventResponse
from backend.schemas.task_schema import TaskCreateRequest, TaskResponse, TaskRunResponse
from backend.schemas.trust_schema import TrustStateResponse
from backend.services.security_service import get_security_service
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
    task = service.create_task(
        description=request.description,
        agent_id=request.agent_id,
        task_id=request.task_id,
    )
    return task


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
