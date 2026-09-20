from __future__ import annotations

from threading import RLock

from backend.capability.capability import Capability


class CapabilityStore:
    """
    Thread-safe in-memory capability repository.

    Later this can be backed by SQLite without changing the
    CapabilityManager interface.
    """

    def __init__(self) -> None:
        self._capabilities: dict[str, Capability] = {}
        self._lock = RLock()

    def save(self, capability: Capability) -> Capability:
        with self._lock:
            self._capabilities[capability.capability_id] = capability

        return capability

    def get(self, capability_id: str) -> Capability | None:
        with self._lock:
            return self._capabilities.get(capability_id)

    def list_all(self) -> tuple[Capability, ...]:
        with self._lock:
            return tuple(self._capabilities.values())

    def find_for_agent(
        self,
        agent_id: str,
    ) -> tuple[Capability, ...]:

        with self._lock:
            return tuple(
                capability
                for capability in self._capabilities.values()
                if capability.agent_id == agent_id
            )

    def find_for_task(
        self,
        agent_id: str,
        task_id: str,
    ) -> tuple[Capability, ...]:

        with self._lock:
            return tuple(
                capability
                for capability in self._capabilities.values()
                if capability.agent_id == agent_id
                and capability.task_id == task_id
            )