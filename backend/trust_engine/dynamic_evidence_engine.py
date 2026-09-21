"""
Dynamic, Context-Aware Evidence Generation Engine for AEGIS-AI.

Replaces static, hardcoded Dempster-Shafer mass assignment with a mathematically
grounded, multi-vector evidence generator that incorporates:
1. Resource Sensitivity Hierarchy (Sr in [0.1, 1.0])
2. Sliding-Window Velocity & Burst Analysis (V in [1.0, 3.0])
3. Temporal Half-Life Decay (lambda)
4. Synthetic Canary / Honeytoken Tripwires
"""
from __future__ import annotations

from collections import deque
from dataclasses import dataclass, field
from datetime import datetime, timezone
import math
from threading import RLock
from typing import Sequence

from backend.capability.capability import Operation
from backend.monitoring.security_event import SecurityEvent, SecurityEventType
from backend.reference_monitor.authorization import Decision
from backend.trust_engine.evidence import Evidence
from backend.trust_engine.mass_function import MassFunction


@dataclass(frozen=True, slots=True)
class CanaryTripwire:
    trap_id: str
    pattern: str
    resource_type: str  # "FILE" or "NETWORK"
    description: str


class CanaryTripwireDetector:
    """Detects attempts to access synthetic honeytokens or canary traps."""

    DEFAULT_TRAPS: Sequence[CanaryTripwire] = (
        CanaryTripwire(
            trap_id="CANARY-FILE-01",
            pattern=".canary",
            resource_type="FILE",
            description="Synthetic canary directory probe",
        ),
        CanaryTripwire(
            trap_id="CANARY-FILE-02",
            pattern="vault_key",
            resource_type="FILE",
            description="Decoy credentials honeytoken probe",
        ),
        CanaryTripwire(
            trap_id="CANARY-FILE-03",
            pattern="aws_credentials",
            resource_type="FILE",
            description="Decoy cloud secrets probe",
        ),
        CanaryTripwire(
            trap_id="CANARY-NET-01",
            pattern="internal-canary.vault",
            resource_type="NETWORK",
            description="Honeypot internal exfiltration endpoint",
        ),
        CanaryTripwire(
            trap_id="CANARY-NET-02",
            pattern="169.254.169.254",
            resource_type="NETWORK",
            description="Cloud instance metadata SSRF attempt",
        ),
    )

    def __init__(self, traps: Sequence[CanaryTripwire] | None = None) -> None:
        self._traps = list(traps) if traps is not None else list(self.DEFAULT_TRAPS)
        self._lock = RLock()

    def register_trap(self, trap: CanaryTripwire) -> None:
        with self._lock:
            self._traps.append(trap)

    def check(self, resource: str) -> CanaryTripwire | None:
        lowered = resource.lower()
        with self._lock:
            for trap in self._traps:
                if trap.pattern.lower() in lowered:
                    return trap
        return None

    def list_traps(self) -> list[CanaryTripwire]:
        with self._lock:
            return list(self._traps)


class ResourceSensitivityClassifier:
    """
    Computes a sensitivity coefficient S_r in [0.10, 1.00] based on resource paths
    and requested operations.
    """

    @staticmethod
    def classify(resource: str, operation: Operation) -> float:
        lowered = resource.lower().replace("\\", "/")

        # 1. Root and OS system resources (Highest system severity)
        if any(
            lowered.startswith(prefix)
            for prefix in ("/etc", "/sys", "/proc", "/root", "/var/run", "c:/windows")
        ) or "docker.sock" in lowered:
            base_s = 0.95

        # 2. Secret keys, credentials, and env files
        elif any(
            sec in lowered
            for sec in (".env", "id_rsa", ".ssh", "secrets", "passwd", "shadow", "credentials")
        ):
            base_s = 0.90

        # 3. System execution or scripts
        elif any(lowered.endswith(ext) for ext in (".sh", ".bat", ".ps1", ".exe", ".bin")):
            base_s = 0.75

        # 4. Input datasets (read-only research assets)
        elif "/input/" in lowered or lowered.startswith("/input"):
            base_s = 0.45

        # 5. Output directory (standard workspace)
        elif "/output/" in lowered or lowered.startswith("/output"):
            base_s = 0.30

        # 6. Scratch / temporary directory
        elif "scratch" in lowered or "tmp" in lowered:
            base_s = 0.15

        else:
            base_s = 0.40

        # Operation amplifier
        op_weight = {
            Operation.EXECUTE: 1.15,
            Operation.DELETE_FILE: 1.10,
            Operation.NETWORK: 1.05,
            Operation.WRITE_FILE: 1.00,
            Operation.READ_FILE: 0.85,
        }.get(operation, 1.00)

        sensitivity = min(1.0, max(0.10, base_s * op_weight))
        return round(sensitivity, 3)


