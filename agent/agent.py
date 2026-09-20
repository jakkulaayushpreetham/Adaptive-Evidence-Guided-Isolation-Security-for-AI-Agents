from __future__ import annotations

from dataclasses import dataclass

from agent.planner import (
    ActionType,
    AgentAction,
    Planner,
)
from agent.tools.secure_execute import SecureExecute
from agent.tools.secure_network import SecureNetwork
from agent.tools.secure_read import SecureRead
from agent.tools.secure_write import SecureWrite


@dataclass(frozen=True, slots=True)
class AgentRunResult:
    completed: bool
    executed_actions: int
    error: str | None = None


class AutonomousAgent:

    def __init__(
        self,
        *,
        planner: Planner,
        secure_read: SecureRead,
        secure_write: SecureWrite,
        secure_network: SecureNetwork,
        secure_execute: SecureExecute,
    ) -> None:

        self._planner = planner
        self._read = secure_read
        self._write = secure_write
        self._network = secure_network
        self._execute = secure_execute

    def run_summary_task(self) -> AgentRunResult:

        actions = self._planner.plan_summary_task()

        source_text: str | None = None
        executed = 0

        try:
            for action in actions:

                if action.action_type is ActionType.READ:
                    source_text = self._read.execute(
                        action.resource
                    )

                elif action.action_type is ActionType.WRITE:
                    if source_text is None:
                        raise RuntimeError(
                            "Cannot summarize before reading input."
                        )

                    summary = self._summarize(
                        source_text
                    )

                    self._write.execute(
                        action.resource,
                        summary,
                    )

                elif action.action_type is ActionType.NETWORK:
                    self._network.execute(
                        action.resource
                    )

                elif action.action_type is ActionType.EXECUTE:
                    self._execute.execute(
                        action.resource
                    )

                executed += 1

            return AgentRunResult(
                completed=True,
                executed_actions=executed,
            )

        except Exception as exc:
            return AgentRunResult(
                completed=False,
                executed_actions=executed,
                error=str(exc),
            )

    @staticmethod
    def _summarize(text: str) -> str:
        cleaned = " ".join(text.split())

        if len(cleaned) <= 300:
            return cleaned

        return cleaned[:297] + "..."
