BASE_EVENT = {
    "event_id": "evt_s1",
    "device_id": "vivo_001",
    "start_time": "2026-05-05T10:00:00+08:00",
    "end_time": "2026-05-05T10:00:12+08:00",
    "duration_seconds": 12,
    "roi_id": "roi_default",
    "track_id": "track_1",
    "vehicle_class": "car",
    "vehicle_box": {"x": 0, "y": 0, "width": 100, "height": 100},
    "confidence": 0.8,
}


def test_stats_overview_structure(client, auth_headers):
    resp = client.get("/api/stats/overview", headers=auth_headers)
    assert resp.status_code == 200
    data = resp.json()
    for key in ["total_events_today", "pending_review_count", "confirmed_count",
                "rejected_count", "online_device_count", "recent_events"]:
        assert key in data
    assert isinstance(data["recent_events"], list)

def test_stats_counts_reflect_events(client, auth_headers):
    client.post("/api/events", json={**BASE_EVENT, "event_id": "evt_s1"})
    client.post("/api/events", json={**BASE_EVENT, "event_id": "evt_s2", "vehicle_class": "truck"})
    client.patch("/api/events/evt_s1/review", headers=auth_headers, json={"review_status": "validated"})
    resp = client.get("/api/stats/overview", headers=auth_headers)
    data = resp.json()
    assert data["confirmed_count"] == 1
    assert data["pending_review_count"] == 1


def test_stats_today_excludes_future_events(client, auth_headers):
    client.post(
        "/api/events",
        json={
            **BASE_EVENT,
            "event_id": "evt_future",
            "start_time": "2999-05-05T10:00:00+08:00",
            "end_time": "2999-05-05T10:00:12+08:00",
        },
    )
    resp = client.get("/api/stats/overview", headers=auth_headers)
    assert resp.json()["total_events_today"] == 0


def test_online_device_count(client, auth_headers):
    client.post("/api/devices/register", json={
        "device_id": "vivo_001",
        "device_name": "vivo X100",
        "app_version": "0.1.0",
        "model_version": "yolov8n-int8",
    })
    resp = client.get("/api/stats/overview", headers=auth_headers)
    assert resp.json()["online_device_count"] == 1


def test_operations_stats_includes_tasks(client, auth_headers):
    resp = client.get("/api/stats/operations", headers=auth_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert "summary" in data
    assert "trend" in data
    assert "hotspots" in data
    assert "operators" in data
