def test_system_status_empty_system_guides_setup(client):
    resp = client.get("/api/system/status")
    assert resp.status_code == 200
    data = resp.json()
    assert data["backend"]["status"] == "ok"
    assert data["devices"]["total"] == 0
    assert any(issue["code"] == "no_devices" for issue in data["issues"])


def test_device_detail_includes_next_actions(client, auth_headers):
    client.post("/api/devices/register", json={
        "device_id": "vivo_001",
        "device_name": "vivo X100",
        "app_version": "0.1.0",
        "model_version": "yolov8n-int8",
    })
    client.post("/api/devices/heartbeat", json={
        "device_id": "vivo_001",
        "battery_level": 71,
        "thermal_state": "normal",
        "fps": 13.5,
        "pending_upload_count": 2,
    })

    resp = client.get("/api/devices/vivo_001", headers=auth_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert data["device_id"] == "vivo_001"
    assert data["pending_upload_count"] == 2
    assert data["issues"][0]["next_action"]


def test_device_detail_missing_returns_404(client, auth_headers):
    resp = client.get("/api/devices/missing", headers=auth_headers)
    assert resp.status_code == 404
