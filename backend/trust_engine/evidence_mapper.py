from __future__ import annotations

from backend.capability.capability import Operation
from backend.monitoring.security_event import (
    SecurityEvent,
    SecurityEventType,
)
from backend.reference_monitor.authorization import Decision
from backend.trust_engine.evidence import Evidence
from backend.trust_engine.mass_function import MassFunction


class EvidenceMapper:
    """
    Maps runtime security events into D-S evidence.

    IMPORTANT:
    These mass assignments are prototype calibration parameters.
    They are NOT probabilities and are NOT universal constants.
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

    def map(
        self,
        event: SecurityEvent,
        *,
        repeated: bool = False,
    ) -> Evidence:

        mass = self._select_mass(
            event,
            repeated=repeated,
        )

        return Evidence(
            source_event_id=event.event_id,
            source_type=event.event_type.value,
            mass=mass,
        )

    def _select_mass(
        self,
        event: SecurityEvent,
        *,
        repeated: bool,
    ) -> MassFunction:

        if (
            event.event_type
            is SecurityEventType.AUTHORIZED_OPERATION
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