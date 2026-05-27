import json
import os
import shutil
from datetime import datetime, timezone, timedelta
from app.database import get_db
from app.config import settings
from app.domain import incident_review, suspected_incident_read_model
from app.queries import suspected_incident_queries

def _now():
    tz = timezone(timedelta(hours=8))
    return datetime.now(tz).isoformat()

def create_suspected_incident(
    suspected_incident_id: str, device_id: str, start_time: str, end_time: str,
    duration_seconds: float, roi_id: str, track_id: str, vehicle_class: str,
    vehicle_box: dict, confidence: float, gps_location: dict,
):
    conn = get_db()
    try:
        cur = conn.execute(
            """INSERT OR IGNORE INTO suspected_incidents (suspected_incident_id, device_id, start_time, end_time, duration_seconds,
               roi_id, track_id, vehicle_class, vehicle_box_json, confidence, gps_json, created_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            (suspected_incident_id, device_id, start_time, end_time, duration_seconds,
             roi_id, track_id, vehicle_class, json.dumps(vehicle_box),
             confidence, json.dumps(gps_location), _now()),
        )
        conn.commit()
        if cur.rowcount == 0:
            return {"suspected_incident_id": suspected_incident_id, "accepted": False, "duplicate": True}
        return {"suspected_incident_id": suspected_incident_id, "accepted": True, "duplicate": False}
    finally:
        conn.close()

def list_suspected_incidents(
    status: str = None, device_id: str = None, roi_id: str = None,
    start_time_from: str = None, start_time_to: str = None,
    sort: str = "review_priority", limit: int = 50, offset: int = 0,
):
    limit = max(1, min(limit, 200))
    offset = max(0, offset)
    conn = get_db()
    try:
        rows, total = suspected_incident_queries.list_suspected_incidents(
            conn,
            status=status,
            device_id=device_id,
            roi_id=roi_id,
            start_time_from=start_time_from,
            start_time_to=start_time_to,
            sort=sort,
            limit=limit,
            offset=offset,
        )
    finally:
        conn.close()

    return {"items": [suspected_incident_read_model.list_item(row) for row in rows], "total": total}

def get_suspected_incident(suspected_incident_id: str):
    conn = get_db()
    try:
        row = suspected_incident_queries.get_suspected_incident(conn, suspected_incident_id)
        if not row:
            return None

        evidence_rows = suspected_incident_queries.get_evidence_rows(conn, suspected_incident_id)
        review_history_rows = suspected_incident_queries.get_review_history_rows(conn, suspected_incident_id)
        previous_suspected_incident_id = suspected_incident_queries.get_previous_suspected_incident_id(conn, row["created_at"])
        next_suspected_incident_id = suspected_incident_queries.get_next_pending_suspected_incident_id(conn, suspected_incident_id)
    finally:
        conn.close()

    return suspected_incident_read_model.detail(
        row,
        evidence_rows,
        review_history_rows,
        previous_suspected_incident_id,
        next_suspected_incident_id,
    )

def update_review(suspected_incident_id: str, review_status: str, operator_note: str, operator_id: str = "本地复核员"):
    error = incident_review.validate_review_status(review_status)
    if error:
        return {"suspected_incident_id": suspected_incident_id, "review_status": review_status, "error": error}
    conn = get_db()
    try:
        now = _now()
        suspected_incident = conn.execute(
            "SELECT review_status FROM suspected_incidents WHERE suspected_incident_id=?",
            (suspected_incident_id,),
        ).fetchone()
        if not suspected_incident:
            return None
        from_status = suspected_incident["review_status"]
        operator_id = incident_review.normalize_operator(operator_id)

        if review_status == "validated":
            settings_row = conn.execute(
                "SELECT require_complete_evidence FROM runtime_settings WHERE id=1"
            ).fetchone()
            guard = incident_review.confirmation_guard(
                conn,
                suspected_incident_id,
                bool(settings_row and settings_row["require_complete_evidence"]),
            )
            if guard:
                return {"suspected_incident_id": suspected_incident_id, "review_status": review_status, "error": guard}

        cur = conn.execute(
            "UPDATE suspected_incidents SET review_status=?, operator_note=?, reviewed_at=? WHERE suspected_incident_id=?",
            (review_status, operator_note, now, suspected_incident_id),
        )
        conn.execute(
            """INSERT INTO review_history (suspected_incident_id, operator_id, from_status, to_status, operator_note, reviewed_at)
               VALUES (?, ?, ?, ?, ?, ?)""",
            (suspected_incident_id, operator_id, from_status, review_status, operator_note, now),
        )
        conn.commit()
        if cur.rowcount == 0:
            return None
        return {
            "suspected_incident_id": suspected_incident_id,
            "review_status": review_status,
            "operator_note": operator_note,
            "operator_id": operator_id,
            "reviewed_at": now,
        }
    finally:
        conn.close()

def bulk_update_review(suspected_incident_ids: list[str], review_status: str, operator_note: str, operator_id: str = "本地复核员"):
    seen = []
    for suspected_incident_id in suspected_incident_ids:
        if suspected_incident_id and suspected_incident_id not in seen:
            seen.append(suspected_incident_id)

    results = []
    missing_suspected_incident_ids = []
    failed_suspected_incident_ids = []
    for suspected_incident_id in seen:
        if review_status == "validated":
            conn = get_db()
            try:
                guard = incident_review.bulk_confirmation_guard(conn, suspected_incident_id)
            finally:
                conn.close()
            if guard:
                failed_suspected_incident_ids.append(suspected_incident_id)
                continue
        result = update_review(suspected_incident_id, review_status, operator_note, operator_id)
        if not result:
            missing_suspected_incident_ids.append(suspected_incident_id)
        elif "error" in result:
            failed_suspected_incident_ids.append(suspected_incident_id)
        else:
            results.append(result)

    return {
        "requested_count": len(seen),
        "updated_count": len(results),
        "missing_suspected_incident_ids": missing_suspected_incident_ids,
        "failed_suspected_incident_ids": failed_suspected_incident_ids,
        "items": results,
    }


def validate_suspected_incident(suspected_incident_id: str, note: str, user: dict):
    return update_review(suspected_incident_id, "validated", note, user["display_name"])


def mark_false_alarm(suspected_incident_id: str, note: str, user: dict):
    return update_review(suspected_incident_id, "false_alarm", note, user["display_name"])


def delete_suspected_incident(suspected_incident_id: str):
    conn = get_db()
    try:
        conn.execute("DELETE FROM evidence_files WHERE suspected_incident_id=?", (suspected_incident_id,))
        conn.execute("DELETE FROM review_history WHERE suspected_incident_id=?", (suspected_incident_id,))
        cur = conn.execute("DELETE FROM suspected_incidents WHERE suspected_incident_id=?", (suspected_incident_id,))
        conn.commit()
        if cur.rowcount == 0:
            return None
        event_dir = os.path.join(settings.evidence_dir, suspected_incident_id)
        if os.path.isdir(event_dir):
            shutil.rmtree(event_dir)
        return {"suspected_incident_id": suspected_incident_id, "deleted": True}
    finally:
        conn.close()
