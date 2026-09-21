from __future__ import annotations

import os
from typing import Generator

from sqlalchemy import create_engine, inspect, text
from sqlalchemy.orm import declarative_base, sessionmaker, Session

DATABASE_URL = os.getenv("AEGIS_DATABASE_URL", "sqlite:///./aegis.db")

connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}

engine = create_engine(
    DATABASE_URL,
    connect_args=connect_args,
    echo=False,
)

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
)

Base = declarative_base()


def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_database(custom_engine=None) -> None:
    target_engine = custom_engine or engine
    Base.metadata.create_all(bind=target_engine)
    if target_engine.dialect.name == "sqlite":
        columns = {column["name"] for column in inspect(target_engine).get_columns("capability_history")}
        if "expires_at" not in columns:
            with target_engine.begin() as connection:
                connection.execute(text("ALTER TABLE capability_history ADD COLUMN expires_at DATETIME"))


def reset_database(custom_engine=None) -> None:
    target_engine = custom_engine or engine
    Base.metadata.drop_all(bind=target_engine)
    Base.metadata.create_all(bind=target_engine)
