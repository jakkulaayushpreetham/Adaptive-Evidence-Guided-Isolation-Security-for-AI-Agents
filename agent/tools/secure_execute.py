from __future__ import annotations

from agent.agent_client import AgentClient
from backend.capability.capability import Operation


class SecureExecute:

    def __init__(
        self,
        client: AgentClient,
    ) -> None:
        self._client = client

    def execute(self, resource: str, repeated: bool = False) -> str:

        result = self._client.request(
            operation=Operation.EXECUTE,
            resource=resource,
            repeated=repeated,
        )

        if not result.authorization.allowed:
            raise PermissionError(
                f"AEGIS denied EXECUTE {resource}: "
                f"{result.authorization.reason}"
            )

        return f"EXECUTE_AUTHORIZED:{resource}"
