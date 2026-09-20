from __future__ import annotations

from sqlalchemy.orm import Session
from backend.database.models import TaskModel


class TaskRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def get(self, task_id: str) -> TaskModel | None:
        return self.db.query(TaskModel).filter(TaskModel.task_id == task_id).first()

    def create(self, task_id: str, agent_id: str, description: str, status: str = "CREATED") -> TaskModel:
        task = TaskModel(
            task_id=task_id,
            agent_id=agent_id,
            description=description,
            status=status,
        )
        self.db.add(task)
        self.db.commit()
        self.db.refresh(task)
        return task

    def update_status(self, task_id: str, status: str) -> TaskModel | None:
        task = self.get(task_id)
        if task:
            task.status = status
            self.db.commit()
            self.db.refresh(task)
        return task

    def list_by_agent(self, agent_id: str) -> list[TaskModel]:
        return self.db.query(TaskModel).filter(TaskModel.agent_id == agent_id).all()

    def list_all(self) -> list[TaskModel]:
        return self.db.query(TaskModel).all()
