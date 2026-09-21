"""
API routes for Dynamic Adaptive OS observability, telemetry, and honeypot canary controls.
"""
from __future__ import annotations

from fastapi import APIRouter
from pydantic import BaseModel, Field

from backend.services.security_service import get_security_service
from backend.trust_engine.dynamic_evidence_engine import CanaryTripwire

router = APIRouter(prefix="/api/dynamic", tags=["Dynamic Adaptive OS"])


class CanaryTrapResponse(BaseModel):
    trap_id: str
    pattern: str
    resource_type: str
    description: str


class DynamicTelemetryResponse(BaseModel):
    agent_id: str
    task_id: str
    security_state: str
    compliance_streak: int
    untrustworthy_mass: float
    trustworthy_mass: float
    uncertainty_mass: float
    conflict: float
    required_compliance_streak: int
    recovery_enabled: bool
    active_canaries_count: int


class CanaryCreateRequest(BaseModel):
    trap_id: str
    pattern: str
    resource_type: str = Field(default="FILE", description="'FILE' or 'NETWORK'")
    description: str


class DynamicPolicyConfig(BaseModel):
    allow_dynamic_recovery: bool
    required_compliance_streak: int
    decay_lambda: float


@router.get("/telemetry/{agent_id}/{task_id}", response_model=DynamicTelemetryResponse)
def get_dynamic_telemetry(agent_id: str, task_id: str):
    sec = get_security_service()
    trust = sec.runtime.get_trust_state(agent_id=agent_id, task_id=task_id)
    state = sec.runtime.get_security_state(agent_id=agent_id, task_id=task_id)

    canary_detector = getattr(sec.evidence_mapper.dynamic_generator, "canary_detector", None)
    canary_count = len(canary_detector.list_traps()) if canary_detector else 0

    return {
        "agent_id": agent_id,
        "task_id": task_id,
        "security_state": state.name,
        "compliance_streak": trust.compliance_streak,
        "untrustworthy_mass": trust.untrustworthy,
        "trustworthy_mass": trust.trustworthy,
        "uncertainty_mass": trust.uncertainty,
        "conflict": trust.last_conflict,
        "required_compliance_streak": sec.policy_engine._recovery_controller.required_compliance_streak,
        "recovery_enabled": sec.policy_engine.allow_dynamic_recovery,
        "active_canaries_count": canary_count,
    }


@router.get("/canaries", response_model=list[CanaryTrapResponse])
def list_canaries():
    sec = get_security_service()
    detector = sec.evidence_mapper.dynamic_generator.canary_detector
    traps = detector.list_traps()
    return [
        {
            "trap_id": t.trap_id,
            "pattern": t.pattern,
            "resource_type": t.resource_type,
            "description": t.description,
        }
        for t in traps
    ]


@router.post("/canaries", response_model=CanaryTrapResponse)
def create_canary(request: CanaryCreateRequest):
    sec = get_security_service()
    detector = sec.evidence_mapper.dynamic_generator.canary_detector
    trap = CanaryTripwire(
        trap_id=request.trap_id,
        pattern=request.pattern,
        resource_type=request.resource_type,
        description=request.description,
    )
    detector.register_trap(trap)
    return {
        "trap_id": trap.trap_id,
        "pattern": trap.pattern,
        "resource_type": trap.resource_type,
        "description": trap.description,
    }


@router.post("/config")
def update_dynamic_config(config: DynamicPolicyConfig):
    sec = get_security_service()
    sec.policy_engine.allow_dynamic_recovery = config.allow_dynamic_recovery
    sec.policy_engine._recovery_controller.required_compliance_streak = config.required_compliance_streak
    sec.evidence_mapper.dynamic_generator.decay_engine._lambda = config.decay_lambda
    return {"status": "CONFIG_UPDATED", "config": config.model_dump()}
