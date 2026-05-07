from tests.test_events import EVENT_PAYLOAD


def login(client, username, password):
    return client.post("/api/auth/login", json={"username": username, "password": password})


def token(client, username, password):
    resp = login(client, username, password)
    assert resp.status_code == 200
    return {"Authorization": f"Bearer {resp.json()['token']}"}


def test_login_and_me(client):
    resp = login(client, "admin", "admin123")
    assert resp.status_code == 200
    body = resp.json()
    assert body["user"]["role"] == "admin"
    assert "events:assign" in body["user"]["permissions"]

    me = client.get("/api/auth/me", headers={"Authorization": f"Bearer {body['token']}"})
    assert me.status_code == 200
    assert me.json()["username"] == "admin"


def test_protected_settings_requires_auth(client):
    resp = client.get("/api/settings")
    assert resp.status_code == 401


def test_reviewer_cannot_assign(client):
    client.post("/api/events", json=EVENT_PAYLOAD)
    headers = token(client, "reviewer", "review123")
    resp = client.post("/api/events/evt_001/assign", headers=headers, json={
        "assigned_to_username": "patrol",
        "note": "dispatch",
    })
    assert resp.status_code == 403


def test_assignable_users_requires_assign_permission(client):
    reviewer = token(client, "reviewer", "review123")
    resp = client.get("/api/auth/assignees", headers=reviewer)
    assert resp.status_code == 403


def test_dispatcher_can_list_assignable_users(client):
    dispatcher = token(client, "dispatcher", "dispatch123")
    resp = client.get("/api/auth/assignees", headers=dispatcher)
    assert resp.status_code == 200
    body = resp.json()
    usernames = [item["username"] for item in body]
    assert "patrol" in usernames
    assert all(item["role"] == "patrol" for item in body)


def test_cannot_assign_to_admin_user(client):
    client.post("/api/events", json={**EVENT_PAYLOAD, "event_id": "evt_admin_assign"})
    dispatcher = token(client, "dispatcher", "dispatch123")

    resp = client.post("/api/events/evt_admin_assign/assign", headers=dispatcher, json={
        "assigned_to_username": "admin",
        "note": "Should not assign to admin",
    })

    assert resp.status_code == 422


def test_dispatch_to_patrol_accept_complete(client):
    client.post("/api/events", json={**EVENT_PAYLOAD, "event_id": "evt_dispatch"})
    dispatcher = token(client, "dispatcher", "dispatch123")
    patrol = token(client, "patrol", "patrol123")

    assigned = client.post("/api/events/evt_dispatch/assign", headers=dispatcher, json={
        "assigned_to_username": "patrol",
        "note": "Check shoulder lane",
    })
    assert assigned.status_code == 200
    task_id = assigned.json()["task_id"]
    assert assigned.json()["status"] == "assigned"

    accepted = client.post(f"/api/tasks/{task_id}/accept", headers=patrol)
    assert accepted.status_code == 200
    assert accepted.json()["status"] == "accepted"

    completed = client.post(f"/api/tasks/{task_id}/complete", headers=patrol, json={
        "completed_note": "Vehicle cleared",
    })
    assert completed.status_code == 200
    assert completed.json()["status"] == "completed"

    detail = client.get("/api/events/evt_dispatch").json()
    assert detail["review_status"] == "completed"
