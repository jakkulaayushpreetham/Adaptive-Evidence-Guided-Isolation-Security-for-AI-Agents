from __future__ import annotations

from sqlalchemy.orm import Session
from backend.database.models import AgentModel


class AgentRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def get(self, agent_id: str) -> AgentModel | None:
        return self.db.query(AgentModel).filter(AgentModel.agent_id == agent_id).first()

    def create(self, agent_id: str, status: str = "ACTIVE") -> AgentModel:
        existing = self.get(agent_id)
        if existing:
            return existing
        agent = AgentModel(agent_id=agent_id, status=status)
        self.db.add(agent)
        self.db.commit()
        self.db.refresh(agent)
        return agent

    def update_status(self, agent_id: str, status: str) -> AgentModel | None:
        agent = self.get(agent_id)
        if agent:
            agent.status = status
            self.db.commit()
            self.db.refresh(agent)
        return agent

    def list_all(self) -> list[AgentModel]:
        return self.db.query(AgentModel).all()
