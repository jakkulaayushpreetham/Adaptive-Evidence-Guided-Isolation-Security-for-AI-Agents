from __future__ import annotations

from dataclasses import dataclass
from enum import Enum
from pathlib import Path
from typing import Any

import docker
from docker.errors import (
    APIError,
    DockerException,
    ImageNotFound,
    NotFound,
)


class DockerManagerError(RuntimeError):
    """Base error for AEGIS-AI Docker operations."""


class DockerUnavailableError(DockerManagerError):
    """Raised when the Docker daemon cannot be reached."""


class SandboxNotFoundError(DockerManagerError):
    """Raised when the requested sandbox does not exist."""


class ContainerState(str, Enum):
    CREATED = "CREATED"
    RUNNING = "RUNNING"
    PAUSED = "PAUSED"
    EXITED = "EXITED"
    DEAD = "DEAD"
    REMOVED = "REMOVED"
    UNKNOWN = "UNKNOWN"


@dataclass(frozen=True, slots=True)
class ContainerInfo:
    container_id: str
    name: str
    state: ContainerState
    raw_status: str


class DockerManager:
    """
    Trusted host-side adapter for Docker.

    The autonomous agent must never receive this object or access
    to the Docker daemon/socket.
    """

    def __init__(self) -> None:
        try:
            self._client = docker.from_env()
        except DockerException as exc:
            raise DockerUnavailableError(
                "Unable to initialize Docker client."
            ) from exc

    def ping(self) -> bool:
        try:
            return bool(self._client.ping())
        except DockerException as exc:
            raise DockerUnavailableError(
                "Docker daemon is unavailable."
            ) from exc

    def build_image(
        self,
        *,
        dockerfile_directory: str | Path,
        tag: str,
    ) -> str:

        path = Path(dockerfile_directory).resolve()

        if not path.exists():
            raise DockerManagerError(
                f"Docker build directory does not exist: {path}"
            )

        try:
            image, _ = self._client.images.build(
                path=str(path),
                tag=tag,
                rm=True,
            )

            return image.id

        except (DockerException, APIError) as exc:
            raise DockerManagerError(
                f"Failed to build sandbox image {tag!r}."
            ) from exc

    def create_container(
        self,
        *,
        image: str,
        name: str,
        environment: dict[str, str] | None = None,
    ) -> ContainerInfo:

        try:
            container = self._client.containers.create(
                image=image,
                name=name,

                # Agent starts with no network.
                network_disabled=True,

                # Prevent privilege escalation.
                privileged=False,

                # Drop Linux capabilities inherited by container.
                cap_drop=["ALL"],

                # Prevent setuid/setgid privilege escalation.
                security_opt=["no-new-privileges:true"],

                # Resource boundaries.
                mem_limit="256m",
                nano_cpus=500_000_000,
                pids_limit=64,

                # Avoid uncontrolled log growth.
                log_config={
                    "type": "json-file",
                    "config": {
                        "max-size": "10m",
                        "max-file": "2",
                    },
                },

                environment=environment or {},

                labels={
                    "aegis.managed": "true",
                    "aegis.component": "agent-sandbox",
                },

                detach=True,
            )

            container.reload()

            return self._to_info(container)

        except ImageNotFound as exc:
            raise DockerManagerError(
                f"Sandbox image not found: {image}"
            ) from exc

        except (DockerException, APIError) as exc:
            raise DockerManagerError(
                f"Failed to create sandbox {name!r}."
            ) from exc

    def start(self, container_id: str) -> ContainerInfo:
        container = self._get(container_id)

        try:
            container.start()
            container.reload()
            return self._to_info(container)

        except (DockerException, APIError) as exc:
            raise DockerManagerError(
                f"Failed to start sandbox {container_id}."
            ) from exc

    def stop(
        self,
        container_id: str,
        *,
        timeout: int = 3,
    ) -> ContainerInfo:

        container = self._get(container_id)

        try:
            container.stop(timeout=timeout)
            container.reload()
            return self._to_info(container)

        except (DockerException, APIError) as exc:
            raise DockerManagerError(
                f"Failed to stop sandbox {container_id}."
            ) from exc

    def kill(self, container_id: str) -> ContainerInfo:
        container = self._get(container_id)

        try:
            container.kill()
            container.reload()
            return self._to_info(container)

        except (DockerException, APIError) as exc:
            raise DockerManagerError(
                f"Failed to kill sandbox {container_id}."
            ) from exc

    def inspect(
        self,
        container_id: str,
    ) -> ContainerInfo:

        container = self._get(container_id)
        container.reload()

        return self._to_info(container)

    def remove(
        self,
        container_id: str,
        *,
        force: bool = False,
    ) -> None:

        container = self._get(container_id)

        try:
            container.remove(force=force)

        except (DockerException, APIError) as exc:
            raise DockerManagerError(
                f"Failed to remove sandbox {container_id}."
            ) from exc

    def _get(self, container_id: str) -> Any:
        try:
            return self._client.containers.get(container_id)

        except NotFound as exc:
            raise SandboxNotFoundError(
                f"Sandbox not found: {container_id}"
            ) from exc

        except DockerException as exc:
            raise DockerManagerError(
                f"Unable to inspect sandbox {container_id}."
            ) from exc

    @staticmethod
    def _to_info(container: Any) -> ContainerInfo:
        raw = container.status.lower()

        mapping = {
            "created": ContainerState.CREATED,
            "running": ContainerState.RUNNING,
            "paused": ContainerState.PAUSED,
            "exited": ContainerState.EXITED,
            "dead": ContainerState.DEAD,
        }

        return ContainerInfo(
            container_id=container.id,
            name=container.name,
            state=mapping.get(
                raw,
                ContainerState.UNKNOWN,
            ),
            raw_status=raw,
        )
