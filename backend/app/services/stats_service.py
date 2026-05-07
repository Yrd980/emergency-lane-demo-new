from datetime import datetime, timezone, timedelta
from app.database import get_db
from app.services.settings_service import get_effective_online_threshold

def _now():
    tz = timezone(timedelta(hours=8))
    return datetime.now(tz)

def _parse_date(value, fallback):
    if not value:
        return fallback
    try:
        parsed = datetime.fromisoformat(value)
        if parsed.tzinfo is None:
            return parsed.replace(tzinfo=_now().tzinfo)
        return parsed
    except ValueError:
        return fallback

def _operation_window(period, start_date=None, end_date=None):
    now = _now()
    if period == "qtd":
        month = ((now.month - 1) // 3) * 3 + 1
        start = now.replace(month=month, day=1, hour=0, minute=0, second=0, microsecond=0)
    elif period == "ytd":
        start = now.replace(month=1, day=1, hour=0, minute=0, second=0, microsecond=0)
    elif period == "custom":
        start = _parse_date(start_date, now - timedelta(days=30))
        end = _parse_date(end_date, now)
        return start.isoformat(), end.isoformat(), "Custom Range"
    else:
        start = now - timedelta(days=30)
    return start.isoformat(), now.isoformat(), {
        "30d": "Last 30 Days",
        "qtd": "Quarter to Date",
        "ytd": "Year to Date",
    }.get(period, "Last 30 Days")

def _with_roi(sql, params, roi_id):
    if not roi_id:
        return sql, params
    return f"{sql} AND roi_id = ?", (*params, roi_id)

def get_overview():
    conn = get_db()
    now = _now()
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0).isoformat()
    now_iso = now.isoformat()

    total_today = conn.execute(
        "SELECT COUNT(*) FROM events WHERE start_time >= ? AND start_time <= ?",
        (today_start, now_iso),
    ).fetchone()[0]

    pending = conn.execute("SELECT COUNT(*) FROM events WHERE review_status='pending'").fetchone()[0]
    confirmed = conn.execute("SELECT COUNT(*) FROM events WHERE review_status='validated'").fetchone()[0]
    rejected = conn.execute("SELECT COUNT(*) FROM events WHERE review_status='false_alarm'").fetchone()[0]

    threshold = (now - timedelta(seconds=get_effective_online_threshold())).isoformat()
    online = conn.execute(
        "SELECT COUNT(*) FROM devices WHERE last_seen_at >= ?", (threshold,)
    ).fetchone()[0]

    recent_rows = conn.execute(
        """SELECT e.*,
                  (SELECT file_path FROM evidence_files ef
                   WHERE ef.event_id = e.event_id AND ef.evidence_type = 'frame_peak'
                   LIMIT 1) AS thumbnail_file_path
           FROM events e
           ORDER BY e.created_at DESC LIMIT 10"""
    ).fetchall()

    recent = []
    for r in recent_rows:
        thumbnail_url = (
            f"/evidence/{r['event_id']}/{r['thumbnail_file_path'].split('/')[-1]}"
            if r["thumbnail_file_path"] else ""
        )
        recent.append({
            "event_id": r["event_id"],
            "device_id": r["device_id"],
            "start_time": r["start_time"],
            "duration_seconds": r["duration_seconds"],
            "vehicle_class": r["vehicle_class"],
            "confidence": r["confidence"],
            "review_status": r["review_status"],
            "thumbnail_url": thumbnail_url,
        })

    return {
        "total_events_today": total_today,
        "pending_review_count": pending,
        "confirmed_count": confirmed,
        "rejected_count": rejected,
        "online_device_count": online,
        "recent_events": recent,
    }


