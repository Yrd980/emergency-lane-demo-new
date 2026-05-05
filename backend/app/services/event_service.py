import json
from datetime import datetime, timezone, timedelta
from app.database import get_db

VALID_REVIEW_STATUSES = {"pending", "confirmed", "rejected"}

def _now():
    tz = timezone(timedelta(hours=8))
    return datetime.now(tz).isoformat()

def create_event(
    event_id: str, device_id: str, start_time: str, end_time: str,
    duration_seconds: float, roi_id: str, track_id: str, vehicle_class: str,
    vehicle_box: dict, confidence: float, gps_location: dict,
):
    conn = get_db()
    cur = conn.execute(
        """INSERT OR IGNORE INTO events (event_id, device_id, start_time, end_time, duration_seconds,
           roi_id, track_id, vehicle_class, vehicle_box_json, confidence, gps_json, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
        (event_id, device_id, start_time, end_time, duration_seconds,
         roi_id, track_id, vehicle_class, json.dumps(vehicle_box),
         confidence, json.dumps(gps_location), _now()),
    )
    conn.commit()
    if cur.rowcount == 0:
        return {"event_id": event_id, "accepted": False, "duplicate": True}
    return {"event_id": event_id, "accepted": True, "duplicate": False}

def list_events(
    status: str = None, device_id: str = None,
    start_time_from: str = None, start_time_to: str = None,
    limit: int = 50, offset: int = 0,
):
    limit = max(1, min(limit, 200))
    offset = max(0, offset)
    conn = get_db()
    clauses = []
    params = []

    if status:
        clauses.append("e.review_status = ?")
        params.append(status)
    if device_id:
        clauses.append("e.device_id = ?")
        params.append(device_id)
    if start_time_from:
        clauses.append("e.start_time >= ?")
        params.append(start_time_from)
    if start_time_to:
        clauses.append("e.start_time <= ?")
        params.append(start_time_to)

    where = "WHERE " + " AND ".join(clauses) if clauses else ""

    count_sql = f"SELECT COUNT(*) FROM events e {where}"
    total = conn.execute(count_sql, params).fetchone()[0]

    rows = conn.execute(
        f"""SELECT e.*,
                   (SELECT file_path FROM evidence_files ef
                    WHERE ef.event_id = e.event_id AND ef.evidence_type = 'frame_peak'
                    LIMIT 1) AS thumbnail_file_path
            FROM events e {where}
            ORDER BY e.created_at DESC LIMIT ? OFFSET ?""",
        params + [limit, offset],
    ).fetchall()

    items = []
    for r in rows:
        thumbnail_url = (
            f"/evidence/{r['event_id']}/{r['thumbnail_file_path'].split('/')[-1]}"
            if r["thumbnail_file_path"] else ""
        )
        items.append({
            "event_id": r["event_id"],
            "device_id": r["device_id"],
            "start_time": r["start_time"],
            "duration_seconds": r["duration_seconds"],
            "vehicle_class": r["vehicle_class"],
            "confidence": r["confidence"],
            "review_status": r["review_status"],
            "thumbnail_url": thumbnail_url,
        })

    return {"items": items, "total": total}

def get_event(event_id: str):
    conn = get_db()
    row = conn.execute("SELECT * FROM events WHERE event_id=?", (event_id,)).fetchone()
    if not row:
        return None

    evidence_rows = conn.execute(
        "SELECT * FROM evidence_files WHERE event_id=? ORDER BY evidence_type",
        (event_id,),
    ).fetchall()

    evidence = []
    for ef in evidence_rows:
        filename = ef["file_path"].split("/")[-1]
        evidence.append({
            "id": ef["id"],
            "event_id": ef["event_id"],
            "evidence_type": ef["evidence_type"],
            "mime_type": ef["mime_type"],
            "url": f"/evidence/{event_id}/{filename}",
        })

    return {
        "event_id": row["event_id"],
        "device_id": row["device_id"],
        "start_time": row["start_time"],
        "end_time": row["end_time"],
        "duration_seconds": row["duration_seconds"],
        "roi_id": row["roi_id"],
        "track_id": row["track_id"],
        "vehicle_class": row["vehicle_class"],
        "vehicle_box": json.loads(row["vehicle_box_json"]),
        "confidence": row["confidence"],
        "gps_location": json.loads(row["gps_json"]),
        "review_status": row["review_status"],
        "operator_note": row["operator_note"],
        "created_at": row["created_at"],
        "reviewed_at": row["reviewed_at"],
        "evidence_files": evidence,
    }

def update_review(event_id: str, review_status: str, operator_note: str):
    conn = get_db()
    now = _now()
    cur = conn.execute(
        "UPDATE events SET review_status=?, operator_note=?, reviewed_at=? WHERE event_id=?",
        (review_status, operator_note, now, event_id),
    )
    conn.commit()
    if cur.rowcount == 0:
        return None
    return {
        "event_id": event_id,
        "review_status": review_status,
        "operator_note": operator_note,
        "reviewed_at": now,
    }
