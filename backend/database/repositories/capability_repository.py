from __future__ import annotations

from datetime import datetime, timezone
from sqlalchemy.orm import Session
from backend.database.models import CapabilityHistoryModel


class CapabilityRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def record_grant(
        self,
        capability_id: str,
        agent_id: str,
        task_id: str,
        operation: str,
        resource: str,
        status: str = "ACTIVE",
        expires_at: datetime | None = None,
    ) -> CapabilityHistoryModel:
        record = CapabilityHistoryModel(
            capability_id=capability_id,
            agent_id=agent_id,
            task_id=task_id,
            operation=operation,
            resource=resource,
            status=status,
            expires_at=expires_at,
        )
        self.db.add(record)
        self.db.commit()
        self.db.refresh(record)
        return record

    def record_revocation(
        self,
        capability_id: str,
        reason: str,
    ) -> CapabilityHistoryModel | None:
        record = (
            self.db.query(CapabilityHistoryModel)
            .filter(CapabilityHistoryModel.capability_id == capability_id)
            .order_by(CapabilityHistoryModel.id.desc())
            .first()
        )
        if record:
            record.status = "REVOKED"
            record.revoked_at = datetime.now(timezone.utc)
            record.revocation_reason = reason
            self.db.commit()
            self.db.refresh(record)
        return record

    def list_by_task(self, task_id: str) -> list[CapabilityHistoryModel]:
        return (
            self.db.query(CapabilityHistoryModel)
            .filter(CapabilityHistoryModel.task_id == task_id)
            .all()
        )
