from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from backend.database.database import get_db
from backend.database.repositories.agent_repository import AgentRepository
from backend.schemas.agent_schema import AgentResponse

router = APIRouter(prefix="/api/agents", tags=["Agents"])


@router.get("/{agent_id}", response_model=AgentResponse)
def get_agent(agent_id: str, db: Session = Depends(get_db)):
    repo = AgentRepository(db)
    agent = repo.get(agent_id)
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    return agent


@router.get("", response_model=list[AgentResponse])
def list_agents(db: Session = Depends(get_db)):
    repo = AgentRepository(db)
    return repo.list_all()
