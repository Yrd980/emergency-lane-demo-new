from app.domain import review_priority, suspected_incident_read_model


def review_priority_order_sql(alias: str = "e") -> str:
    return (
        f"CASE WHEN {alias}.review_status='pending' AND "
        f"({alias}.confidence >= {review_priority.HIGH_CONFIDENCE_THRESHOLD} OR "
        f"{alias}.duration_seconds >= {review_priority.LONG_OCCUPATION_SECONDS}) THEN 0 ELSE 1 END"
    )


def list_suspected_incidents(
    conn,
    status: str = None,
    device_id: str = None,
    roi_id: str = None,
    start_time_from: str = None,
    start_time_to: str = None,
    sort: str = "review_priority",
    limit: int = 50,
    offset: int = 0,
):
    clauses = []
    params = []

    if status:
        clauses.append("e.review_status = ?")
        params.append(status)
    if device_id:
        clauses.append("e.device_id = ?")
        params.append(device_id)
    if roi_id:
        clauses.append("e.roi_id = ?")
        params.append(roi_id)
    if start_time_from:
        clauses.append("e.start_time >= ?")
        params.append(start_time_from)
    if start_time_to:
        clauses.append("e.start_time <= ?")
        params.append(start_time_to)

    where = "WHERE " + " AND ".join(clauses) if clauses else ""
    total = conn.execute(f"SELECT COUNT(*) FROM suspected_incidents e {where}", params).fetchone()[0]
    order_by = (
        f"{review_priority_order_sql()}, e.created_at DESC"
        if sort == "review_priority"
        else "e.created_at DESC"
    )
    rows = conn.execute(
        f"""SELECT e.*,
                   {suspected_incident_read_model.thumbnail_select_sql()}
            FROM suspected_incidents e {where}
            ORDER BY {order_by} LIMIT ? OFFSET ?""",
        params + [limit, offset],
    ).fetchall()
    return rows, total


def get_suspected_incident(conn, suspected_incident_id: str):
    return conn.execute("SELECT * FROM suspected_incidents WHERE suspected_incident_id=?", (suspected_incident_id,)).fetchone()


def get_evidence_rows(conn, suspected_incident_id: str):
    return conn.execute("SELECT * FROM evidence_files WHERE suspected_incident_id=?", (suspected_incident_id,)).fetchall()


def get_review_history_rows(conn, suspected_incident_id: str):
    return conn.execute(
        "SELECT * FROM review_history WHERE suspected_incident_id=? ORDER BY reviewed_at DESC, id DESC",
        (suspected_incident_id,),
    ).fetchall()


def get_previous_suspected_incident_id(conn, created_at: str):
    row = conn.execute(
        "SELECT suspected_incident_id FROM suspected_incidents WHERE created_at < ? ORDER BY created_at DESC LIMIT 1",
        (created_at,),
    ).fetchone()
    return row["suspected_incident_id"] if row else None


def get_next_pending_suspected_incident_id(conn, suspected_incident_id: str):
    row = conn.execute(
        f"""SELECT suspected_incident_id FROM suspected_incidents
            WHERE review_status='pending' AND suspected_incident_id != ?
            ORDER BY {review_priority_order_sql('suspected_incidents')}, created_at DESC LIMIT 1""",
        (suspected_incident_id,),
    ).fetchone()
    return row["suspected_incident_id"] if row else None


def recent_suspected_incidents(conn, limit: int = 10):
    return conn.execute(
        f"""SELECT e.*,
                   {suspected_incident_read_model.thumbnail_select_sql()}
            FROM suspected_incidents e
            ORDER BY e.created_at DESC LIMIT ?""",
        (limit,),
    ).fetchall()


def recent_suspected_incidents_for_device(conn, device_id: str, limit: int = 8):
    return conn.execute(
        """SELECT suspected_incident_id, start_time, duration_seconds, vehicle_class, confidence, review_status
           FROM suspected_incidents WHERE device_id=?
           ORDER BY created_at DESC LIMIT ?""",
        (device_id, limit),
    ).fetchall()
