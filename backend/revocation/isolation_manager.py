from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timezone

from backend.sandbox.docker_manager import (
    ContainerState,
)
from backend.sandbox.sandbox_manager import (
    SandboxManager,
)


class IsolationFailure(RuntimeError):
    pass


@dataclass(frozen=True, slots=True)
class IsolationResult:
    agent_id: str
    task_id: str
    container_id: str

    isolated: bool
    final_state: ContainerState

    reason: str
    timestamp: datetime


class IsolationManager:
    """
    Performs physical sandbox isolation after the adaptive
    security layer reaches a state requiring containment.
    """

    def __init__(
        self,
        sandbox_manager: SandboxManager,
    ) -> None:

        self._sandboxes = sandbox_manager

    def isolate(
        self,
        *,
        agent_id: str,
        task_id: str,
        reason: str,
    ) -> IsolationResult:

        record = self._sandboxes.require(
            agent_id=agent_id,
            task_id=task_id,
        )

        current = self._sandboxes.inspect(
            agent_id=agent_id,
            task_id=task_id,
        )

        if current.state is ContainerState.RUNNING:
            self._sandboxes.stop(
                agent_id=agent_id,
                task_id=task_id,
            )

        final = self._sandboxes.inspect(
            agent_id=agent_id,
            task_id=task_id,
        )

        isolated = (
            final.state
            is not ContainerState.RUNNING
        )

        if not isolated:
            raise IsolationFailure(
                "Sandbox remained active after "
                "isolation request."
            )

        return IsolationResult(
            agent_id=agent_id,
            task_id=task_id,
            container_id=record.container_id,
            isolated=True,
            final_state=final.state,
            reason=reason,
            timestamp=datetime.now(timezone.utc),
        )
