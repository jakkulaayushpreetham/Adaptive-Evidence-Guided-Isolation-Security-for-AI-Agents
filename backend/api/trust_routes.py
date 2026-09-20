from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from backend.database.database import get_db
from backend.database.repositories.trust_repository import TrustRepository
from backend.schemas.trust_schema import TrustStateResponse
from backend.services.security_service import get_security_service

router = APIRouter(prefix="/api/trust", tags=["Trust"])


@router.get("/task/{task_id}", response_model=TrustStateResponse)
def get_trust_state(task_id: str, db: Session = Depends(get_db)):
    sec_service = get_security_service()
    trust_repo = TrustRepository(db)
    snapshot = trust_repo.get_latest_snapshot(task_id)
    if not snapshot:
        raise HTTPException(status_code=404, detail="No trust records found for task")

    sec_state = sec_service.runtime.get_security_state(
        agent_id=snapshot.agent_id,
        task_id=task_id,
    )

    return {
        "task_id": task_id,
        "security_state": sec_state.name,
        "mass": {
            "trustworthy": snapshot.m_T,
            "untrustworthy": snapshot.m_U,
            "uncertainty": snapshot.m_Theta,
        },
        "belief_trustworthy": snapshot.m_T,
        "plausibility_trustworthy": snapshot.m_T + snapshot.m_Theta,
        "conflict": snapshot.conflict_K,
        "evidence_count": snapshot.evidence_count,
    }


@router.get("/task/{task_id}/history")
def get_trust_history(task_id: str, db: Session = Depends(get_db)):
    trust_repo = TrustRepository(db)
    snapshots = trust_repo.list_snapshots(task_id)
    return [
        {
            "id": s.id,
            "agent_id": s.agent_id,
            "task_id": s.task_id,
            "m_T": s.m_T,
            "m_U": s.m_U,
            "m_Theta": s.m_Theta,
            "conflict_K": s.conflict_K,
            "evidence_count": s.evidence_count,
            "timestamp": s.timestamp.isoformat(),
        }
        for s in snapshots
    ]
