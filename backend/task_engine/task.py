from __future__ import annotations

from dataclasses import dataclass, field
from enum import Enum
from uuid import uuid4


class TaskStatus(str, Enum):
    CREATED = "CREATED"
    RUNNING = "RUNNING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"
    ISOLATED = "ISOLATED"


@dataclass(slots=True)
class Task:
    description: str
    agent_id: str

    task_id: str = field(
        default_factory=lambda:
        f"TASK-{uuid4().hex[:12].upper()}"
    )

    status: TaskStatus = TaskStatus.CREATED