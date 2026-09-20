from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from backend.database.database import get_db
from backend.database.repositories.capability_repository import CapabilityRepository
from backend.schemas.capability_schema import CapabilityResponse

router = APIRouter(prefix="/api/capabilities", tags=["Capabilities"])


@router.get("/task/{task_id}", response_model=list[CapabilityResponse])
def get_task_capabilities(task_id: str, db: Session = Depends(get_db)):
    repo = CapabilityRepository(db)
    return repo.list_by_task(task_id)
