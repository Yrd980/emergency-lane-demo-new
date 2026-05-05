def test_register_device(client):
    resp = client.post(
        "/api/devices/register",
        json={
            "device_id": "vivo_001",
            "device_name": "vivo X100",
            "app_version": "0.1.0",
            "model_version": "yolov8n-int8",
        },
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["device_id"] == "vivo_001"
    assert data["registered"] is True


def test_heartbeat_updates_fields(client):
    client.post(
        "/api/devices/register",
        json={
            "device_id": "vivo_001",
            "device_name": "vivo X100",
            "app_version": "0.1.0",
            "model_version": "yolov8n-int8",
        },
    )
    resp = client.post(
        "/api/devices/heartbeat",
        json={
            "device_id": "vivo_001",
            "battery_level": 82.0,
            "thermal_state": "normal",
            "fps": 15.2,
            "pending_upload_count": 3,
        },
    )
    assert resp.status_code == 200
    assert resp.json()["heartbeat_accepted"] is True


def test_list_devices_returns_registered(client):
    client.post(
        "/api/devices/register",
        json={
            "device_id": "vivo_001",
            "device_name": "vivo X100",
            "app_version": "0.1.0",
            "model_version": "yolov8n-int8",
        },
    )
    resp = client.get("/api/devices")
    assert resp.status_code == 200
    devices = resp.json()
    assert len(devices) == 1
    assert devices[0]["device_id"] == "vivo_001"
    assert devices[0]["is_online"] is True


def test_heartbeat_preserves_register_fields(client):
    client.post(
        "/api/devices/register",
        json={
            "device_id": "vivo_001",
            "device_name": "vivo X100",
            "app_version": "0.1.0",
            "model_version": "yolov8n-int8",
        },
    )
    client.post(
        "/api/devices/heartbeat",
        json={
            "device_id": "vivo_001",
            "battery_level": 50.0,
            "fps": 10.0,
        },
    )
    resp = client.get("/api/devices")
    device = resp.json()[0]
    assert device["battery_level"] == 50.0
    assert device["fps"] == 10.0
    assert device["device_name"] == "vivo X100"
