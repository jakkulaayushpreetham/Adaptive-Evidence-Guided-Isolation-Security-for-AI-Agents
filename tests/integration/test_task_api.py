from pathlib import Path
from fastapi.testclient import TestClient
import pytest

from backend.main import app
from backend.services.security_service import get_security_service

client = TestClient(app)


def test_task_api_lifecycle(tmp_path: Path):
    # Set workspace root of the security service to temporary path for isolated file I/O
    sec_service = get_security_service()
    sec_service.workspace_root = tmp_path

    # Create dummy research file in temp workspace
    input_dir = tmp_path / "input"
    input_dir.mkdir(parents=True, exist_ok=True)
    (input_dir / "research.txt").write_text("Research document content for API test", encoding="utf-8")

    # 1. POST /api/tasks -> 201 Created
    create_payload = {
        "description": "Read research.txt and write summary.txt",
    }
    response = client.post("/api/tasks", json=create_payload)
    assert response.status_code == 201
    task_data = response.json()
    task_id = task_data["task_id"]
    assert task_data["status"] == "CREATED"

    # 2. GET /api/tasks/{task_id}/capabilities -> READ and WRITE granted
    cap_resp = client.get(f"/api/tasks/{task_id}/capabilities")
    assert cap_resp.status_code == 200
    caps = cap_resp.json()
    ops = [c["operation"] for c in caps]
    assert "READ_FILE" in ops
    assert "WRITE_FILE" in ops

    # 3. POST /api/tasks/{task_id}/run -> summary produced
    run_resp = client.post(f"/api/tasks/{task_id}/run")
    assert run_resp.status_code == 200
    run_data = run_resp.json()
    assert run_data["completed"] is True
    assert run_data["executed_actions"] == 2

    # Verify summary file actually exists
    output_file = tmp_path / "output" / "summary.txt"
    assert output_file.exists()

    # 4. GET /api/tasks/{task_id}/trust -> m(T), m(U), m(Theta), K
    trust_resp = client.get(f"/api/tasks/{task_id}/trust")
    assert trust_resp.status_code == 200
    trust_data = trust_resp.json()
    assert trust_data["task_id"] == task_id
    assert trust_data["security_state"] == "NORMAL"
    assert "mass" in trust_data
    assert "trustworthy" in trust_data["mass"]
    assert "conflict" in trust_data

    # 5. GET /api/tasks/{task_id}/events -> actual authorization history
    events_resp = client.get(f"/api/tasks/{task_id}/events")
    assert events_resp.status_code == 200
    events_data = events_resp.json()
    assert len(events_data) >= 2
    event_ops = [e["operation"] for e in events_data]
    assert "READ_FILE" in event_ops
    assert "WRITE_FILE" in event_ops
    assert all(e["decision"] == "ALLOW" for e in events_data)

    # 6. GET /api/tasks/{task_id}/timeline -> chronological incident items
    timeline_resp = client.get(f"/api/tasks/{task_id}/timeline")
    assert timeline_resp.status_code == 200
    timeline = timeline_resp.json()
    assert len(timeline) >= 2
