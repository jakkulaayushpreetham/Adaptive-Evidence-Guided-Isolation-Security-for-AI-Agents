from __future__ import annotations

from backend.capability.capability import (
    Capability,
    CapabilityStatus,
    Operation,
)
from backend.capability.capability_scope import normalize_resource
from backend.capability.capability_store import CapabilityStore


class CapabilityManager:

    def __init__(self, store: CapabilityStore) -> None:
        self._store = store

    def grant(
        self,
        *,
        agent_id: str,
        task_id: str,
        operation: Operation,
        resource: str,
    ) -> Capability:

        resource = normalize_resource(resource)

        existing = self._store.find_for_task(
            agent_id,
            task_id,
        )

        for capability in existing:
            if (
                capability.operation == operation
                and capability.resource == resource
                and capability.status is CapabilityStatus.ACTIVE
            ):
                return capability

        capability = Capability(
            agent_id=agent_id,
            task_id=task_id,
            operation=operation,
            resource=resource,
        )

        return self._store.save(capability)

    def get_active_capabilities(
        self,
        *,
        agent_id: str,
        task_id: str,
    ) -> tuple[Capability, ...]:

        capabilities = self._store.find_for_task(
            agent_id,
            task_id,
        )

        return tuple(
            capability
            for capability in capabilities
            if capability.is_active()
        )

    def revoke(
        self,
        capability_id: str,
        *,
        reason: str,
    ) -> Capability:

        capability = self._store.get(capability_id)

        if capability is None:
            raise KeyError(
                f"Unknown capability: {capability_id}"
            )

        capability.revoke(reason)

        self._store.save(capability)

        return capability

    def revoke_operation(
        self,
        *,
        agent_id: str,
        task_id: str,
        operation: Operation,
        reason: str,
    ) -> tuple[Capability, ...]:

        revoked: list[Capability] = []

        for capability in self._store.find_for_task(
            agent_id,
            task_id,
        ):
            if (
                capability.operation == operation
                and capability.is_active()
            ):
                capability.revoke(reason)
                self._store.save(capability)
                revoked.append(capability)

        return tuple(revoked)

    def revoke_all(
        self,
        *,
        agent_id: str,
        task_id: str,
        reason: str,
    ) -> tuple[Capability, ...]:

        revoked: list[Capability] = []

        for capability in self._store.find_for_task(
            agent_id,
            task_id,
        ):
            if capability.is_active():
                capability.revoke(reason)
                self._store.save(capability)
                revoked.append(capability)

        return tuple(revoked)