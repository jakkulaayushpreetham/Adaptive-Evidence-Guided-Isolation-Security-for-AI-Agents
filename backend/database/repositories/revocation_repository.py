from __future__ import annotations

from datetime import datetime
from sqlalchemy.orm import Session
from backend.database.models import RevocationModel


class RevocationRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def record(
        self,
        capability_id: str,
        agent_id: str,
        task_id: str,
        reason: str,
        timestamp: datetime | None = None,
    ) -> RevocationModel:
        kwargs = {
            "capability_id": capability_id,
            "agent_id": agent_id,
            "task_id": task_id,
            "reason": reason,
        }
        if timestamp:
            kwargs["timestamp"] = timestamp

        rev = RevocationModel(**kwargs)
        self.db.add(rev)
        self.db.commit()
        self.db.refresh(rev)
        return rev

    def list_by_task(self, task_id: str) -> list[RevocationModel]:
        return (
            self.db.query(RevocationModel)
            .filter(RevocationModel.task_id == task_id)
            .order_by(RevocationModel.timestamp.asc())
            .all()
        )
