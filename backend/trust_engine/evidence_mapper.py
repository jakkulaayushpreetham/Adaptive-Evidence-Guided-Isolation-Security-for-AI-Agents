from __future__ import annotations

from typing import Any

from backend.capability.capability import Operation
from backend.monitoring.security_event import (
    SecurityEvent,
    SecurityEventType,
)
from backend.reference_monitor.authorization import Decision
from backend.trust_engine.dynamic_evidence_engine import DynamicMassGenerator
from backend.trust_engine.evidence import Evidence
from backend.trust_engine.mass_function import MassFunction


class EvidenceMapper:
    """
    Maps runtime security events into D-S evidence.

    Supports both calibrated baseline mode (for baseline benchmarks) and
    advanced dynamic mode (incorporating sensitivity, velocity, temporal decay,
    and canary tripwires).
    """

    AUTHORIZED_OPERATION = MassFunction(
        trustworthy=0.75,
        untrustworthy=0.05,
        uncertainty=0.20,
    )

    UNAUTHORIZED_NETWORK = MassFunction(
        trustworthy=0.10,
        untrustworthy=0.60,
        uncertainty=0.30,
    )

    UNAUTHORIZED_FILE = MassFunction(
        trustworthy=0.05,
        untrustworthy=0.70,
        uncertainty=0.25,
    )

    REPEATED_UNAUTHORIZED = MassFunction(
        trustworthy=0.05,
        untrustworthy=0.80,
        uncertainty=0.15,
    )

    GENERIC_DENIAL = MassFunction(
        trustworthy=0.10,
        untrustworthy=0.55,
        uncertainty=0.35,
    )

    UNKNOWN_EVENT = MassFunction(
        trustworthy=0.05,
        untrustworthy=0.05,
        uncertainty=0.90,
    )

    def __init__(
        self,
        *,
        dynamic_generator: DynamicMassGenerator | None = None,
        use_dynamic: bool = False,
    ) -> None:
        self.dynamic_generator = dynamic_generator or DynamicMassGenerator()
        self.use_dynamic = use_dynamic
        self.last_telemetry: dict[str, Any] = {}

    def map(
        self,
        event: SecurityEvent,
        *,
        repeated: bool = False,
    ) -> Evidence:
        if self.use_dynamic:
            evidence, telemetry = self.map_dynamic(event, repeated=repeated)
            self.last_telemetry = telemetry
            return evidence

        mass = self._select_mass(
            event,
            repeated=repeated,
        )

        return Evidence(
            source_event_id=event.event_id,
            source_type=event.event_type.value,
            mass=mass,
        )

    def map_dynamic(
        self,
        event: SecurityEvent,
        *,
        repeated: bool = False,
        timestamp: float | None = None,
    ) -> tuple[Evidence, dict[str, Any]]:
        mass, telemetry = self.dynamic_generator.generate(
            event,
            repeated=repeated,
            timestamp=timestamp,
        )
        self.last_telemetry = telemetry
        evidence = Evidence(
            source_event_id=event.event_id,
            source_type=event.event_type.value,
            mass=mass,
        )
        return evidence, telemetry

    def _select_mass(
        self,
        event: SecurityEvent,
        *,
        repeated: bool,
    ) -> MassFunction:
        if (
            event.event_type is SecurityEventType.AUTHORIZED_OPERATION
            and event.decision is Decision.ALLOW
        ):
            return self.AUTHORIZED_OPERATION

        if event.decision is Decision.DENY:
            if repeated:
                return self.REPEATED_UNAUTHORIZED

            if event.operation is Operation.NETWORK:
                return self.UNAUTHORIZED_NETWORK

            if event.operation in {
                Operation.READ_FILE,
                Operation.WRITE_FILE,
                Operation.DELETE_FILE,
            }:
                return self.UNAUTHORIZED_FILE

            return self.GENERIC_DENIAL

        return self.UNKNOWN_EVENT