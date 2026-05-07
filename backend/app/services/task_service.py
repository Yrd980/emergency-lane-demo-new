import uuid
from datetime import datetime, timedelta, timezone

from app.database import get_db


def _now():
    return datetime.now(timezone(timedelta(hours=8))).isoformat()


def _risk_level(row):
    return "high" if row["confidence"] >= 0.85 or row["duration_seconds"] >= 10 else "normal"


def _thumbnail_url(row):
    return f"/evidence/{row['event_id']}/{row['thumbnail_file_path'].split('/')[-1]}" if row["thumbnail_file_path"] else ""


def _serialize(row):
    return {
        "task_id": row["task_id"],
        "event_id": row["event_id"],
        "status": row["status"],
        "note": row["note"],
        "assigned_to_username": row["assigned_to_username"],
        "assigned_to_display_name": row["assigned_to_display_name"],
        "assigned_to_device_id": row["assigned_to_device_id"],
        "assigned_by_username": row["assigned_by_username"],
        "assigned_by_display_name": row["assigned_by_display_name"],
        "created_at": row["created_at"],
        "accepted_at": row["accepted_at"],
        "completed_at": row["completed_at"],
        "completed_note": row["completed_note"],
        "vehicle_class": row["vehicle_class"],
        "confidence": row["confidence"],
        "start_time": row["start_time"],
        "device_id": row["device_id"],
        "risk_level": _risk_level(row),
        "thumbnail_url": _thumbnail_url(row),
    }


def _task_select():
    return """
        SELECT t.*,
               assignee.username AS assigned_to_username,
               assignee.display_name AS assigned_to_display_name,
               assigner.username AS assigned_by_username,
               assigner.display_name AS assigned_by_display_name,
               e.device_id, e.start_time, e.duration_seconds, e.vehicle_class, e.confidence,
               (SELECT file_path FROM evidence_files ef
                WHERE ef.event_id = e.event_id AND ef.evidence_type = 'frame_peak'
                LIMIT 1) AS thumbnail_file_path
        FROM dispatch_tasks t
        JOIN events e ON e.event_id = t.event_id
        LEFT JOIN users assignee ON assignee.id = t.assigned_to_user_id
        JOIN users assigner ON assigner.id = t.assigned_by_user_id
    """


def list_tasks(user: dict, status: str | None = None, assigned_to_me: bool = False, limit: int = 50):
    conn = get_db()
    try:
        clauses = []
        params = []
        if status:
            clauses.append("t.status = ?")
            params.append(status)
        if assigned_to_me or user["role"] == "patrol":
            clauses.append("t.assigned_to_user_id = ?")
            params.append(user["id"])
        where = f"WHERE {' AND '.join(clauses)}" if clauses else ""
        rows = conn.execute(
            f"{_task_select()} {where} ORDER BY t.created_at DESC LIMIT ?",
            params + [max(1, min(limit, 200))],
        ).fetchall()
        return {"items": [_serialize(row) for row in rows], "total": len(rows)}
    finally:
        conn.close()


def assign_task(event_id: str, assigned_to_username: str | None, assigned_to_device_id: str | None, note: str, assigner: dict):
    conn = get_db()
    try:
        event = conn.execute("SELECT review_status FROM events WHERE event_id=?", (event_id,)).fetchone()
        if not event:
            return None

        assignee = None
        if assigned_to_username:
            assignee = conn.execute(
                "SELECT * FROM users WHERE username=? AND role IN ('patrol', 'admin')",
                (assigned_to_username,),
            ).fetchone()
            if not assignee:
                return {"error": "Assigned patrol user not found"}

        task_id = f"task_{uuid.uuid4().hex[:12]}"
        now = _now()
        conn.execute(
            """INSERT INTO dispatch_tasks (
                   task_id, event_id, assigned_to_user_id, assigned_to_device_id,
                   assigned_by_user_id, status, note, created_at
               ) VALUES (?, ?, ?, ?, ?, 'assigned', ?, ?)""",
            (
                task_id,
                event_id,
                assignee["id"] if assignee else None,
                assigned_to_device_id,
                assigner["id"],
                note or "",
                now,
            ),
        )
        _record_event_status(conn, event_id, event["review_status"], "assigned", note or "Assigned to patrol", assigner["display_name"], now)
        conn.commit()
        return get_task(task_id, conn=conn)
    finally:
        conn.close()


def accept_task(task_id: str, user: dict):
    conn = get_db()
    try:
        row = conn.execute("SELECT * FROM dispatch_tasks WHERE task_id=?", (task_id,)).fetchone()
        if not row:
            return None
        if row["assigned_to_user_id"] and row["assigned_to_user_id"] != user["id"] and user["role"] != "admin":
            return {"error": "Task is assigned to another patrol user"}
        if row["status"] not in ("assigned", "accepted"):
            return {"error": "Task cannot be accepted from current status"}
        now = _now()
        conn.execute(
            "UPDATE dispatch_tasks SET status='accepted', accepted_at=COALESCE(accepted_at, ?) WHERE task_id=?",
            (now, task_id),
        )
        event = conn.execute("SELECT review_status FROM events WHERE event_id=?", (row["event_id"],)).fetchone()
        _record_event_status(conn, row["event_id"], event["review_status"], "accepted", "Patrol accepted task", user["display_name"], now)
        conn.commit()
        return get_task(task_id, conn=conn)
    finally:
        conn.close()


def complete_task(task_id: str, completed_note: str, user: dict):
    conn = get_db()
    try:
        row = conn.execute("SELECT * FROM dispatch_tasks WHERE task_id=?", (task_id,)).fetchone()
        if not row:
            return None
        if row["assigned_to_user_id"] and row["assigned_to_user_id"] != user["id"] and user["role"] != "admin":
            return {"error": "Task is assigned to another patrol user"}
        if row["status"] not in ("assigned", "accepted"):
            return {"error": "Task cannot be completed from current status"}
        now = _now()
        conn.execute(
            """UPDATE dispatch_tasks
               SET status='completed', accepted_at=COALESCE(accepted_at, ?),
                   completed_at=?, completed_note=?
               WHERE task_id=?""",
            (now, now, completed_note or "", task_id),
        )
        event = conn.execute("SELECT review_status FROM events WHERE event_id=?", (row["event_id"],)).fetchone()
        _record_event_status(conn, row["event_id"], event["review_status"], "completed", completed_note or "Patrol completed task", user["display_name"], now)
        conn.commit()
        return get_task(task_id, conn=conn)
    finally:
        conn.close()


def get_task(task_id: str, conn=None):
    own_conn = conn is None
    conn = conn or get_db()
    try:
        row = conn.execute(f"{_task_select()} WHERE t.task_id=?", (task_id,)).fetchone()
        return _serialize(row) if row else None
    finally:
        if own_conn:
            conn.close()


def _record_event_status(conn, event_id: str, from_status: str, to_status: str, note: str, operator_id: str, now: str):
    conn.execute(
        "UPDATE events SET review_status=?, operator_note=?, reviewed_at=? WHERE event_id=?",
        (to_status, note, now, event_id),
    )
    conn.execute(
        """INSERT INTO review_history (event_id, operator_id, from_status, to_status, operator_note, reviewed_at)
           VALUES (?, ?, ?, ?, ?, ?)""",
        (event_id, operator_id, from_status, to_status, note, now),
    )
