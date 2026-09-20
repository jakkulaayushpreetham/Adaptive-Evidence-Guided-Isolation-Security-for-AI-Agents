from __future__ import annotations

import asyncio
from datetime import datetime, timezone
import json
from typing import Any
from fastapi import APIRouter, WebSocket, WebSocketDisconnect

router = APIRouter(prefix="/ws", tags=["WebSocket"])


class WebSocketManager:
    """Manages active live WebSocket connections for real-time SOC updates."""

    def __init__(self) -> None:
        self.active_connections: list[WebSocket] = []
        self._loop: asyncio.AbstractEventLoop | None = None

    async def connect(self, websocket: WebSocket) -> None:
        self._loop = asyncio.get_running_loop()
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket) -> None:
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast(self, message: dict[str, Any]) -> None:
        disconnected = []
        for connection in self.active_connections:
            try:
                await connection.send_text(json.dumps(message))
            except Exception:
                disconnected.append(connection)

        for dead in disconnected:
            self.disconnect(dead)

    def set_loop(self, loop: asyncio.AbstractEventLoop) -> None:
        self._loop = loop

    def broadcast_sync(self, message: dict[str, Any]) -> None:
        if not self.active_connections:
            return
        target_loop = self._loop
        if target_loop is None:
            try:
                target_loop = asyncio.get_running_loop()
            except RuntimeError:
                return

        if target_loop and target_loop.is_running():
            try:
                running = asyncio.get_running_loop()
                if running is target_loop:
                    target_loop.create_task(self.broadcast(message))
                else:
                    asyncio.run_coroutine_threadsafe(self.broadcast(message), target_loop)
            except RuntimeError:
                asyncio.run_coroutine_threadsafe(self.broadcast(message), target_loop)

    @staticmethod
    def create_envelope(
        event_type: str,
        task_id: str,
        payload: dict[str, Any],
    ) -> dict[str, Any]:
        return {
            "type": event_type,
            "task_id": task_id,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "payload": payload,
        }


manager = WebSocketManager()


@router.websocket("/soc")
async def websocket_soc_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            # Keep-alive receive
            _ = await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)
