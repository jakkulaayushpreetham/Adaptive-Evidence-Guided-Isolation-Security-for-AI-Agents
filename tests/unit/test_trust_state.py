import pytest

from backend.trust_engine.dempster_shafer import (
    DempsterShaferEngine,
)
from backend.trust_engine.evidence import Evidence
from backend.trust_engine.mass_function import MassFunction
from backend.trust_engine.trust_state import TrustState


def test_trust_state_starts_with_complete_uncertainty():
    state = TrustState(
        agent_id="AGENT-001",
        task_id="TASK-001",
    )

    assert state.trustworthy == 0.0
    assert state.untrustworthy == 0.0
    assert state.uncertainty == 1.0
    assert state.evidence_count == 0


def test_first_evidence_replaces_vacuous_state():
    engine = DempsterShaferEngine()

    state = TrustState(
        agent_id="AGENT-001",
        task_id="TASK-001",
    )

    evidence = Evidence(
        source_event_id="EVT-001",
        source_type="UNAUTHORIZED_OPERATION",
        mass=MassFunction(
            trustworthy=0.10,
            untrustworthy=0.60,
            uncertainty=0.30,
        ),
    )

    state.apply(evidence, engine)

    assert state.trustworthy == pytest.approx(0.10)
    assert state.untrustworthy == pytest.approx(0.60)
    assert state.uncertainty == pytest.approx(0.30)
    assert state.evidence_count == 1


def test_two_suspicious_events_accumulate():
    engine = DempsterShaferEngine()

    state = TrustState(
        agent_id="AGENT-001",
        task_id="TASK-001",
    )

    network = Evidence(
        source_event_id="EVT-001",
        source_type="NETWORK_DENIAL",
        mass=MassFunction(
            trustworthy=0.10,
            untrustworthy=0.60,
            uncertainty=0.30,
        ),
    )

    private_file = Evidence(
        source_event_id="EVT-002",
        source_type="PRIVATE_FILE_DENIAL",
        mass=MassFunction(
            trustworthy=0.05,
            untrustworthy=0.70,
            uncertainty=0.25,
        ),
    )

    state.apply(network, engine)
    state.apply(private_file, engine)

    assert state.trustworthy == pytest.approx(0.05)
    assert state.untrustworthy == pytest.approx(
        0.8666666667
    )
    assert state.uncertainty == pytest.approx(
        0.0833333333
    )

    assert state.last_conflict == pytest.approx(0.10)
    assert state.evidence_count == 2
