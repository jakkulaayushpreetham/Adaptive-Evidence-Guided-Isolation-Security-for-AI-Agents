from __future__ import annotations

from backend.capability.capability import (
    CapabilityStatus,
    Operation,
)
from backend.capability.capability_store import CapabilityStore
from backend.monitoring.security_event import (
    SecurityEvent,
    SecurityEventType,
)
from backend.reference_monitor.authorization import (
    AuthorizationResult,
    Decision,
)
from backend.reference_monitor.resource_matcher import ResourceMatcher


class ReferenceMonitor:

    def __init__(
        self,
        capability_store: CapabilityStore,
    ) -> None:

        self._store = capability_store
        self._matcher = ResourceMatcher()

    def authorize(
        self,
        *,
        agent_id: str,
        task_id: str,
        operation: Operation,
        resource: str,
    ) -> tuple[AuthorizationResult, SecurityEvent]:

        capabilities = self._store.find_for_task(
            agent_id,
            task_id,
        )

        matching_operation = [
            capability
            for capability in capabilities
            if capability.operation == operation
        ]

        if not matching_operation:
            return self._deny(
                agent_id=agent_id,
                task_id=task_id,
                operation=operation,
                resource=resource,
                reason="NO_CAPABILITY",
            )

        matching_resource = [
            capability
            for capability in matching_operation
            if self._matcher.matches(
                capability.resource,
                resource,
            )
        ]

        if not matching_resource:
            return self._deny(
                agent_id=agent_id,
                task_id=task_id,
                operation=operation,
                resource=resource,
                reason="RESOURCE_MISMATCH",
            )

        capability = matching_resource[0]

        if capability.status is not CapabilityStatus.ACTIVE:
            return self._deny(
                agent_id=agent_id,
                task_id=task_id,
                operation=operation,
                resource=resource,
                reason="CAPABILITY_REVOKED",
                capability_id=capability.capability_id,
            )

        result = AuthorizationResult(
            decision=Decision.ALLOW,
            reason="ACTIVE_CAPABILITY",
            capability_id=capability.capability_id,
        )

        event = SecurityEvent(
            agent_id=agent_id,
            task_id=task_id,
            event_type=SecurityEventType.AUTHORIZED_OPERATION,
            operation=operation,
            resource=resource,
            decision=Decision.ALLOW,
            reason=result.reason,
            capability_id=capability.capability_id,
        )

        return result, event

    @staticmethod
    def _deny(
        *,
        agent_id: str,
        task_id: str,
        operation: Operation,
        resource: str,
        reason: str,
        capability_id: str | None = None,
    ) -> tuple[AuthorizationResult, SecurityEvent]:

        result = AuthorizationResult(
            decision=Decision.DENY,
            reason=reason,
            capability_id=capability_id,
        )

        event = SecurityEvent(
            agent_id=agent_id,
            task_id=task_id,
            event_type=SecurityEventType.UNAUTHORIZED_OPERATION,
            operation=operation,
            resource=resource,
            decision=Decision.DENY,
            reason=reason,
            capability_id=capability_id,
        )

        return result, event