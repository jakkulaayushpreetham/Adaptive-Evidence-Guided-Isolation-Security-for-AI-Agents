from __future__ import annotations

import os
import signal
import time


running = True


def shutdown(
    signum: int,
    frame: object,
) -> None:
    global running
    running = False


signal.signal(
    signal.SIGTERM,
    shutdown,
)

signal.signal(
    signal.SIGINT,
    shutdown,
)


agent_id = os.getenv(
    "AEGIS_AGENT_ID",
    "UNKNOWN",
)

task_id = os.getenv(
    "AEGIS_TASK_ID",
    "UNKNOWN",
)

print(
    f"AEGIS sandbox started: "
    f"agent={agent_id}, task={task_id}",
    flush=True,
)

while running:
    time.sleep(0.5)

print(
    "AEGIS sandbox terminating.",
    flush=True,
)
