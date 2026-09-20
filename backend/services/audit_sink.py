from __future__ import annotations

from typing import Protocol
from sqlalchemy.orm import Session

from backend.capability.capability import Capability
from backend.database.repositories.capability_repository import CapabilityRepository
from backend.database.repositories.event_repository import EventRepository
from backend.database.repositories.revocation_repository import RevocationRepository
from backend.database.repositories.trust_repository import TrustRepository
from backend.monitoring.security_event import SecurityEvent
from backend.trust_engine.trust_state import TrustState


class SecurityAuditSink(Protocol):
    def record_event(self, event: SecurityEvent) -> None: ...
    def record_trust_snapshot(self, agent_id: str, task_id: str, trust_state: TrustState) -> None: ...
    def record_policy_transition(self, agent_id: str, task_id: str, previous_state: str, new_state: str, reason: str) -> None: ...
    def record_revocation(self, capability_id: str, agent_id: str, task_id: str, reason: str) -> None: ...
    def record_capability_grant(self, capability: Capability) -> None: ...


class InMemoryAuditSink:
    """In-memory audit sink for testing without database dependencies."""
    def __init__(self) -> None:
        self.events: list[SecurityEvent] = []
        self.trust_snapshots: list[dict] = []
        self.policy_transitions: list[dict] = []
        self.revocations: list[dict] = []
        self.grants: list[Capability] = []

    def record_event(self, event: SecurityEvent) -> None:
        self.events.append(event)

    def record_trust_snapshot(self, agent_id: str, task_id: str, trust_state: TrustState) -> None:
        self.trust_snapshots.append({
            "agent_id": agent_id,
            "task_id": task_id,
            "m_T": trust_state.trustworthy,
            "m_U": trust_state.untrustworthy,
            "m_Theta": trust_state.uncertainty,
            "conflict_K": trust_state.last_conflict,
            "evidence_count": trust_state.evidence_count,
        })

    def record_policy_transition(self, agent_id: str, task_id: str, previous_state: str, new_state: str, reason: str) -> None:
        self.policy_transitions.append({
            "agent_id": agent_id,
            "task_id": task_id,
            "previous_state": previous_state,
            "new_state": new_state,
            "reason": reason,
        })

    def record_revocation(self, capability_id: str, agent_id: str, task_id: str, reason: str) -> None:
        self.revocations.append({
            "capability_id": capability_id,
            "agent_id": agent_id,
            "task_id": task_id,
            "reason": reason,
        })

    def record_capability_grant(self, capability: Capability) -> None:
        self.grants.append(capability)


class SqlAlchemyAuditSink:
    """Database-backed audit sink writing all security events to SQLite."""
    def __init__(self, db_session_factory) -> None:
        self._session_factory = db_session_factory

    def record_event(self, event: SecurityEvent) -> None:
        with self._session_factory() as db:
            repo = EventRepository(db)
            repo.record(
                event_id=event.event_id,
                agent_id=event.agent_id,
                task_id=event.task_id,
                operation=event.operation.value,
                resource=event.resource,
                decision=event.decision.value,
                reason=event.reason,
                capability_id=event.capability_id,
                timestamp=event.timestamp,
            )

    def record_trust_snapshot(self, agent_id: str, task_id: str, trust_state: TrustState) -> None:
        with self._session_factory() as db:
            repo = TrustRepository(db)
            repo.record_snapshot(
                agent_id=agent_id,
                task_id=task_id,
                m_T=trust_state.trustworthy,
                m_U=trust_state.untrustworthy,
                m_Theta=trust_state.uncertainty,
                conflict_K=trust_state.last_conflict,
                evidence_count=trust_state.evidence_count,
            )

    def record_policy_transition(self, agent_id: str, task_id: str, previous_state: str, new_state: str, reason: str) -> None:
        with self._session_factory() as db:
            repo = TrustRepository(db)
            repo.record_policy_transition(
                agent_id=agent_id,
                task_id=task_id,
                previous_state=previous_state,
                new_state=new_state,
                reason=reason,
            )

    def record_revocation(self, capability_id: str, agent_id: str, task_id: str, reason: str) -> None:
        with self._session_factory() as db:
            cap_repo = CapabilityRepository(db)
            cap_repo.record_revocation(capability_id=capability_id, reason=reason)
            rev_repo = RevocationRepository(db)
            rev_repo.record(
                capability_id=capability_id,
                agent_id=agent_id,
                task_id=task_id,
                reason=reason,
            )

    def record_capability_grant(self, capability: Capability) -> None:
        with self._session_factory() as db:
            cap_repo = CapabilityRepository(db)
            cap_repo.record_grant(
                capability_id=capability.capability_id,
                agent_id=capability.agent_id,
                task_id=capability.task_id,
                operation=capability.operation.value,
                resource=capability.resource,
                status=capability.status.value,
            )
