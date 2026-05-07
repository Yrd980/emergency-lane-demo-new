def test_get_settings_returns_defaults(client):
    resp = client.get("/api/settings")
    assert resp.status_code == 200
    data = resp.json()
    assert data["review_mode"] == "manual"
    assert data["online_window_seconds"] == 60
    assert data["evidence_retention_days"] == 30
    assert data["require_complete_evidence"] is False
    assert data["device_access_mode"] == "open"
    assert data["updated_at"]


def test_update_settings_persists(client):
    payload = {
        "review_mode": "strict",
        "online_window_seconds": 120,
        "evidence_retention_days": 45,
        "require_complete_evidence": True,
        "device_access_mode": "token",
    }
    resp = client.put("/api/settings", json=payload)
    assert resp.status_code == 200
    assert resp.json()["review_mode"] == "strict"
    assert resp.json()["require_complete_evidence"] is True

    saved = client.get("/api/settings").json()
    assert saved["online_window_seconds"] == 120
    assert saved["evidence_retention_days"] == 45
    assert saved["device_access_mode"] == "token"


def test_update_settings_validates_ranges(client):
    resp = client.put("/api/settings", json={
        "review_mode": "manual",
        "online_window_seconds": 2,
        "evidence_retention_days": 30,
        "require_complete_evidence": False,
        "device_access_mode": "open",
    })
    assert resp.status_code == 422


def test_effective_online_threshold_reads_from_db(client):
    from app.services.settings_service import get_effective_online_threshold
    client.put("/api/settings", json={
        "review_mode": "manual",
        "online_window_seconds": 180,
        "evidence_retention_days": 30,
        "require_complete_evidence": False,
        "device_access_mode": "open",
    })
    assert get_effective_online_threshold() == 180
