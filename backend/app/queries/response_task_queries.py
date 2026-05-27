from app.domain import suspected_incident_read_model


def task_select_sql():
    return """
        SELECT t.*,
               assignee.username AS assigned_to_username,
               assignee.display_name AS assigned_to_display_name,
               assigner.username AS assigned_by_username,
               assigner.display_name AS assigned_by_display_name,
               e.device_id, e.start_time, e.duration_seconds, e.vehicle_class, e.confidence,
               """ + suspected_incident_read_model.thumbnail_select_sql() + """
        FROM dispatch_tasks t
        JOIN suspected_incidents e ON e.suspected_incident_id = t.suspected_incident_id
        LEFT JOIN users assignee ON assignee.id = t.assigned_to_user_id
        JOIN users assigner ON assigner.id = t.assigned_by_user_id
    """


def list_response_tasks(conn, user: dict, status: str | None = None, assigned_to_me: bool = False, limit: int = 50):
    clauses = []
    params = []
    if status:
        clauses.append("t.status = ?")
        params.append(status)
    if assigned_to_me or user["role"] == "patrol":
        clauses.append("t.assigned_to_user_id = ?")
        params.append(user["id"])
    where = f"WHERE {' AND '.join(clauses)}" if clauses else ""
    return conn.execute(
        f"{task_select_sql()} {where} ORDER BY t.created_at DESC LIMIT ?",
        params + [max(1, min(limit, 200))],
    ).fetchall()


def get_response_task(conn, task_id: str):
    return conn.execute(f"{task_select_sql()} WHERE t.task_id=?", (task_id,)).fetchone()


def get_task_row(conn, task_id: str):
    return conn.execute("SELECT * FROM dispatch_tasks WHERE task_id=?", (task_id,)).fetchone()


def get_active_task_for_suspected_incident(conn, suspected_incident_id: str):
    return conn.execute(
        """SELECT task_id FROM dispatch_tasks
           WHERE suspected_incident_id=? AND status IN ('assigned', 'accepted')
           LIMIT 1""",
        (suspected_incident_id,),
    ).fetchone()
