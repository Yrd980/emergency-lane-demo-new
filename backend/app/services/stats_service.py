from datetime import datetime, timezone, timedelta
from app.database import get_db
from app.services.settings_service import get_effective_online_threshold

def _now():
    tz = timezone(timedelta(hours=8))
    return datetime.now(tz)

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
    confirmed = conn.execute("SELECT COUNT(*) FROM events WHERE review_status='confirmed'").fetchone()[0]
    rejected = conn.execute("SELECT COUNT(*) FROM events WHERE review_status='rejected'").fetchone()[0]

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
