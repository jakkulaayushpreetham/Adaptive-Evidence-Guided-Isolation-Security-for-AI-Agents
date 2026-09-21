"""Controls dynamic revocation and attenuation of capabilities upon policy trigger."""
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
        No capability changes (or restore attenuated capabilities upon recovery).

    RESTRICTED:
        Revoke higher-risk capabilities or enforce dynamic attenuation.

    CRITICAL:
        Revoke all capabilities and request isolation / container freeze.
    """

    RESTRICTED_OPERATIONS = (
        Operation.WRITE_FILE,
        Operation.NETWORK,
        Operation.EXECUTE,
        Operation.DELETE_FILE,
        Operation.KEYSTORE_ACCESS,
        Operation.MEMORY_WRITE,
        Operation.IPC_CALL,
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
            # If recovering from RESTRICTED, restore any attenuated capabilities
            if decision.previous_state is SecurityState.RESTRICTED:
                self.restore(agent_id=agent_id, task_id=task_id)

            return RevocationResult(
                agent_id=agent_id,
                task_id=task_id,
                state=state,
                revoked_capabilities=(),
                isolation_required=False,
                reason=decision.reason if decision.previous_state is not SecurityState.NORMAL else "No capability revocation required.",
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

    def attenuate(
        self,
        *,
        agent_id: str,
        task_id: str,
        narrowed_resource: str | None = None,
        compressed_ttl_seconds: int | None = None,
        rate_limit_per_minute: int | None = None,
    ) -> list[Capability]:
        """Attenuates all active capabilities for a task without full revocation."""
        capabilities = self._capability_manager._store.find_for_task(agent_id, task_id)
        attenuated: list[Capability] = []
        for cap in capabilities:
            if cap.is_active():
                cap.attenuate(
                    narrowed_resource=narrowed_resource,
                    compressed_ttl_seconds=compressed_ttl_seconds,
                    rate_limit_per_minute=rate_limit_per_minute,
                )
                attenuated.append(cap)
        return attenuated

    def restore(
        self,
        *,
        agent_id: str,
        task_id: str,
    ) -> list[Capability]:
        """Restores unattenuated parameters for all capabilities of a rehabilitated task."""
        capabilities = self._capability_manager._store.find_for_task(agent_id, task_id)
        restored: list[Capability] = []
        for cap in capabilities:
            if cap.is_attenuated:
                cap.restore_attenuation()
                restored.append(cap)
        return restored

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