def get_operations(period="30d", roi_id=None, start_date=None, end_date=None):
    conn = get_db()
    now = _now()
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0).isoformat()
    window_start, window_end, period_label = _operation_window(period, start_date, end_date)

    total_sql, total_params = _with_roi(
        "SELECT COUNT(*) FROM events WHERE start_time >= ? AND start_time <= ?",
        (window_start, window_end),
        roi_id,
    )
    total_violations = conn.execute(total_sql, total_params).fetchone()[0]

    pending_sql, pending_params = _with_roi(
        "SELECT COUNT(*) FROM events WHERE review_status='pending' AND start_time >= ? AND start_time <= ?",
        (window_start, window_end),
        roi_id,
    )
    pending = conn.execute(pending_sql, pending_params).fetchone()[0]

    validated_sql, validated_params = _with_roi(
        "SELECT COUNT(*) FROM events WHERE review_status='validated' AND start_time >= ? AND start_time <= ?",
        (window_start, window_end),
        roi_id,
    )
    validated = conn.execute(validated_sql, validated_params).fetchone()[0]

    false_sql, false_params = _with_roi(
        "SELECT COUNT(*) FROM events WHERE review_status='false_alarm' AND start_time >= ? AND start_time <= ?",
        (window_start, window_end),
        roi_id,
    )
    false_alarms = conn.execute(false_sql, false_params).fetchone()[0]
    assigned = conn.execute("SELECT COUNT(*) FROM dispatch_tasks WHERE status IN ('assigned', 'accepted')").fetchone()[0]
    completed = conn.execute("SELECT COUNT(*) FROM dispatch_tasks WHERE status='completed'").fetchone()[0]

    response_rows = conn.execute(
        """SELECT (julianday(COALESCE(accepted_at, completed_at)) - julianday(created_at)) * 24 * 60 AS minutes
           FROM dispatch_tasks
           WHERE COALESCE(accepted_at, completed_at) IS NOT NULL"""
    ).fetchall()
    avg_response = sum(row["minutes"] for row in response_rows if row["minutes"] is not None) / max(1, len(response_rows))

    trend_sql = """SELECT substr(start_time, 1, 10) AS day,
                          COUNT(*) AS total,
                          SUM(CASE WHEN review_status='validated' THEN 1 ELSE 0 END) AS validated
                   FROM events
                   WHERE start_time >= ? AND start_time <= ?"""
    trend_params = (window_start, window_end)
    trend_sql, trend_params = _with_roi(trend_sql, trend_params, roi_id)
    trend_rows = conn.execute(
        f"{trend_sql} GROUP BY day ORDER BY day",
        trend_params,
    ).fetchall()

    hotspot_sql = """SELECT roi_id,
                            COUNT(*) AS count,
                            SUM(CASE WHEN review_status='pending' THEN 1 ELSE 0 END) AS pending
                     FROM events
                     WHERE start_time >= ? AND start_time <= ?"""
    hotspot_params = (window_start, window_end)
    hotspot_sql, hotspot_params = _with_roi(hotspot_sql, hotspot_params, roi_id)
    hotspot_rows = conn.execute(
        f"{hotspot_sql} GROUP BY roi_id ORDER BY count DESC LIMIT 5",
        hotspot_params,
    ).fetchall()

    operator_rows = conn.execute(
        """SELECT u.username, u.display_name,
                  COUNT(t.id) AS tasks,
                  SUM(CASE WHEN t.status='completed' THEN 1 ELSE 0 END) AS completed
           FROM users u
           LEFT JOIN dispatch_tasks t ON t.assigned_to_user_id = u.id
           WHERE u.role IN ('patrol', 'admin')
           GROUP BY u.id
           ORDER BY completed DESC, tasks DESC
           LIMIT 5"""
    ).fetchall()

    latest_event = conn.execute("SELECT MAX(created_at) FROM events").fetchone()[0]
    return {
        "summary": {
            "total_violations": total_violations,
            "pending_review": pending,
            "validated": validated,
            "false_alarms": false_alarms,
            "assigned_tasks": assigned,
            "completed_tasks": completed,
            "avg_response_minutes": round(avg_response, 1),
            "today_events": conn.execute("SELECT COUNT(*) FROM events WHERE start_time >= ?", (today_start,)).fetchone()[0],
            "latest_event_at": latest_event,
            "period_label": period_label,
            "roi_id": roi_id,
        },
        "trend": [
            {"day": row["day"], "total": row["total"], "validated": row["validated"] or 0}
            for row in trend_rows
        ],
        "hotspots": [
            {"roi_id": row["roi_id"], "count": row["count"], "pending": row["pending"] or 0}
            for row in hotspot_rows
        ],
        "operators": [
            {
                "username": row["username"],
                "display_name": row["display_name"],
                "tasks": row["tasks"],
                "completed": row["completed"] or 0,
                "completion_rate": round(((row["completed"] or 0) / row["tasks"]) * 100, 1) if row["tasks"] else 0,
            }
            for row in operator_rows
        ],
        "insight": {
            "title": "System Insights",
            "message": "No abnormal congestion pattern yet." if not hotspot_rows else f"{hotspot_rows[0]['roi_id']} is the current top violation hotspot.",
            "action": "Optimize Patrol Dispatch",
        },
    }
