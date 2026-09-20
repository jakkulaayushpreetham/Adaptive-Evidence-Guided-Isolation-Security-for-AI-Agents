from __future__ import annotations

from datetime import datetime
from sqlalchemy.orm import Session
from backend.database.models import SecurityEventModel


class EventRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def record(
        self,
        event_id: str,
        agent_id: str,
        task_id: str,
        operation: str,
        resource: str,
        decision: str,
        reason: str,
        capability_id: str | None = None,
        timestamp: datetime | None = None,
    ) -> SecurityEventModel:
        kwargs = {
            "event_id": event_id,
            "agent_id": agent_id,
            "task_id": task_id,
            "operation": operation,
            "resource": resource,
            "decision": decision,
            "reason": reason,
            "capability_id": capability_id,
        }
        if timestamp:
            kwargs["timestamp"] = timestamp

        event = SecurityEventModel(**kwargs)
        self.db.add(event)
        self.db.commit()
        self.db.refresh(event)
        return event

    def list_by_task(self, task_id: str) -> list[SecurityEventModel]:
        return (
            self.db.query(SecurityEventModel)
            .filter(SecurityEventModel.task_id == task_id)
            .order_by(SecurityEventModel.timestamp.asc())
            .all()
        )

    def list_all(self, limit: int = 100) -> list[SecurityEventModel]:
        return (
            self.db.query(SecurityEventModel)
            .order_by(SecurityEventModel.timestamp.desc())
            .limit(limit)
            .all()
        )
