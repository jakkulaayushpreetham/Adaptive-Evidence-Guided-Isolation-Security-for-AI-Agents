"""Unit tests for the dynamic evidence fusion engine."""
from backend.capability.capability import Operation
from backend.monitoring.security_event import SecurityEvent, SecurityEventType
from backend.reference_monitor.authorization import Decision
from backend.trust_engine.dynamic_evidence_engine import (
    CanaryTripwireDetector,
    DynamicMassGenerator,
    ResourceSensitivityClassifier,
    TemporalDecayEngine,
    VelocityTracker,
)


def test_resource_sensitivity_hierarchy():
    classifier = ResourceSensitivityClassifier()

    s_root = classifier.classify("/etc/shadow", Operation.READ_FILE)
    s_secret = classifier.classify("/workspace/.env", Operation.READ_FILE)
    s_output = classifier.classify("/workspace/output/report.txt", Operation.WRITE_FILE)
    s_scratch = classifier.classify("/tmp/scratch.txt", Operation.READ_FILE)

    assert s_root > s_secret > s_output > s_scratch
    assert s_root >= 0.80
    assert s_scratch <= 0.25


def test_velocity_tracker_burst_detection():
    tracker = VelocityTracker(window_seconds=5.0, burst_threshold=3)
    agent = "AGENT-VEL"
    task = "TASK-VEL"

    v1 = tracker.record_and_compute(agent, task, timestamp=100.0)
    assert v1 == 1.0

    v2 = tracker.record_and_compute(agent, task, timestamp=100.1)
    v3 = tracker.record_and_compute(agent, task, timestamp=100.2)
    v4 = tracker.record_and_compute(agent, task, timestamp=100.3)

    assert v4 > 1.0  # Burst multiplier kicks in
    assert tracker.get_event_rate(agent, task) > 0.0


def test_temporal_decay_calculation():
    decay = TemporalDecayEngine(decay_lambda=0.01)

    initial_mass = 0.80
    decayed_short = decay.compute_decay(initial_mass, elapsed_seconds=10.0)
    decayed_long = decay.compute_decay(initial_mass, elapsed_seconds=200.0)

    assert decayed_short < initial_mass
    assert decayed_long < decayed_short
    assert decayed_long > 0.0


def test_canary_tripwire_detection():
    detector = CanaryTripwireDetector()

    assert detector.check("/workspace/normal_input.txt") is None

    trap_file = detector.check("/workspace/.canary/vault_key.json")
    assert trap_file is not None
    assert "CANARY" in trap_file.trap_id

    trap_net = detector.check("https://internal-canary.vault/keys")
    assert trap_net is not None
    assert trap_net.resource_type == "NETWORK"


def test_dynamic_mass_generator_canary_trip():
    generator = DynamicMassGenerator()

    event = SecurityEvent(
        agent_id="AGENT-CANARY",
        task_id="TASK-CANARY",
        event_type=SecurityEventType.UNAUTHORIZED_OPERATION,
        operation=Operation.READ_FILE,
        resource="/workspace/.canary/vault_key.json",
        decision=Decision.DENY,
        reason="NO_CAPABILITY",
    )

    mass, telemetry = generator.generate(event)

    assert telemetry["canary_tripped"] is True
    assert mass.untrustworthy >= 0.95
    assert mass.trustworthy == 0.00
