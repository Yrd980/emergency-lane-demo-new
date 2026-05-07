import json
from datetime import datetime, timezone, timedelta
from app.database import get_db

VALID_REVIEW_STATUSES = {"pending", "confirmed", "rejected"}
EVIDENCE_ORDER = {"frame_before": 0, "frame_peak": 1, "frame_after": 2, "video_clip": 3}

def _now():
    tz = timezone(timedelta(hours=8))
    return datetime.now(tz).isoformat()

def _priority_case(alias: str = "e"):
    return f"CASE WHEN {alias}.review_status='pending' AND ({alias}.confidence >= 0.85 OR {alias}.duration_seconds >= 10) THEN 0 ELSE 1 END"

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
            ORDER BY {_priority_case()}, e.created_at DESC LIMIT ? OFFSET ?""",
        params + [limit, offset],
    ).fetchall()

    items = []
    for r in rows:
        thumbnail_url = (
            f"/evidence/{r['event_id']}/{r['thumbnail_file_path'].split('/')[-1]}"
            if r["thumbnail_file_path"] else ""
        )
        risk_level = "high" if r["review_status"] == "pending" and (r["confidence"] >= 0.85 or r["duration_seconds"] >= 10) else "normal"
        priority_reason = "高置信度或长时间停留" if risk_level == "high" else "按时间顺序处理"
        items.append({
            "event_id": r["event_id"],
            "device_id": r["device_id"],
            "start_time": r["start_time"],
            "duration_seconds": r["duration_seconds"],
            "vehicle_class": r["vehicle_class"],
            "confidence": r["confidence"],
            "review_status": r["review_status"],
            "thumbnail_url": thumbnail_url,
            "risk_level": risk_level,
            "review_priority_reason": priority_reason,
        })

    return {"items": items, "total": total}

def get_event(event_id: str):
    conn = get_db()
    row = conn.execute("SELECT * FROM events WHERE event_id=?", (event_id,)).fetchone()
    if not row:
        return None

    evidence_rows = conn.execute(
        "SELECT * FROM evidence_files WHERE event_id=?",
        (event_id,),
    ).fetchall()
    history_rows = conn.execute(
        "SELECT * FROM review_history WHERE event_id=? ORDER BY reviewed_at DESC, id DESC",
        (event_id,),
    ).fetchall()

    evidence = []
    for ef in sorted(evidence_rows, key=lambda item: EVIDENCE_ORDER.get(item["evidence_type"], 99)):
        filename = ef["file_path"].split("/")[-1]
        evidence.append({
            "id": ef["id"],
            "event_id": ef["event_id"],
            "evidence_type": ef["evidence_type"],
            "mime_type": ef["mime_type"],
            "url": f"/evidence/{event_id}/{filename}",
        })
    evidence_types = {item["evidence_type"] for item in evidence}
    evidence_summary = {
        "has_before": "frame_before" in evidence_types,
        "has_peak": "frame_peak" in evidence_types,
        "has_after": "frame_after" in evidence_types,
        "has_video": any(item["mime_type"].startswith("video/") for item in evidence),
        "image_count": sum(1 for item in evidence if item["mime_type"].startswith("image/")),
        "video_count": sum(1 for item in evidence if item["mime_type"].startswith("video/")),
        "is_complete": {"frame_before", "frame_peak", "frame_after"}.issubset(evidence_types),
    }
    prev_row = conn.execute(
        "SELECT event_id FROM events WHERE created_at < ? ORDER BY created_at DESC LIMIT 1",
        (row["created_at"],),
    ).fetchone()
    next_pending_row = conn.execute(
        f"""SELECT event_id FROM events
            WHERE review_status='pending' AND event_id != ?
            ORDER BY {_priority_case('events')}, created_at DESC LIMIT 1""",
        (event_id,),
    ).fetchone()
    risk_level = "high" if row["review_status"] == "pending" and (row["confidence"] >= 0.85 or row["duration_seconds"] >= 10) else "normal"

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
        "evidence_summary": evidence_summary,
        "review_history": [
            {
                "id": history["id"],
                "event_id": history["event_id"],
                "operator_id": history["operator_id"],
                "from_status": history["from_status"],
                "to_status": history["to_status"],
                "operator_note": history["operator_note"],
                "reviewed_at": history["reviewed_at"],
            }
            for history in history_rows
        ],
        "risk_level": risk_level,
        "review_priority_reason": "高置信度或长时间停留" if risk_level == "high" else "按时间顺序处理",
        "previous_event_id": prev_row["event_id"] if prev_row else None,
        "next_event_id": next_pending_row["event_id"] if next_pending_row else None,
    }

def update_review(event_id: str, review_status: str, operator_note: str, operator_id: str = "本地复核员"):
    conn = get_db()
    now = _now()
    event = conn.execute(
        "SELECT review_status FROM events WHERE event_id=?",
        (event_id,),
    ).fetchone()
    if not event:
        return None
    from_status = event["review_status"]
    operator_id = (operator_id or "本地复核员").strip() or "本地复核员"
    cur = conn.execute(
        "UPDATE events SET review_status=?, operator_note=?, reviewed_at=? WHERE event_id=?",
        (review_status, operator_note, now, event_id),
    )
    conn.execute(
        """INSERT INTO review_history (event_id, operator_id, from_status, to_status, operator_note, reviewed_at)
           VALUES (?, ?, ?, ?, ?, ?)""",
        (event_id, operator_id, from_status, review_status, operator_note, now),
    )
    conn.commit()
    if cur.rowcount == 0:
        return None
    return {
        "event_id": event_id,
        "review_status": review_status,
        "operator_note": operator_note,
        "operator_id": operator_id,
        "reviewed_at": now,
    }

def bulk_update_review(event_ids: list[str], review_status: str, operator_note: str, operator_id: str = "本地复核员"):
    seen = []
    for event_id in event_ids:
        if event_id and event_id not in seen:
            seen.append(event_id)

    results = []
    missing_event_ids = []
    for event_id in seen:
        result = update_review(event_id, review_status, operator_note, operator_id)
        if result:
            results.append(result)
        else:
            missing_event_ids.append(event_id)

    return {
        "requested_count": len(seen),
        "updated_count": len(results),
        "missing_event_ids": missing_event_ids,
        "items": results,
    }
