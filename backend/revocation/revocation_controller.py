"""Controls dynamic revocation of capabilities upon policy trigger."""
from __future__ import annotations

from dataclasses import dataclass

from backend.capability.capability import (
    Capability,
    Operation,
)
from backend.capability.capability_manager import CapabilityManager
from backend.policy.adaptive_policy import PolicyDecision
from backend.policy.security_states import SecurityState


@dataclass(frozen=True, slots=True)
class RevocationResult:
    agent_id: str
    task_id: str
    state: SecurityState

    revoked_capabilities: tuple[Capability, ...]

    isolation_required: bool
    reason: str


class RevocationController:
    """
    Converts adaptive-policy decisions into capability changes.

    NORMAL:
        No capability changes.

    RESTRICTED:
        Revoke higher-risk capabilities.

    CRITICAL:
        Revoke all capabilities and request isolation.
    """

    RESTRICTED_OPERATIONS = (
        Operation.WRITE_FILE,
        Operation.NETWORK,
        Operation.EXECUTE,
        Operation.DELETE_FILE,
    )

    def __init__(
        self,
        capability_manager: CapabilityManager,
    ) -> None:
        self._capability_manager = capability_manager

    def apply(
        self,
        *,
        agent_id: str,
        task_id: str,
        decision: PolicyDecision,
    ) -> RevocationResult:

        state = decision.proposed_state

        if state is SecurityState.NORMAL:
            return RevocationResult(
                agent_id=agent_id,
                task_id=task_id,
                state=state,
                revoked_capabilities=(),
                isolation_required=False,
                reason="No capability revocation required.",
            )

        if state is SecurityState.RESTRICTED:
            revoked = self._restrict(
                agent_id=agent_id,
                task_id=task_id,
                reason=decision.reason,
            )

            return RevocationResult(
                agent_id=agent_id,
                task_id=task_id,
                state=state,
                revoked_capabilities=revoked,
                isolation_required=False,
                reason=decision.reason,
            )

        revoked = self._capability_manager.revoke_all(
            agent_id=agent_id,
            task_id=task_id,
            reason=decision.reason,
        )

        return RevocationResult(
            agent_id=agent_id,
            task_id=task_id,
            state=SecurityState.CRITICAL,
            revoked_capabilities=revoked,
            isolation_required=True,
            reason=decision.reason,
        )

    def _restrict(
        self,
        *,
        agent_id: str,
        task_id: str,
        reason: str,
    ) -> tuple[Capability, ...]:

        revoked: list[Capability] = []

        for operation in self.RESTRICTED_OPERATIONS:
            revoked.extend(
                self._capability_manager.revoke_operation(
                    agent_id=agent_id,
                    task_id=task_id,
                    operation=operation,
                    reason=reason,
                )
            )

        return tuple(revoked)