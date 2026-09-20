from __future__ import annotations

from pathlib import Path

from agent.agent_client import AgentClient
from backend.capability.capability import Operation


class SecureRead:

    def __init__(
        self,
        client: AgentClient,
        workspace_root: Path,
    ) -> None:
        self._client = client
        self._workspace_root = workspace_root.resolve()

    def execute(self, resource: str) -> str:

        result = self._client.request(
            operation=Operation.READ_FILE,
            resource=resource,
        )

        if not result.authorization.allowed:
            raise PermissionError(
                f"AEGIS denied READ_FILE {resource}: "
                f"{result.authorization.reason}"
            )

        path = self._resolve(resource)

        return path.read_text(
            encoding="utf-8"
        )

    def _resolve(self, resource: str) -> Path:
        prefix = "/workspace/"

        if not resource.startswith(prefix):
            raise PermissionError(
                "Resource is outside the AEGIS workspace."
            )

        relative = resource[len(prefix):]

        candidate = (
            self._workspace_root / relative
        ).resolve()

        if (
            candidate != self._workspace_root
            and self._workspace_root
            not in candidate.parents
        ):
            raise PermissionError(
                "Workspace traversal denied."
            )

        return candidate
