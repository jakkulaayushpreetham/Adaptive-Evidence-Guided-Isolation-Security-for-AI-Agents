from __future__ import annotations

from pydantic import BaseModel


class TrustMassResponse(BaseModel):
    trustworthy: float
    untrustworthy: float
    uncertainty: float


class TrustStateResponse(BaseModel):
    task_id: str
    security_state: str
    mass: TrustMassResponse
    belief_trustworthy: float
    plausibility_trustworthy: float
    conflict: float
    evidence_count: int
