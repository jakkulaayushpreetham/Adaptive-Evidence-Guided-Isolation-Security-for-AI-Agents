from __future__ import annotations

from dataclasses import dataclass
from threading import RLock

from backend.sandbox.docker_manager import (
    ContainerInfo,
    DockerManager,
)


@dataclass(frozen=True, slots=True)
class SandboxRecord:
    agent_id: str
    task_id: str
    container_id: str
    container_name: str


class SandboxManager:

    def __init__(
        self,
        docker_manager: DockerManager,
        *,
        image: str = "aegis-agent:latest",
    ) -> None:

        self._docker = docker_manager
        self._image = image

        self._records: dict[
            tuple[str, str],
            SandboxRecord,
        ] = {}

        self._lock = RLock()

    def create(
        self,
        *,
        agent_id: str,
        task_id: str,
    ) -> SandboxRecord:

        key = (agent_id, task_id)

        with self._lock:
            existing = self._records.get(key)

            if existing is not None:
                return existing

            safe_agent = self._safe_name(agent_id)
            safe_task = self._safe_name(task_id)

            name = (
                f"aegis-{safe_agent}-{safe_task}"
            ).lower()

            info = self._docker.create_container(
                image=self._image,
                name=name,
                environment={
                    "AEGIS_AGENT_ID": agent_id,
                    "AEGIS_TASK_ID": task_id,
                },
            )

            record = SandboxRecord(
                agent_id=agent_id,
                task_id=task_id,
                container_id=info.container_id,
                container_name=info.name,
            )

            self._records[key] = record

            return record

    def start(
        self,
        *,
        agent_id: str,
        task_id: str,
    ) -> ContainerInfo:

        record = self.require(
            agent_id=agent_id,
            task_id=task_id,
        )

        return self._docker.start(
            record.container_id
        )

    def inspect(
        self,
        *,
        agent_id: str,
        task_id: str,
    ) -> ContainerInfo:

        record = self.require(
            agent_id=agent_id,
            task_id=task_id,
        )

        return self._docker.inspect(
            record.container_id
        )

    def stop(
        self,
        *,
        agent_id: str,
        task_id: str,
    ) -> ContainerInfo:

        record = self.require(
            agent_id=agent_id,
            task_id=task_id,
        )

        return self._docker.stop(
            record.container_id
        )

    def require(
        self,
        *,
        agent_id: str,
        task_id: str,
    ) -> SandboxRecord:

        with self._lock:
            record = self._records.get(
                (agent_id, task_id)
            )

        if record is None:
            raise KeyError(
                "No sandbox registered for "
                f"{agent_id}/{task_id}."
            )

        return record

    @staticmethod
    def _safe_name(value: str) -> str:
        return "".join(
            character.lower()
            if character.isalnum()
            else "-"
            for character in value
        ).strip("-")
