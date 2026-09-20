from __future__ import annotations

from datetime import datetime
from sqlalchemy.orm import Session
from backend.database.models import TrustSnapshotModel, PolicyTransitionModel


class TrustRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def record_snapshot(
        self,
        agent_id: str,
        task_id: str,
        m_T: float,
        m_U: float,
        m_Theta: float,
        conflict_K: float,
        evidence_count: int,
        timestamp: datetime | None = None,
    ) -> TrustSnapshotModel:
        kwargs = {
            "agent_id": agent_id,
            "task_id": task_id,
            "m_T": m_T,
            "m_U": m_U,
            "m_Theta": m_Theta,
            "conflict_K": conflict_K,
            "evidence_count": evidence_count,
        }
        if timestamp:
            kwargs["timestamp"] = timestamp

        snapshot = TrustSnapshotModel(**kwargs)
        self.db.add(snapshot)
        self.db.commit()
        self.db.refresh(snapshot)
        return snapshot

    def get_latest_snapshot(self, task_id: str) -> TrustSnapshotModel | None:
        return (
            self.db.query(TrustSnapshotModel)
            .filter(TrustSnapshotModel.task_id == task_id)
            .order_by(TrustSnapshotModel.id.desc())
            .first()
        )

    def list_snapshots(self, task_id: str) -> list[TrustSnapshotModel]:
        return (
            self.db.query(TrustSnapshotModel)
            .filter(TrustSnapshotModel.task_id == task_id)
            .order_by(TrustSnapshotModel.timestamp.asc())
            .all()
        )

    def record_policy_transition(
        self,
        agent_id: str,
        task_id: str,
        previous_state: str,
        new_state: str,
        reason: str,
        timestamp: datetime | None = None,
    ) -> PolicyTransitionModel:
        kwargs = {
            "agent_id": agent_id,
            "task_id": task_id,
            "previous_state": previous_state,
            "new_state": new_state,
            "reason": reason,
        }
        if timestamp:
            kwargs["timestamp"] = timestamp

        transition = PolicyTransitionModel(**kwargs)
        self.db.add(transition)
        self.db.commit()
        self.db.refresh(transition)
        return transition

    def list_policy_transitions(self, task_id: str) -> list[PolicyTransitionModel]:
        return (
            self.db.query(PolicyTransitionModel)
            .filter(PolicyTransitionModel.task_id == task_id)
            .order_by(PolicyTransitionModel.timestamp.asc())
            .all()
        )
