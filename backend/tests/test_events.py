import pytest
from concurrent.futures import ThreadPoolExecutor

EVENT_PAYLOAD = {
    "event_id": "evt_001",
    "device_id": "vivo_001",
    "start_time": "2026-05-05T10:00:00+08:00",
    "end_time": "2026-05-05T10:00:12+08:00",
    "duration_seconds": 12,
    "roi_id": "roi_default",
    "track_id": "track_42",
    "vehicle_class": "car",
    "vehicle_box": {"x": 120, "y": 220, "width": 180, "height": 90},
    "confidence": 0.86,
    "gps_location": {"lat": 31.23, "lng": 121.47, "accuracy_meters": 5.0},
}

def test_create_event(client):
    resp = client.post("/api/events", json=EVENT_PAYLOAD)
    assert resp.status_code == 200
    data = resp.json()
    assert data["accepted"] is True
    assert data["duplicate"] is False

def test_duplicate_event(client):
    client.post("/api/events", json=EVENT_PAYLOAD)
    resp = client.post("/api/events", json=EVENT_PAYLOAD)
    assert resp.status_code == 200
    data = resp.json()
    assert data["duplicate"] is True
    assert data["accepted"] is False


def test_concurrent_duplicate_event_returns_duplicate(client):
    payload = {**EVENT_PAYLOAD, "event_id": "evt_concurrent"}

    def post_event():
        return client.post("/api/events", json=payload)

    with ThreadPoolExecutor(max_workers=2) as executor:
        responses = list(executor.map(lambda _: post_event(), range(2)))

    assert all(resp.status_code == 200 for resp in responses)
    bodies = [resp.json() for resp in responses]
    assert sum(1 for body in bodies if body["accepted"] is True) == 1
    assert sum(1 for body in bodies if body["duplicate"] is True) == 1


def test_list_events_pagination(client):
    for i in range(5):
        p = {**EVENT_PAYLOAD, "event_id": f"evt_{i:03d}",
             "start_time": f"2026-05-05T10:00:{i:02d}+08:00",
             "end_time": f"2026-05-05T10:00:{i+5:02d}+08:00",
             "track_id": f"track_{i}"}
        client.post("/api/events", json=p)
    resp = client.get("/api/events?limit=2&offset=0")
    assert resp.status_code == 200
    data = resp.json()
    assert len(data["items"]) == 2
    assert data["total"] >= 5

def test_list_events_filter_by_status(client):
    p = {**EVENT_PAYLOAD, "event_id": "evt_filter_status"}
    client.post("/api/events", json=p)
    resp = client.get("/api/events?status=pending")
    assert resp.status_code == 200
    items = resp.json()["items"]
    assert all(i["review_status"] == "pending" for i in items)


def test_list_pending_events_prioritizes_high_risk(client):
    normal = {
        **EVENT_PAYLOAD,
        "event_id": "evt_priority_normal",
        "duration_seconds": 3,
        "confidence": 0.6,
        "start_time": "2026-05-05T10:00:00+08:00",
        "end_time": "2026-05-05T10:00:03+08:00",
    }
    high = {
        **EVENT_PAYLOAD,
        "event_id": "evt_priority_high",
        "duration_seconds": 12,
        "confidence": 0.9,
        "start_time": "2026-05-05T10:01:00+08:00",
        "end_time": "2026-05-05T10:01:12+08:00",
    }
    client.post("/api/events", json=normal)
    client.post("/api/events", json=high)

    resp = client.get("/api/events?status=pending&limit=10")

    assert resp.status_code == 200
    items = resp.json()["items"]
    ids = [item["event_id"] for item in items]
    assert ids.index("evt_priority_high") < ids.index("evt_priority_normal")
    assert next(item for item in items if item["event_id"] == "evt_priority_high")["risk_level"] == "high"


def test_list_events_invalid_status_returns_422(client):
    resp = client.get("/api/events?status=maybe")
    assert resp.status_code == 422


def test_list_events_filter_by_time_range(client):
    t1 = {**EVENT_PAYLOAD, "event_id": "evt_t1",
          "start_time": "2026-05-05T08:00:00+08:00",
          "end_time": "2026-05-05T08:00:12+08:00"}
    t2 = {**EVENT_PAYLOAD, "event_id": "evt_t2",
          "start_time": "2026-05-05T12:00:00+08:00",
          "end_time": "2026-05-05T12:00:12+08:00"}
    client.post("/api/events", json=t1)
    client.post("/api/events", json=t2)
    resp = client.get("/api/events?start_time_from=2026-05-05T09:00:00%2B08:00&start_time_to=2026-05-05T13:00:00%2B08:00")
    items = resp.json()["items"]
    eids = [e["event_id"] for e in items]
    assert "evt_t2" in eids
    assert "evt_t1" not in eids

def test_get_event_detail(client):
    client.post("/api/events", json=EVENT_PAYLOAD)
    resp = client.get("/api/events/evt_001")
    assert resp.status_code == 200
    data = resp.json()
    assert data["vehicle_class"] == "car"
    assert data["vehicle_box"]["width"] == 180
    assert data["evidence_files"] == []


def test_get_event_detail_without_gps_returns_null(client):
    payload = {**EVENT_PAYLOAD, "event_id": "evt_no_gps"}
    payload.pop("gps_location")
    client.post("/api/events", json=payload)
    resp = client.get("/api/events/evt_no_gps")
    assert resp.status_code == 200
    assert resp.json()["gps_location"] is None


