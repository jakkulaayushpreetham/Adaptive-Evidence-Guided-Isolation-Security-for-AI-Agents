import uuid

import pytest

from backend.revocation.isolation_manager import (
    IsolationManager,
)
from backend.sandbox.docker_manager import (
    ContainerState,
    DockerManager,
    DockerUnavailableError,
)
from backend.sandbox.sandbox_manager import (
    SandboxManager,
)


@pytest.fixture
def docker_manager():
    try:
        manager = DockerManager()
        manager.ping()
        return manager
    except DockerUnavailableError:
        pytest.skip(
            "Docker daemon is not available."
        )


def test_agent_container_is_physically_stopped(
    docker_manager,
):
    suffix = uuid.uuid4().hex[:8]

    agent_id = f"AGENT-{suffix}"
    task_id = f"TASK-{suffix}"

    sandboxes = SandboxManager(
        docker_manager,
        image="aegis-agent:latest",
    )

    isolation = IsolationManager(
        sandboxes
    )

    record = sandboxes.create(
        agent_id=agent_id,
        task_id=task_id,
    )

    try:
        started = sandboxes.start(
            agent_id=agent_id,
            task_id=task_id,
        )

        assert (
            started.state
            is ContainerState.RUNNING
        )

        result = isolation.isolate(
            agent_id=agent_id,
            task_id=task_id,
            reason="AEGIS CRITICAL security state",
        )

        assert result.isolated

        final = sandboxes.inspect(
            agent_id=agent_id,
            task_id=task_id,
        )

        assert (
            final.state
            is not ContainerState.RUNNING
        )

    finally:
        try:
            docker_manager.remove(
                record.container_id,
                force=True,
            )
        except Exception:
            pass
