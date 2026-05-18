from datetime import datetime, timezone, timedelta
from app.database import get_db
from app.domain import suspected_incident_read_model
from app.queries import suspected_incident_queries
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
        return start.isoformat(), end.isoformat(), "自定义范围"
    else:
        start = now - timedelta(days=30)
    return start.isoformat(), now.isoformat(), {
        "30d": "近 30 天",
        "qtd": "本季度",
        "ytd": "今年以来",
    }.get(period, "近 30 天")

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
        "SELECT COUNT(*) FROM suspected_incidents WHERE start_time >= ? AND start_time <= ?",
        (today_start, now_iso),
    ).fetchone()[0]

    pending = conn.execute("SELECT COUNT(*) FROM suspected_incidents WHERE review_status='pending'").fetchone()[0]
    validated = conn.execute("SELECT COUNT(*) FROM suspected_incidents WHERE review_status='validated'").fetchone()[0]
    false_alarm = conn.execute("SELECT COUNT(*) FROM suspected_incidents WHERE review_status='false_alarm'").fetchone()[0]

    threshold = (now - timedelta(seconds=get_effective_online_threshold())).isoformat()
    online = conn.execute(
        "SELECT COUNT(*) FROM devices WHERE last_seen_at >= ?", (threshold,)
    ).fetchone()[0]

    recent_rows = suspected_incident_queries.recent_suspected_incidents(conn)

    return {
        "total_suspected_incidents_today": total_today,
        "pending_review_count": pending,
        "validated_count": validated,
        "false_alarm_count": false_alarm,
        "online_device_count": online,
        "recent_suspected_incidents": [suspected_incident_read_model.recent_item(row) for row in recent_rows],
    }


def get_operations(period="30d", roi_id=None, start_date=None, end_date=None):
    conn = get_db()
    now = _now()
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0).isoformat()
    window_start, window_end, period_label = _operation_window(period, start_date, end_date)

    total_sql, total_params = _with_roi(
        "SELECT COUNT(*) FROM suspected_incidents WHERE start_time >= ? AND start_time <= ?",
        (window_start, window_end),
        roi_id,
    )
    total_suspected_incidents = conn.execute(total_sql, total_params).fetchone()[0]

    pending_sql, pending_params = _with_roi(
        "SELECT COUNT(*) FROM suspected_incidents WHERE review_status='pending' AND start_time >= ? AND start_time <= ?",
        (window_start, window_end),
        roi_id,
    )
    pending = conn.execute(pending_sql, pending_params).fetchone()[0]

    validated_sql, validated_params = _with_roi(
        "SELECT COUNT(*) FROM suspected_incidents WHERE review_status='validated' AND start_time >= ? AND start_time <= ?",
        (window_start, window_end),
        roi_id,
    )
    validated = conn.execute(validated_sql, validated_params).fetchone()[0]

    false_sql, false_params = _with_roi(
        "SELECT COUNT(*) FROM suspected_incidents WHERE review_status='false_alarm' AND start_time >= ? AND start_time <= ?",
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
                   FROM suspected_incidents
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
                     FROM suspected_incidents
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

    latest_suspected_incident = conn.execute("SELECT MAX(created_at) FROM suspected_incidents").fetchone()[0]
    return {
        "summary": {
            "total_suspected_incidents": total_suspected_incidents,
            "pending_review": pending,
            "validated": validated,
            "false_alarms": false_alarms,
            "assigned_tasks": assigned,
            "completed_tasks": completed,
            "avg_response_minutes": round(avg_response, 1),
            "today_suspected_incidents": conn.execute("SELECT COUNT(*) FROM suspected_incidents WHERE start_time >= ?", (today_start,)).fetchone()[0],
            "latest_suspected_incident_at": latest_suspected_incident,
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
            "title": "系统洞察",
            "message": "暂未发现异常拥堵模式。" if not hotspot_rows else f"{hotspot_rows[0]['roi_id']} 是当前疑似占用高发路段。",
            "action": "优化巡查调度",
        },
    }
