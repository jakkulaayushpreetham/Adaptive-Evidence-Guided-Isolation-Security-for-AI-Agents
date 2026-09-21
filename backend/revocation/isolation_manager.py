from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timezone

from backend.sandbox.docker_manager import ContainerState
from backend.sandbox.sandbox_manager import SandboxManager


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
    mode: str = "TERMINATE"


class IsolationManager:
    """
    Performs physical sandbox isolation after the adaptive
    security layer reaches a state requiring containment.

    Supports graduated containment:
    - TERMINATE: Stops the container (full teardown).
    - FREEZE: Pauses the container via cgroups freezer (SIGSTOP) preserving memory.
    - THROTTLE: Imposes extreme CPU/resource limits.
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
        mode: str = "TERMINATE",
    ) -> IsolationResult:

        record = self._sandboxes.require(
            agent_id=agent_id,
            task_id=task_id,
        )

        current = self._sandboxes.inspect(
            agent_id=agent_id,
            task_id=task_id,
        )

        normalized_mode = mode.upper()

        if current.state is ContainerState.RUNNING:
            if normalized_mode == "FREEZE":
                self._sandboxes.pause(
                    agent_id=agent_id,
                    task_id=task_id,
                )
            elif normalized_mode == "THROTTLE":
                self._sandboxes.throttle(
                    agent_id=agent_id,
                    task_id=task_id,
                    nano_cpus=50_000_000,
                )
            else:
                self._sandboxes.stop(
                    agent_id=agent_id,
                    task_id=task_id,
                )

        final = self._sandboxes.inspect(
            agent_id=agent_id,
            task_id=task_id,
        )

        if normalized_mode == "FREEZE":
            isolated = final.state in {ContainerState.PAUSED, ContainerState.EXITED}
        elif normalized_mode == "THROTTLE":
            isolated = True
        else:
            isolated = final.state is not ContainerState.RUNNING

        if not isolated:
            raise IsolationFailure(
                f"Sandbox remained active after {normalized_mode} isolation request."
            )

        return IsolationResult(
            agent_id=agent_id,
            task_id=task_id,
            container_id=record.container_id,
            isolated=True,
            final_state=final.state,
            reason=reason,
            timestamp=datetime.now(timezone.utc),
            mode=normalized_mode,
        )
