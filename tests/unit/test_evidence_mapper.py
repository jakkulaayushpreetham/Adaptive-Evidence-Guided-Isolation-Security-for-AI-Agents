"""Unit test: Event to Dempster-Shafer mass mapping."""
from backend.capability.capability import Operation
from backend.monitoring.security_event import (
    SecurityEvent,
    SecurityEventType,
)
from backend.reference_monitor.authorization import Decision
from backend.trust_engine.evidence_mapper import EvidenceMapper


def make_event(
    *,
    operation: Operation,
    decision: Decision,
    event_type: SecurityEventType,
) -> SecurityEvent:

    return SecurityEvent(
        agent_id="AGENT-001",
        task_id="TASK-001",
        event_type=event_type,
        operation=operation,
        resource="/test/resource",
        decision=decision,
        reason="TEST",
    )


def test_authorized_operation_maps_to_positive_evidence():
    mapper = EvidenceMapper()

    event = make_event(
        operation=Operation.READ_FILE,
        decision=Decision.ALLOW,
        event_type=SecurityEventType.AUTHORIZED_OPERATION,
    )

    evidence = mapper.map(event)

    assert evidence.mass.trustworthy == 0.75
    assert evidence.mass.untrustworthy == 0.05
    assert evidence.mass.uncertainty == 0.20


def test_network_denial_maps_to_suspicious_evidence():
    mapper = EvidenceMapper()

    event = make_event(
        operation=Operation.NETWORK,
        decision=Decision.DENY,
        event_type=SecurityEventType.UNAUTHORIZED_OPERATION,
    )

    evidence = mapper.map(event)

    assert evidence.mass.trustworthy == 0.10
    assert evidence.mass.untrustworthy == 0.60
    assert evidence.mass.uncertainty == 0.30


def test_file_denial_maps_to_stronger_distrust():
    mapper = EvidenceMapper()

    event = make_event(
        operation=Operation.READ_FILE,
        decision=Decision.DENY,
        event_type=SecurityEventType.UNAUTHORIZED_OPERATION,
    )

    evidence = mapper.map(event)

    assert evidence.mass.trustworthy == 0.05
    assert evidence.mass.untrustworthy == 0.70
    assert evidence.mass.uncertainty == 0.25


def test_repeated_violation_maps_to_stronger_evidence():
    mapper = EvidenceMapper()

    event = make_event(
        operation=Operation.NETWORK,
        decision=Decision.DENY,
        event_type=SecurityEventType.UNAUTHORIZED_OPERATION,
    )

    evidence = mapper.map(
        event,
        repeated=True,
    )

    assert evidence.mass.trustworthy == 0.05
    assert evidence.mass.untrustworthy == 0.80
    assert evidence.mass.uncertainty == 0.15