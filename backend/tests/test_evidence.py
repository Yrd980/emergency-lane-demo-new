import io

BASE_EVENT = {
    "suspected_incident_id": "evt_ev",
    "device_id": "vivo_001",
    "start_time": "2026-05-05T10:00:00+08:00",
    "end_time": "2026-05-05T10:00:12+08:00",
    "duration_seconds": 12,
    "roi_id": "roi_default",
    "track_id": "track_42",
    "vehicle_class": "car",
    "vehicle_box": {"x": 0, "y": 0, "width": 100, "height": 100},
    "confidence": 0.86,
}

def test_upload_evidence(client):
    client.post("/api/suspected-incidents", json=BASE_EVENT)
    fake_img = io.BytesIO(b"\xff\xd8\xff\x00fake-jpeg")
    resp = client.post(
        "/api/suspected-incidents/evt_ev/evidence",
        files={"file": ("frame_peak.jpg", fake_img, "image/jpeg")},
        data={"evidence_type": "frame_peak"},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["stored"] is True
    assert data["evidence_type"] == "frame_peak"
    assert "frame_peak.jpg" in data["url"]


def test_upload_evidence_rejects_unsupported_evidence_type(client):
    client.post("/api/suspected-incidents", json={**BASE_EVENT, "suspected_incident_id": "evt_bad_evidence"})
    fake_img = io.BytesIO(b"\xff\xd8\xff\x00fake-jpeg")

    resp = client.post(
        "/api/suspected-incidents/evt_bad_evidence/evidence",
        files={"file": ("dashboard.jpg", fake_img, "image/jpeg")},
        data={"evidence_type": "dashboard_view"},
    )

    assert resp.status_code == 422
    assert resp.json()["detail"] == "Unsupported evidence type"


def test_evidence_appears_in_event_detail(client):
    client.post("/api/suspected-incidents", json=BASE_EVENT)
    fake_img = io.BytesIO(b"fakeimg")
    client.post(
        "/api/suspected-incidents/evt_ev/evidence",
        files={"file": ("frame_peak.jpg", fake_img, "image/jpeg")},
        data={"evidence_type": "frame_peak"},
    )
    resp = client.get("/api/suspected-incidents/evt_ev")
    assert len(resp.json()["evidence_files"]) == 1
