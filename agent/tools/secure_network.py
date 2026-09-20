from __future__ import annotations

from agent.agent_client import AgentClient
from backend.capability.capability import Operation


class SecureNetwork:

    def __init__(
        self,
        client: AgentClient,
    ) -> None:
        self._client = client

    def execute(self, resource: str) -> str:

        result = self._client.request(
            operation=Operation.NETWORK,
            resource=resource,
        )

        if not result.authorization.allowed:
            raise PermissionError(
                f"AEGIS denied NETWORK {resource}: "
                f"{result.authorization.reason}"
            )

        return f"NETWORK_AUTHORIZED:{resource}"
