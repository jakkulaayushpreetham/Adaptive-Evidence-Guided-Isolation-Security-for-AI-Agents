from fastapi.testclient import TestClient

from backend.main import app

client = TestClient(app)


def test_simulate_security_operation_and_events():
    # 1. Create a task
    task_res = client.post("/api/tasks", json={"description": "Security simulation test task"})
    assert task_res.status_code == 201
    task_data = task_res.json()
    task_id = task_data["task_id"]
    agent_id = task_data["agent_id"]

    # 2. Simulate legitimate READ operation -> should be ALLOWED
    sim_read = client.post(
        "/api/security/simulate",
        json={
            "agent_id": agent_id,
            "task_id": task_id,
            "operation": "READ_FILE",
            "resource": "/workspace/input/research.txt",
        },
    )
    assert sim_read.status_code == 200
    res_read = sim_read.json()
    assert res_read["allowed"] is True
    assert res_read["decision"] == "ALLOW"
    assert res_read["security_state"] == "NORMAL"

    # 3. Simulate unauthorized network request -> should be DENIED
    sim_net = client.post(
        "/api/security/simulate",
        json={
            "agent_id": agent_id,
            "task_id": task_id,
            "operation": "NETWORK",
            "resource": "/network/untrusted",
        },
    )
    assert sim_net.status_code == 200
    res_net = sim_net.json()
    assert res_net["allowed"] is False
    assert res_net["decision"] == "DENY"

    # 4. Multiple violations accumulate distrust
    sim_priv = client.post(
        "/api/security/simulate",
        json={
            "agent_id": agent_id,
            "task_id": task_id,
            "operation": "READ_FILE",
            "resource": "/workspace/input/private_keys.txt",
        },
    )
    assert sim_priv.status_code == 200
    res_priv = sim_priv.json()
    assert res_priv["allowed"] is False
    assert res_priv["decision"] == "DENY"

    # 5. GET /api/security/events returns logged events
    events_res = client.get("/api/security/events")
    assert events_res.status_code == 200
    events = events_res.json()
    assert len(events) >= 3


def test_simulate_fresh_violation_triggers_restricted_state():
    # Fresh task without prior positive events
    task_res = client.post("/api/tasks", json={"description": "Fresh violation simulation"})
    assert task_res.status_code == 201
    task_data = task_res.json()
    task_id = task_data["task_id"]
    agent_id = task_data["agent_id"]

    # Single unauthorized network denial on clean state yields m(U)=0.60 -> RESTRICTED
    sim_net = client.post(
        "/api/security/simulate",
        json={
            "agent_id": agent_id,
            "task_id": task_id,
            "operation": "NETWORK",
            "resource": "/network/c2",
        },
    )
    assert sim_net.status_code == 200
    res_net = sim_net.json()
    assert res_net["allowed"] is False
    assert res_net["decision"] == "DENY"
    assert res_net["security_state"] == "RESTRICTED"
    assert res_net["untrustworthy"] >= 0.60
