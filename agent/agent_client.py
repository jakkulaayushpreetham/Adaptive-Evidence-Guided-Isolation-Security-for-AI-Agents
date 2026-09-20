from __future__ import annotations

from backend.capability.capability import Operation
from backend.runtime.security_runtime import (
    RuntimeResult,
    SecurityRuntime,
)


class AgentClient:
    """
    Narrow interface between an autonomous agent and the trusted
    AEGIS security runtime.
    """

    def __init__(
        self,
        *,
        agent_id: str,
        task_id: str,
        runtime: SecurityRuntime,
    ) -> None:
        self.agent_id = agent_id
        self.task_id = task_id
        self._runtime = runtime

    def request(
        self,
        *,
        operation: Operation,
        resource: str,
        repeated: bool = False,
    ) -> RuntimeResult:

        return self._runtime.evaluate(
            agent_id=self.agent_id,
            task_id=self.task_id,
            operation=operation,
            resource=resource,
            repeated=repeated,
        )
