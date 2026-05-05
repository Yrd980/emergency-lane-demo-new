from datetime import datetime, timezone, timedelta
from app.database import get_db
from app.config import settings

def _now():
    tz = timezone(timedelta(hours=8))
    return datetime.now(tz)

def get_overview():
    conn = get_db()
    now = _now()
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0).isoformat()

    total_today = conn.execute(
        "SELECT COUNT(*) FROM events WHERE start_time >= ?", (today_start,)
    ).fetchone()[0]

    pending = conn.execute("SELECT COUNT(*) FROM events WHERE review_status='pending'").fetchone()[0]
    confirmed = conn.execute("SELECT COUNT(*) FROM events WHERE review_status='confirmed'").fetchone()[0]
    rejected = conn.execute("SELECT COUNT(*) FROM events WHERE review_status='rejected'").fetchone()[0]

    threshold = (now - timedelta(seconds=settings.online_threshold_seconds)).isoformat()
    online = conn.execute(
        "SELECT COUNT(*) FROM devices WHERE last_seen_at >= ?", (threshold,)
    ).fetchone()[0]

    recent_rows = conn.execute(
        "SELECT e.* FROM events e ORDER BY e.created_at DESC LIMIT 10"
    ).fetchall()

    recent = []
    for r in recent_rows:
        thumb = conn.execute(
            "SELECT file_path FROM evidence_files WHERE event_id=? AND evidence_type='frame_peak' LIMIT 1",
            (r["event_id"],),
        ).fetchone()
        thumbnail_url = (
            f"/evidence/{r['event_id']}/{thumb['file_path'].split('/')[-1]}"
            if thumb else ""
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
