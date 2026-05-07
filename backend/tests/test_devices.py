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


def test_heartbeat_updates_fields(client, auth_headers):
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
    detail = client.get("/api/devices/vivo_001", headers=auth_headers).json()
    assert detail["metric_history"][0]["fps"] == 15.2
    assert detail["metric_history"][0]["pending_upload_count"] == 3


def test_heartbeat_unknown_device_returns_404(client):
    resp = client.post(
        "/api/devices/heartbeat",
        json={
            "device_id": "missing_device",
            "battery_level": 82.0,
            "thermal_state": "normal",
            "fps": 15.2,
            "pending_upload_count": 3,
        },
    )
    assert resp.status_code == 404


def test_list_devices_returns_registered(client, auth_headers):
    client.post(
        "/api/devices/register",
        json={
            "device_id": "vivo_001",
            "device_name": "vivo X100",
            "app_version": "0.1.0",
            "model_version": "yolov8n-int8",
        },
    )
    resp = client.get("/api/devices", headers=auth_headers)
    assert resp.status_code == 200
    devices = resp.json()
    assert len(devices) == 1
    assert devices[0]["device_id"] == "vivo_001"
    assert devices[0]["is_online"] is True


def test_heartbeat_preserves_register_fields(client, auth_headers):
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
    resp = client.get("/api/devices", headers=auth_headers)
    device = resp.json()[0]
    assert device["battery_level"] == 50.0
    assert device["fps"] == 10.0
    assert device["device_name"] == "vivo X100"


def test_delete_device_removes_device(client, auth_headers):
    client.post(
        "/api/devices/register",
        json={
            "device_id": "vivo_del",
            "device_name": "vivo ToDelete",
            "app_version": "0.1.0",
            "model_version": "yolov8n-int8",
        },
    )
    resp = client.delete("/api/devices/vivo_del", headers=auth_headers)
    assert resp.status_code == 200
    assert resp.json()["deleted"] is True
    resp = client.get("/api/devices/vivo_del", headers=auth_headers)
    assert resp.status_code == 404


def test_delete_nonexistent_device_returns_404(client, auth_headers):
    resp = client.delete("/api/devices/nonexistent", headers=auth_headers)
    assert resp.status_code == 404


def test_device_detail_reports_metric_history_and_troubleshooting_codes(client, auth_headers):
    client.post(
        "/api/devices/register",
        json={
            "device_id": "vivo_002",
            "device_name": "vivo X90",
            "app_version": "0.1.0",
            "model_version": "yolov8n-int8",
        },
    )
    client.post(
        "/api/devices/heartbeat",
        json={
            "device_id": "vivo_002",
            "battery_level": 42,
            "thermal_state": "hot",
            "fps": 3.2,
            "pending_upload_count": 4,
        },
    )

    resp = client.get("/api/devices/vivo_002", headers=auth_headers)
    assert resp.status_code == 200
    data = resp.json()
    issue_codes = {issue["code"] for issue in data["issues"]}
    assert "pending_uploads" in issue_codes
    assert "thermal_pressure" in issue_codes
    assert "low_fps" in issue_codes
    assert len(data["metric_history"]) == 1
