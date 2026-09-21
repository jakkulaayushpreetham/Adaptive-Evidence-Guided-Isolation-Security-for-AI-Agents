from __future__ import annotations

from datetime import datetime, timezone
from sqlalchemy import Column, String, Float, Integer, DateTime, Boolean

from backend.database.database import Base


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class AgentModel(Base):
    __tablename__ = "agents"

    agent_id = Column(String(64), primary_key=True, index=True)
    status = Column(String(32), default="ACTIVE", nullable=False)
    created_at = Column(DateTime, default=utc_now, nullable=False)


class TaskModel(Base):
    __tablename__ = "tasks"

    task_id = Column(String(64), primary_key=True, index=True)
    agent_id = Column(String(64), nullable=False, index=True)
    description = Column(String(512), nullable=False)
    status = Column(String(32), default="CREATED", nullable=False)
    created_at = Column(DateTime, default=utc_now, nullable=False)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now, nullable=False)


class CapabilityHistoryModel(Base):
    __tablename__ = "capability_history"

    id = Column(Integer, primary_key=True, autoincrement=True)
    capability_id = Column(String(64), nullable=False, index=True)
    agent_id = Column(String(64), nullable=False, index=True)
    task_id = Column(String(64), nullable=False, index=True)
    operation = Column(String(32), nullable=False)
    resource = Column(String(256), nullable=False)
    status = Column(String(32), nullable=False)
    created_at = Column(DateTime, default=utc_now, nullable=False)
    expires_at = Column(DateTime, nullable=True)
    revoked_at = Column(DateTime, nullable=True)
    revocation_reason = Column(String(256), nullable=True)


class SecurityEventModel(Base):
    __tablename__ = "security_events"

    event_id = Column(String(64), primary_key=True, index=True)
    agent_id = Column(String(64), nullable=False, index=True)
    task_id = Column(String(64), nullable=False, index=True)
    operation = Column(String(32), nullable=False)
    resource = Column(String(256), nullable=False)
    decision = Column(String(16), nullable=False)
    reason = Column(String(256), nullable=False)
    capability_id = Column(String(64), nullable=True)
    timestamp = Column(DateTime, default=utc_now, nullable=False, index=True)


class TrustSnapshotModel(Base):
    __tablename__ = "trust_snapshots"

    id = Column(Integer, primary_key=True, autoincrement=True)
    agent_id = Column(String(64), nullable=False, index=True)
    task_id = Column(String(64), nullable=False, index=True)
    m_T = Column(Float, nullable=False)
    m_U = Column(Float, nullable=False)
    m_Theta = Column(Float, nullable=False)
    conflict_K = Column(Float, nullable=False)
    evidence_count = Column(Integer, nullable=False)
    timestamp = Column(DateTime, default=utc_now, nullable=False, index=True)


class PolicyTransitionModel(Base):
    __tablename__ = "policy_transitions"

    id = Column(Integer, primary_key=True, autoincrement=True)
    agent_id = Column(String(64), nullable=False, index=True)
    task_id = Column(String(64), nullable=False, index=True)
    previous_state = Column(String(32), nullable=False)
    new_state = Column(String(32), nullable=False)
    reason = Column(String(256), nullable=False)
    timestamp = Column(DateTime, default=utc_now, nullable=False, index=True)


class RevocationModel(Base):
    __tablename__ = "revocations"

    id = Column(Integer, primary_key=True, autoincrement=True)
    capability_id = Column(String(64), nullable=False, index=True)
    agent_id = Column(String(64), nullable=False, index=True)
    task_id = Column(String(64), nullable=False, index=True)
    reason = Column(String(256), nullable=False)
    timestamp = Column(DateTime, default=utc_now, nullable=False, index=True)