class VelocityTracker:
    """
    Monitors sliding-window event rate per agent/task to detect rapid automated bursts.
    Produces a velocity multiplier V in [1.0, 3.0].
    """

    def __init__(
        self,
        *,
        window_seconds: float = 5.0,
        burst_threshold: int = 4,
    ) -> None:
        self._window = window_seconds
        self._threshold = burst_threshold
        self._history: dict[tuple[str, str], deque[float]] = {}
        self._lock = RLock()

    def record_and_compute(self, agent_id: str, task_id: str, timestamp: float | None = None) -> float:
        now = timestamp if timestamp is not None else datetime.now(timezone.utc).timestamp()
        key = (agent_id, task_id)

        with self._lock:
            if key not in self._history:
                self._history[key] = deque()

            queue = self._history[key]
            queue.append(now)

            # Purge events older than sliding window
            cutoff = now - self._window
            while queue and queue[0] < cutoff:
                queue.popleft()

            count = len(queue)

            if count <= 1:
                return 1.0

            # Scale burst multiplier up to 3.0x if frequency exceeds threshold
            ratio = count / float(self._threshold)
            multiplier = 1.0 + min(2.0, max(0.0, (ratio - 0.5) * 1.5))
            return round(multiplier, 2)

    def get_event_rate(self, agent_id: str, task_id: str) -> float:
        key = (agent_id, task_id)
        with self._lock:
            queue = self._history.get(key)
            if not queue or len(queue) <= 1:
                return 0.0
            return round(len(queue) / self._window, 2)


class TemporalDecayEngine:
    """
    Applies exponential decay m_t(U) = m_0(U) * exp(-lambda * delta_t) to stale evidence.
    Ensures isolated past glitches smoothly decay if compliant behavior is maintained.
    """

    def __init__(self, decay_lambda: float = 0.005) -> None:
        # Default lambda = 0.005 -> half-life of ~138 seconds
        self._lambda = decay_lambda

    def compute_decay(self, initial_mass: float, elapsed_seconds: float) -> float:
        if elapsed_seconds <= 0.0:
            return initial_mass
        factor = math.exp(-self._lambda * elapsed_seconds)
        return max(0.01, round(initial_mass * factor, 4))


class DynamicMassGenerator:
    """
    Synthesizes multi-vector runtime features into a context-aware Dempster-Shafer MassFunction.
    """

    def __init__(
        self,
        *,
        canary_detector: CanaryTripwireDetector | None = None,
        velocity_tracker: VelocityTracker | None = None,
        decay_engine: TemporalDecayEngine | None = None,
    ) -> None:
        self.canary_detector = canary_detector or CanaryTripwireDetector()
        self.velocity_tracker = velocity_tracker or VelocityTracker()
        self.decay_engine = decay_engine or TemporalDecayEngine()
        self.sensitivity_classifier = ResourceSensitivityClassifier()

    def generate(
        self,
        event: SecurityEvent,
        *,
        repeated: bool = False,
        timestamp: float | None = None,
    ) -> tuple[MassFunction, dict[str, float | str | bool]]:
        """
        Calculates dynamic mass assignment and returns contextual telemetry.
        """
        agent_id = event.agent_id
        task_id = event.task_id
        resource = event.resource
        operation = event.operation

        # 1. Canary tripwire check
        canary_trip = self.canary_detector.check(resource)
        if canary_trip is not None:
            # Immediate decisive evidence of adversarial compromise
            mass = MassFunction(
                trustworthy=0.00,
                untrustworthy=0.98,
                uncertainty=0.02,
            )
            telemetry = {
                "canary_tripped": True,
                "canary_id": canary_trip.trap_id,
                "canary_desc": canary_trip.description,
                "sensitivity": 1.0,
                "velocity": 1.0,
            }
            return mass, telemetry

        # 2. Resource sensitivity
        sensitivity = self.sensitivity_classifier.classify(resource, operation)

        # 3. Velocity tracking
        velocity = self.velocity_tracker.record_and_compute(agent_id, task_id, timestamp=timestamp)

        # 4. Contextual Mass Formulation
        if event.decision is Decision.ALLOW:
            # Compliant operation:
            # Higher sensitivity operations successfully authorized provide stronger proof of trustworthiness
            base_t = 0.70 + 0.15 * sensitivity
            # Repetitive compliant actions lower residual uncertainty
            base_u = 0.02
            mass_t = min(0.92, round(base_t, 3))
            mass_u = round(base_u, 3)
            mass_theta = round(1.0 - mass_t - mass_u, 3)

            mass = MassFunction(
                trustworthy=mass_t,
                untrustworthy=mass_u,
                uncertainty=mass_theta,
            )
        else:
            # Unauthorized operation / policy denial:
            # Scale untrustworthy mass dynamically by sensitivity and velocity burst
            base_untrustworthy = 0.68
            if repeated:
                base_untrustworthy = 0.82
            elif operation is Operation.NETWORK:
                base_untrustworthy = 0.68
            elif operation in {Operation.READ_FILE, Operation.WRITE_FILE, Operation.DELETE_FILE}:
                base_untrustworthy = 0.70

            # Apply sensitivity scaling and burst multiplier:
            # High sensitivity resources (e.g. /etc, .env) sharply amplify suspicion
            scaled_u = base_untrustworthy * (0.80 + 0.35 * sensitivity) * min(1.35, velocity)
            mass_u = min(0.95, max(0.50, round(scaled_u, 3)))
            mass_t = max(0.01, round(0.10 * (1.0 - mass_u), 3))
            mass_theta = round(max(0.02, 1.0 - mass_t - mass_u), 3)

            # Ensure strict sum-to-1 invariant
            excess = (mass_t + mass_u + mass_theta) - 1.0
            if abs(excess) > 1e-6:
                mass_theta = max(0.01, round(mass_theta - excess, 3))

            mass = MassFunction(
                trustworthy=mass_t,
                untrustworthy=mass_u,
                uncertainty=mass_theta,
            )

        telemetry = {
            "canary_tripped": False,
            "sensitivity": sensitivity,
            "velocity": velocity,
            "rate_per_sec": self.velocity_tracker.get_event_rate(agent_id, task_id),
        }
        return mass, telemetry
