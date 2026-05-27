import pytest
from concurrent.futures import ThreadPoolExecutor

EVENT_PAYLOAD = {
    "suspected_incident_id": "evt_001",
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

def test_create_suspected_incident(client):
    resp = client.post("/api/suspected-incidents", json=EVENT_PAYLOAD)
    assert resp.status_code == 200
    data = resp.json()
    assert data["accepted"] is True
    assert data["duplicate"] is False

def test_duplicate_suspected_incident(client):
    client.post("/api/suspected-incidents", json=EVENT_PAYLOAD)
    resp = client.post("/api/suspected-incidents", json=EVENT_PAYLOAD)
    assert resp.status_code == 200
    data = resp.json()
    assert data["duplicate"] is True
    assert data["accepted"] is False


def test_concurrent_duplicate_event_returns_duplicate(client):
    payload = {**EVENT_PAYLOAD, "suspected_incident_id": "evt_concurrent"}

    def post_suspected_incident():
        return client.post("/api/suspected-incidents", json=payload)

    with ThreadPoolExecutor(max_workers=2) as executor:
        responses = list(executor.map(lambda _: post_suspected_incident(), range(2)))

    assert all(resp.status_code == 200 for resp in responses)
    bodies = [resp.json() for resp in responses]
    assert sum(1 for body in bodies if body["accepted"] is True) == 1
    assert sum(1 for body in bodies if body["duplicate"] is True) == 1


def test_list_suspected_incidents_pagination(client):
    for i in range(5):
        p = {**EVENT_PAYLOAD, "suspected_incident_id": f"evt_{i:03d}",
             "start_time": f"2026-05-05T10:00:{i:02d}+08:00",
             "end_time": f"2026-05-05T10:00:{i+5:02d}+08:00",
             "track_id": f"track_{i}"}
        client.post("/api/suspected-incidents", json=p)
    resp = client.get("/api/suspected-incidents?limit=2&offset=0")
    assert resp.status_code == 200
    data = resp.json()
    assert len(data["items"]) == 2
    assert data["total"] >= 5

def test_list_suspected_incidents_filter_by_status(client):
    p = {**EVENT_PAYLOAD, "suspected_incident_id": "evt_filter_status"}
    client.post("/api/suspected-incidents", json=p)
    resp = client.get("/api/suspected-incidents?status=pending")
    assert resp.status_code == 200
    items = resp.json()["items"]
    assert all(i["review_status"] == "pending" for i in items)


def test_list_pending_events_prioritizes_high_risk(client):
    normal = {
        **EVENT_PAYLOAD,
        "suspected_incident_id": "evt_priority_normal",
        "duration_seconds": 3,
        "confidence": 0.6,
        "start_time": "2026-05-05T10:00:00+08:00",
        "end_time": "2026-05-05T10:00:03+08:00",
    }
    high = {
        **EVENT_PAYLOAD,
        "suspected_incident_id": "evt_priority_high",
        "duration_seconds": 12,
        "confidence": 0.9,
        "start_time": "2026-05-05T10:01:00+08:00",
        "end_time": "2026-05-05T10:01:12+08:00",
    }
    client.post("/api/suspected-incidents", json=normal)
    client.post("/api/suspected-incidents", json=high)

    resp = client.get("/api/suspected-incidents?status=pending&limit=10")

    assert resp.status_code == 200
    items = resp.json()["items"]
    ids = [item["suspected_incident_id"] for item in items]
    assert ids.index("evt_priority_high") < ids.index("evt_priority_normal")
    assert next(item for item in items if item["suspected_incident_id"] == "evt_priority_high")["review_priority"] == "high"


def test_list_suspected_incidents_created_desc_sort_is_chronological(client):
    high = {
        **EVENT_PAYLOAD,
        "suspected_incident_id": "evt_sort_high_old",
        "duration_seconds": 12,
        "confidence": 0.9,
        "start_time": "2026-05-05T10:00:00+08:00",
        "end_time": "2026-05-05T10:00:12+08:00",
    }
    normal = {
        **EVENT_PAYLOAD,
        "suspected_incident_id": "evt_sort_normal_new",
        "duration_seconds": 3,
        "confidence": 0.6,
        "start_time": "2026-05-05T10:01:00+08:00",
        "end_time": "2026-05-05T10:01:03+08:00",
    }
    client.post("/api/suspected-incidents", json=high)
    client.post("/api/suspected-incidents", json=normal)

    resp = client.get("/api/suspected-incidents?sort=created_desc&limit=10")

    assert resp.status_code == 200
    ids = [item["suspected_incident_id"] for item in resp.json()["items"]]
    assert ids.index("evt_sort_normal_new") < ids.index("evt_sort_high_old")


def test_list_suspected_incidents_invalid_status_returns_422(client):
    resp = client.get("/api/suspected-incidents?status=maybe")
    assert resp.status_code == 422


def test_list_suspected_incidents_filter_by_time_range(client):
    t1 = {**EVENT_PAYLOAD, "suspected_incident_id": "evt_t1",
          "start_time": "2026-05-05T08:00:00+08:00",
          "end_time": "2026-05-05T08:00:12+08:00"}
    t2 = {**EVENT_PAYLOAD, "suspected_incident_id": "evt_t2",
          "start_time": "2026-05-05T12:00:00+08:00",
          "end_time": "2026-05-05T12:00:12+08:00"}
    client.post("/api/suspected-incidents", json=t1)
    client.post("/api/suspected-incidents", json=t2)
    resp = client.get("/api/suspected-incidents?start_time_from=2026-05-05T09:00:00%2B08:00&start_time_to=2026-05-05T13:00:00%2B08:00")
    items = resp.json()["items"]
    eids = [e["suspected_incident_id"] for e in items]
    assert "evt_t2" in eids
    assert "evt_t1" not in eids

def test_get_suspected_incident_detail(client):
    client.post("/api/suspected-incidents", json=EVENT_PAYLOAD)
    resp = client.get("/api/suspected-incidents/evt_001")
    assert resp.status_code == 200
    data = resp.json()
    assert data["vehicle_class"] == "car"
    assert data["vehicle_box"]["width"] == 180
    assert data["evidence_files"] == []


def test_create_suspected_incident_accepts_android_float_vehicle_box(client):
    payload = {
        **EVENT_PAYLOAD,
        "suspected_incident_id": "evt_float_box",
        "vehicle_box": {"x": 120.5, "y": 220.25, "width": 180.75, "height": 90.5},
    }
    resp = client.post("/api/suspected-incidents", json=payload)
    assert resp.status_code == 200

    detail = client.get("/api/suspected-incidents/evt_float_box").json()
    assert detail["vehicle_box"]["x"] == 120.5
    assert detail["vehicle_box"]["width"] == 180.75


def test_get_suspected_incident_detail_without_gps_returns_null(client):
    payload = {**EVENT_PAYLOAD, "suspected_incident_id": "evt_no_gps"}
    payload.pop("gps_location")
    client.post("/api/suspected-incidents", json=payload)
    resp = client.get("/api/suspected-incidents/evt_no_gps")
    assert resp.status_code == 200
    assert resp.json()["gps_location"] is None


def test_suspected_incident_detail_next_event_points_to_pending_queue(client, auth_headers):
    client.post("/api/suspected-incidents", json={**EVENT_PAYLOAD, "suspected_incident_id": "evt_next_a"})
    client.post("/api/suspected-incidents", json={**EVENT_PAYLOAD, "suspected_incident_id": "evt_next_b", "track_id": "track_b"})
    client.post("/api/suspected-incidents", json={**EVENT_PAYLOAD, "suspected_incident_id": "evt_next_done", "track_id": "track_done"})
    client.patch("/api/suspected-incidents/evt_next_done/review", headers=auth_headers, json={"review_status": "validated"})

    resp = client.get("/api/suspected-incidents/evt_next_a")

    assert resp.status_code == 200
    assert resp.json()["next_suspected_incident_id"] == "evt_next_b"

def test_suspected_incident_not_found_returns_404(client):
    resp = client.get("/api/suspected-incidents/nonexistent")
    assert resp.status_code == 404

def test_update_review_validated(client, auth_headers):
    client.post("/api/suspected-incidents", json={**EVENT_PAYLOAD, "suspected_incident_id": "evt_rev"})
    resp = client.patch("/api/suspected-incidents/evt_rev/review", headers=auth_headers, json={
        "review_status": "validated",
        "operator_note": "证据清晰",
        "operator_id": "reviewer_a",
    })
    assert resp.status_code == 200
    assert resp.json()["review_status"] == "validated"
    assert resp.json()["operator_id"] == "reviewer_a"

    detail = client.get("/api/suspected-incidents/evt_rev").json()
    assert detail["review_history"][0]["operator_id"] == "reviewer_a"
    assert detail["review_history"][0]["from_status"] == "pending"
    assert detail["review_history"][0]["to_status"] == "validated"


def test_review_history_preserves_rejudgement(client, auth_headers):
    client.post("/api/suspected-incidents", json={**EVENT_PAYLOAD, "suspected_incident_id": "evt_history"})
    client.patch("/api/suspected-incidents/evt_history/review", headers=auth_headers, json={
        "review_status": "validated",
        "operator_note": "初次确认",
        "operator_id": "reviewer_a",
    })
    client.patch("/api/suspected-incidents/evt_history/review", headers=auth_headers, json={
        "review_status": "false_alarm",
        "operator_note": "复查后驳回",
        "operator_id": "reviewer_b",
    })

    detail = client.get("/api/suspected-incidents/evt_history").json()
    assert detail["review_status"] == "false_alarm"
    assert len(detail["review_history"]) == 2
    assert detail["review_history"][0]["operator_id"] == "reviewer_b"
    assert detail["review_history"][0]["from_status"] == "validated"
    assert detail["review_history"][0]["to_status"] == "false_alarm"

def test_review_invalid_status_returns_422(client, auth_headers):
    client.post("/api/suspected-incidents", json={**EVENT_PAYLOAD, "suspected_incident_id": "evt_inv"})
    resp = client.patch("/api/suspected-incidents/evt_inv/review", headers=auth_headers, json={"review_status": "maybe"})
    assert resp.status_code == 422

def test_bulk_review_updates_events_and_history(client, auth_headers):
    client.post("/api/suspected-incidents", json={**EVENT_PAYLOAD, "suspected_incident_id": "evt_bulk_a"})
    client.post("/api/suspected-incidents", json={**EVENT_PAYLOAD, "suspected_incident_id": "evt_bulk_b", "track_id": "track_b"})

    resp = client.patch("/api/suspected-incidents/review/bulk", headers=auth_headers, json={
        "suspected_incident_ids": ["evt_bulk_a", "evt_bulk_b"],
        "review_status": "false_alarm",
        "operator_note": "批量排除测试疑似事件",
        "operator_id": "reviewer_bulk",
    })

    assert resp.status_code == 200
    assert resp.json()["updated_count"] == 2
    assert resp.json()["missing_suspected_incident_ids"] == []
    for suspected_incident_id in ["evt_bulk_a", "evt_bulk_b"]:
        detail = client.get(f"/api/suspected-incidents/{suspected_incident_id}").json()
        assert detail["review_status"] == "false_alarm"
        assert detail["review_history"][0]["operator_id"] == "reviewer_bulk"


def test_bulk_review_reports_failed_confirmations(client, auth_headers):
    client.put("/api/settings", headers=auth_headers, json={
        "review_mode": "manual",
        "online_window_seconds": 60,
        "evidence_retention_days": 30,
        "require_complete_evidence": True,
        "device_access_mode": "open",
    })
    client.post("/api/suspected-incidents", json={**EVENT_PAYLOAD, "suspected_incident_id": "evt_bulk_incomplete"})

    resp = client.patch("/api/suspected-incidents/review/bulk", headers=auth_headers, json={
        "suspected_incident_ids": ["evt_bulk_incomplete"],
        "review_status": "validated",
        "operator_note": "批量确认",
    })

    assert resp.status_code == 200
    assert resp.json()["updated_count"] == 0
    assert resp.json()["failed_suspected_incident_ids"] == ["evt_bulk_incomplete"]
    detail = client.get("/api/suspected-incidents/evt_bulk_incomplete").json()
    assert detail["review_status"] == "pending"
    assert detail["review_history"] == []


def test_bulk_validate_requires_complete_evidence_even_when_setting_is_off(client, auth_headers):
    client.post("/api/suspected-incidents", json={**EVENT_PAYLOAD, "suspected_incident_id": "evt_bulk_guard"})

    resp = client.patch("/api/suspected-incidents/review/bulk", headers=auth_headers, json={
        "suspected_incident_ids": ["evt_bulk_guard"],
        "review_status": "validated",
        "operator_note": "批量确认",
    })

    assert resp.status_code == 200
    assert resp.json()["updated_count"] == 0
    assert resp.json()["failed_suspected_incident_ids"] == ["evt_bulk_guard"]
    detail = client.get("/api/suspected-incidents/evt_bulk_guard").json()
    assert detail["review_status"] == "pending"


def test_bulk_validate_accepts_complete_evidence(client, auth_headers):
    suspected_incident_id = "evt_bulk_complete"
    client.post("/api/suspected-incidents", json={**EVENT_PAYLOAD, "suspected_incident_id": suspected_incident_id})
    for evidence_type in ["frame_before", "frame_peak", "frame_after"]:
        resp = client.post(
            f"/api/suspected-incidents/{suspected_incident_id}/evidence",
            data={"evidence_type": evidence_type},
            files={"file": (f"{evidence_type}.jpg", b"img", "image/jpeg")},
        )
        assert resp.status_code == 200

    resp = client.patch("/api/suspected-incidents/review/bulk", headers=auth_headers, json={
        "suspected_incident_ids": [suspected_incident_id],
        "review_status": "validated",
        "operator_note": "完整证据批量确认",
        "operator_id": "reviewer_bulk",
    })

    assert resp.status_code == 200
    assert resp.json()["updated_count"] == 1
    assert resp.json()["failed_suspected_incident_ids"] == []
    detail = client.get(f"/api/suspected-incidents/{suspected_incident_id}").json()
    assert detail["review_status"] == "validated"
    assert detail["review_history"][0]["operator_id"] == "reviewer_bulk"


def test_duplicate_upload_does_not_overwrite_review(client, auth_headers):
    client.post("/api/suspected-incidents", json={**EVENT_PAYLOAD, "suspected_incident_id": "evt_keep"})
    client.patch("/api/suspected-incidents/evt_keep/review", headers=auth_headers, json={
        "review_status": "validated", "operator_note": "已确认",
    })
    client.post("/api/suspected-incidents", json={**EVENT_PAYLOAD, "suspected_incident_id": "evt_keep"})
    resp = client.get("/api/suspected-incidents/evt_keep")
    assert resp.json()["review_status"] == "validated"


def test_require_complete_evidence_blocks_confirmation(client, auth_headers):
    client.put("/api/settings", headers=auth_headers, json={
        "review_mode": "manual",
        "online_window_seconds": 60,
        "evidence_retention_days": 30,
        "require_complete_evidence": True,
        "device_access_mode": "open",
    })
    client.post("/api/suspected-incidents", json={**EVENT_PAYLOAD, "suspected_incident_id": "evt_incomplete"})
    resp = client.patch("/api/suspected-incidents/evt_incomplete/review", headers=auth_headers, json={
        "review_status": "validated",
        "operator_note": "no evidence",
    })
    assert resp.status_code == 422
    assert "Complete evidence" in resp.json()["detail"]


def test_delete_suspected_incident_removes_event_and_evidence(client, auth_headers):
    client.post("/api/suspected-incidents", json={**EVENT_PAYLOAD, "suspected_incident_id": "evt_del"})
    resp = client.delete("/api/suspected-incidents/evt_del", headers=auth_headers)
    assert resp.status_code == 200
    assert resp.json()["deleted"] is True
    resp = client.get("/api/suspected-incidents/evt_del")
    assert resp.status_code == 404


def test_delete_nonexistent_event_returns_404(client, auth_headers):
    resp = client.delete("/api/suspected-incidents/nonexistent", headers=auth_headers)
    assert resp.status_code == 404
