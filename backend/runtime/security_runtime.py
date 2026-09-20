from __future__ import annotations

from dataclasses import dataclass
from threading import RLock

from backend.capability.capability import Operation
from backend.policy.policy_engine import AdaptivePolicyEngine
from backend.policy.security_states import SecurityState
from backend.reference_monitor.authorization import AuthorizationResult
from backend.reference_monitor.monitor import ReferenceMonitor
from backend.revocation.isolation_manager import IsolationManager
from backend.revocation.revocation_controller import RevocationController
from backend.trust_engine.dempster_shafer import DempsterShaferEngine
from backend.trust_engine.evidence_mapper import EvidenceMapper
from backend.trust_engine.trust_state import TrustState


@dataclass(frozen=True, slots=True)
class RuntimeResult:
    authorization: AuthorizationResult
    security_state: SecurityState
    trustworthy: float
    untrustworthy: float
    uncertainty: float
    conflict: float
    isolation_required: bool


class SecurityRuntime:
    """
    Trusted host-side coordinator for the AEGIS-AI security loop.

    Protected operations must pass through this runtime before execution.
    """

    def __init__(
        self,
        *,
        reference_monitor: ReferenceMonitor,
        evidence_mapper: EvidenceMapper,
        ds_engine: DempsterShaferEngine,
        policy_engine: AdaptivePolicyEngine,
        revocation_controller: RevocationController,
        isolation_manager: IsolationManager | None = None,
        audit_sink: Any | None = None,
    ) -> None:
        self._reference_monitor = reference_monitor
        self._evidence_mapper = evidence_mapper
        self._ds_engine = ds_engine
        self._policy_engine = policy_engine
        self._revocation_controller = revocation_controller
        self._isolation_manager = isolation_manager
        self._audit_sink = audit_sink

        self._trust_states: dict[tuple[str, str], TrustState] = {}
        self._security_states: dict[
            tuple[str, str], SecurityState
        ] = {}

        self._lock = RLock()

    def evaluate(
        self,
        *,
        agent_id: str,
        task_id: str,
        operation: Operation,
        resource: str,
        repeated: bool = False,
    ) -> RuntimeResult:

        key = (agent_id, task_id)

        with self._lock:
            current_security_state = self._security_states.get(
                key,
                SecurityState.NORMAL,
            )

            # Fail closed once the task is critical.
            if current_security_state is SecurityState.CRITICAL:
                authorization, _ = self._reference_monitor.authorize(
                    agent_id=agent_id,
                    task_id=task_id,
                    operation=operation,
                    resource=resource,
                )

                trust = self._get_trust_state(
                    agent_id,
                    task_id,
                )

                return RuntimeResult(
                    authorization=authorization,
                    security_state=SecurityState.CRITICAL,
                    trustworthy=trust.trustworthy,
                    untrustworthy=trust.untrustworthy,
                    uncertainty=trust.uncertainty,
                    conflict=trust.last_conflict,
                    isolation_required=True,
                )

            authorization, event = (
                self._reference_monitor.authorize(
                    agent_id=agent_id,
                    task_id=task_id,
                    operation=operation,
                    resource=resource,
                )
            )

            evidence = self._evidence_mapper.map(
                event,
                repeated=repeated,
            )

            trust = self._get_trust_state(
                agent_id,
                task_id,
            )

            trust.apply(
                evidence,
                self._ds_engine,
            )

            decision = self._policy_engine.evaluate(
                trust,
                current_security_state,
            )

            revocation = self._revocation_controller.apply(
                agent_id=agent_id,
                task_id=task_id,
                decision=decision,
            )

            self._security_states[key] = (
                decision.proposed_state
            )

            if self._audit_sink is not None:
                self._audit_sink.record_event(event)
                self._audit_sink.record_trust_snapshot(agent_id, task_id, trust)
                if decision.state_changed:
                    self._audit_sink.record_policy_transition(
                        agent_id=agent_id,
                        task_id=task_id,
                        previous_state=decision.previous_state.name,
                        new_state=decision.proposed_state.name,
                        reason=decision.reason,
                    )
                for cap in revocation.revoked_capabilities:
                    self._audit_sink.record_revocation(
                        capability_id=cap.capability_id,
                        agent_id=agent_id,
                        task_id=task_id,
                        reason=decision.reason,
                    )

            if revocation.isolation_required:
                try:
                    from backend.api.websocket import manager as ws_manager
                    envelope = ws_manager.create_envelope("AGENT_ISOLATED", task_id, {
                        "agent_id": agent_id,
                        "task_id": task_id,
                        "reason": decision.reason,
                        "status": "ISOLATION_REQUESTED",
                    })
                    ws_manager.broadcast_sync(envelope)
                except Exception:
                    pass

                if self._isolation_manager is not None:
                    self._isolation_manager.isolate(
                        agent_id=agent_id,
                        task_id=task_id,
                        reason=decision.reason,
                    )

            return RuntimeResult(
                authorization=authorization,
                security_state=decision.proposed_state,
                trustworthy=trust.trustworthy,
                untrustworthy=trust.untrustworthy,
                uncertainty=trust.uncertainty,
                conflict=trust.last_conflict,
                isolation_required=revocation.isolation_required,
            )

    def get_security_state(
        self,
        *,
        agent_id: str,
        task_id: str,
    ) -> SecurityState:

        return self._security_states.get(
            (agent_id, task_id),
            SecurityState.NORMAL,
        )

    def get_trust_state(
        self,
        *,
        agent_id: str,
        task_id: str,
    ) -> TrustState:

        return self._get_trust_state(
            agent_id,
            task_id,
        )

    def _get_trust_state(
        self,
        agent_id: str,
        task_id: str,
    ) -> TrustState:

        key = (agent_id, task_id)

        state = self._trust_states.get(key)

        if state is None:
            state = TrustState(
                agent_id=agent_id,
                task_id=task_id,
            )

            self._trust_states[key] = state

        return state
