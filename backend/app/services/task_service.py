import uuid
from datetime import datetime, timedelta, timezone

from app.database import get_db
from app.domain import response_task, suspected_incident_read_model
from app.queries import response_task_queries


def _now():
    return datetime.now(timezone(timedelta(hours=8))).isoformat()


def _serialize(row):
    return {
        "task_id": row["task_id"],
        "suspected_incident_id": row["suspected_incident_id"],
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
        **suspected_incident_read_model.task_context(row),
    }


def list_tasks(user: dict, status: str | None = None, assigned_to_me: bool = False, limit: int = 50):
    conn = get_db()
    try:
        rows = response_task_queries.list_response_tasks(
            conn,
            user,
            status=status,
            assigned_to_me=assigned_to_me,
            limit=limit,
        )
        return {"items": [_serialize(row) for row in rows], "total": len(rows)}
    finally:
        conn.close()


def assign_task(suspected_incident_id: str, assigned_to_username: str | None, assigned_to_device_id: str | None, note: str, assigner: dict):
    conn = get_db()
    try:
        suspected_incident = conn.execute("SELECT review_status FROM suspected_incidents WHERE suspected_incident_id=?", (suspected_incident_id,)).fetchone()
        if not suspected_incident:
            return None
        guard = response_task.assignment_guard(suspected_incident["review_status"])
        if guard:
            return {"error": guard}

        active_task = response_task_queries.get_active_task_for_suspected_incident(conn, suspected_incident_id)
        if active_task:
            return {"error": "Suspected incident already has an active response task"}

        assignee = None
        if assigned_to_username:
            assignee = conn.execute(
                "SELECT * FROM users WHERE username=? AND role = 'patrol'",
                (assigned_to_username,),
            ).fetchone()
            if not assignee:
                return {"error": "未找到指定巡查员"}

        task_id = f"task_{uuid.uuid4().hex[:12]}"
        now = _now()
        conn.execute(
            """INSERT INTO dispatch_tasks (
                   task_id, suspected_incident_id, assigned_to_user_id, assigned_to_device_id,
                   assigned_by_user_id, status, note, created_at
               ) VALUES (?, ?, ?, ?, ?, 'assigned', ?, ?)""",
            (
                task_id,
                suspected_incident_id,
                assignee["id"] if assignee else None,
                assigned_to_device_id,
                assigner["id"],
                note or "",
                now,
            ),
        )
        conn.commit()
        return get_task(task_id, conn=conn)
    finally:
        conn.close()


def accept_task(task_id: str, user: dict):
    conn = get_db()
    try:
        row = response_task_queries.get_task_row(conn, task_id)
        if not row:
            return None
        guard = response_task.actor_guard(row, user)
        if guard:
            return {"error": guard}
        if not response_task.can_accept(row["status"]):
            return {"error": "当前状态无法接单"}
        now = _now()
        conn.execute(
            "UPDATE dispatch_tasks SET status='accepted', accepted_at=COALESCE(accepted_at, ?) WHERE task_id=?",
            (now, task_id),
        )
        conn.commit()
        return get_task(task_id, conn=conn)
    finally:
        conn.close()


def complete_task(task_id: str, completed_note: str, user: dict):
    conn = get_db()
    try:
        row = response_task_queries.get_task_row(conn, task_id)
        if not row:
            return None
        guard = response_task.actor_guard(row, user)
        if guard:
            return {"error": guard}
        if not response_task.can_complete(row["status"]):
            return {"error": "当前状态无法完成任务"}
        now = _now()
        conn.execute(
            """UPDATE dispatch_tasks
               SET status='completed', accepted_at=COALESCE(accepted_at, ?),
                   completed_at=?, completed_note=?
               WHERE task_id=?""",
            (now, now, completed_note or "", task_id),
        )
        conn.commit()
        return get_task(task_id, conn=conn)
    finally:
        conn.close()


def get_task(task_id: str, conn=None):
    own_conn = conn is None
    conn = conn or get_db()
    try:
        row = response_task_queries.get_response_task(conn, task_id)
        return _serialize(row) if row else None
    finally:
        if own_conn:
            conn.close()