def test_event_detail_next_event_points_to_pending_queue(client):
    client.post("/api/events", json={**EVENT_PAYLOAD, "event_id": "evt_next_a"})
    client.post("/api/events", json={**EVENT_PAYLOAD, "event_id": "evt_next_b", "track_id": "track_b"})
    client.post("/api/events", json={**EVENT_PAYLOAD, "event_id": "evt_next_done", "track_id": "track_done"})
    client.patch("/api/events/evt_next_done/review", json={"review_status": "confirmed"})

    resp = client.get("/api/events/evt_next_a")

    assert resp.status_code == 200
    assert resp.json()["next_event_id"] == "evt_next_b"

def test_event_not_found_returns_404(client):
    resp = client.get("/api/events/nonexistent")
    assert resp.status_code == 404

def test_update_review_confirmed(client):
    client.post("/api/events", json={**EVENT_PAYLOAD, "event_id": "evt_rev"})
    resp = client.patch("/api/events/evt_rev/review", json={
        "review_status": "confirmed",
        "operator_note": "证据清晰",
        "operator_id": "reviewer_a",
    })
    assert resp.status_code == 200
    assert resp.json()["review_status"] == "confirmed"
    assert resp.json()["operator_id"] == "reviewer_a"

    detail = client.get("/api/events/evt_rev").json()
    assert detail["review_history"][0]["operator_id"] == "reviewer_a"
    assert detail["review_history"][0]["from_status"] == "pending"
    assert detail["review_history"][0]["to_status"] == "confirmed"


def test_review_history_preserves_rejudgement(client):
    client.post("/api/events", json={**EVENT_PAYLOAD, "event_id": "evt_history"})
    client.patch("/api/events/evt_history/review", json={
        "review_status": "confirmed",
        "operator_note": "初次确认",
        "operator_id": "reviewer_a",
    })
    client.patch("/api/events/evt_history/review", json={
        "review_status": "rejected",
        "operator_note": "复查后驳回",
        "operator_id": "reviewer_b",
    })

    detail = client.get("/api/events/evt_history").json()
    assert detail["review_status"] == "rejected"
    assert len(detail["review_history"]) == 2
    assert detail["review_history"][0]["operator_id"] == "reviewer_b"
    assert detail["review_history"][0]["from_status"] == "confirmed"
    assert detail["review_history"][0]["to_status"] == "rejected"

def test_review_invalid_status_returns_422(client):
    client.post("/api/events", json={**EVENT_PAYLOAD, "event_id": "evt_inv"})
    resp = client.patch("/api/events/evt_inv/review", json={"review_status": "maybe"})
    assert resp.status_code == 422

def test_bulk_review_updates_events_and_history(client):
    client.post("/api/events", json={**EVENT_PAYLOAD, "event_id": "evt_bulk_a"})
    client.post("/api/events", json={**EVENT_PAYLOAD, "event_id": "evt_bulk_b", "track_id": "track_b"})

    resp = client.patch("/api/events/review/bulk", json={
        "event_ids": ["evt_bulk_a", "evt_bulk_b"],
        "review_status": "rejected",
        "operator_note": "批量排除测试事件",
        "operator_id": "reviewer_bulk",
    })

    assert resp.status_code == 200
    assert resp.json()["updated_count"] == 2
    assert resp.json()["missing_event_ids"] == []
    for event_id in ["evt_bulk_a", "evt_bulk_b"]:
        detail = client.get(f"/api/events/{event_id}").json()
        assert detail["review_status"] == "rejected"
        assert detail["review_history"][0]["operator_id"] == "reviewer_bulk"

def test_duplicate_upload_does_not_overwrite_review(client):
    client.post("/api/events", json={**EVENT_PAYLOAD, "event_id": "evt_keep"})
    client.patch("/api/events/evt_keep/review", json={
        "review_status": "confirmed", "operator_note": "已确认",
    })
    client.post("/api/events", json={**EVENT_PAYLOAD, "event_id": "evt_keep"})
    resp = client.get("/api/events/evt_keep")
    assert resp.json()["review_status"] == "confirmed"


def test_require_complete_evidence_blocks_confirmation(client):
    client.put("/api/settings", json={
        "review_mode": "manual",
        "online_window_seconds": 60,
        "evidence_retention_days": 30,
        "require_complete_evidence": True,
        "device_access_mode": "open",
    })
    client.post("/api/events", json={**EVENT_PAYLOAD, "event_id": "evt_incomplete"})
    resp = client.patch("/api/events/evt_incomplete/review", json={
        "review_status": "confirmed",
        "operator_note": "no evidence",
    })
    assert resp.status_code == 422
    assert "Complete evidence" in resp.json()["detail"]


def test_delete_event_removes_event_and_evidence(client):
    client.post("/api/events", json={**EVENT_PAYLOAD, "event_id": "evt_del"})
    resp = client.delete("/api/events/evt_del")
    assert resp.status_code == 200
    assert resp.json()["deleted"] is True
    resp = client.get("/api/events/evt_del")
    assert resp.status_code == 404


def test_delete_nonexistent_event_returns_404(client):
    resp = client.delete("/api/events/nonexistent")
    assert resp.status_code == 404
