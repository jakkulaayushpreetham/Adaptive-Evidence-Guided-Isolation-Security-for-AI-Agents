from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.database.database import init_database
from backend.api.task_routes import router as task_router
from backend.api.agent_routes import router as agent_router
from backend.api.capability_routes import router as capability_router
from backend.api.security_routes import router as security_router
from backend.api.trust_routes import router as trust_router
from backend.api.websocket import router as ws_router


from contextlib import asynccontextmanager

@asynccontextmanager
async def lifespan(app: FastAPI):
    init_database()
    yield

# Ensure database tables exist immediately on startup
init_database()

app = FastAPI(
    title="AEGIS-AI Security Controller",
    version="0.6.0",
    lifespan=lifespan,
)

# Allow React SOC frontend to connect
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health() -> dict[str, str]:
    return {
        "status": "ok",
        "service": "AEGIS-AI",
    }


app.include_router(task_router)
app.include_router(agent_router)
app.include_router(capability_router)
app.include_router(security_router)
app.include_router(trust_router)
app.include_router(ws_router)
