from __future__ import annotations

from dataclasses import dataclass

from backend.sandbox.docker_manager import (
    ContainerInfo,
    ContainerState,
    DockerManager,
)


@dataclass(frozen=True, slots=True)
class ContainerHealth:
    container_id: str
    state: ContainerState

    running: bool
    isolated: bool


class ContainerMonitor:

    def __init__(
        self,
        docker_manager: DockerManager,
    ) -> None:
        self._docker = docker_manager

    def check(
        self,
        container_id: str,
    ) -> ContainerHealth:

        info: ContainerInfo = (
            self._docker.inspect(container_id)
        )

        running = (
            info.state is ContainerState.RUNNING
        )

        return ContainerHealth(
            container_id=container_id,
            state=info.state,
            running=running,
            isolated=not running,
        )
