from __future__ import annotations

from dataclasses import dataclass
from enum import Enum


class ActionType(str, Enum):
    READ = "READ"
    WRITE = "WRITE"
    NETWORK = "NETWORK"
    EXECUTE = "EXECUTE"


@dataclass(frozen=True, slots=True)
class AgentAction:
    action_type: ActionType
    resource: str
    content: str | None = None


class Planner:
    """
    Deterministic Phase-5 planner.

    Later this can be replaced by an LLM planner without changing
    the trusted AEGIS enforcement architecture.
    """

    def plan_summary_task(self) -> tuple[AgentAction, ...]:

        return (
            AgentAction(
                action_type=ActionType.READ,
                resource="/workspace/input/research.txt",
            ),
            AgentAction(
                action_type=ActionType.WRITE,
                resource="/workspace/output/summary.txt",
            ),
        )
