from datetime import datetime, timezone, timedelta

from app.database import get_db
from app.config import settings


def _now():
    tz = timezone(timedelta(hours=8))
    return datetime.now(tz).isoformat()


def register(
    device_id: str,
    device_name: str,
    app_version: str,
    model_version: str,
):
    conn = get_db()
    now = _now()
    conn.execute(
        """INSERT INTO devices (device_id, device_name, app_version, model_version, registered_at, last_seen_at)
           VALUES (?, ?, ?, ?, ?, ?)
           ON CONFLICT(device_id) DO UPDATE SET
               device_name=excluded.device_name,
               app_version=excluded.app_version,
               model_version=excluded.model_version,
               last_seen_at=excluded.last_seen_at""",
        (device_id, device_name, app_version, model_version, now, now),
    )
    conn.commit()
    return {"device_id": device_id, "registered": True}


def heartbeat(
    device_id: str,
    battery_level: float,
    thermal_state: str,
    fps: float,
    pending_upload_count: int,
):
    conn = get_db()
    now = _now()
    cur = conn.execute(
        """UPDATE devices SET last_seen_at=?, battery_level=?, thermal_state=?, fps=?, pending_upload_count=?
           WHERE device_id=?""",
        (now, battery_level, thermal_state, fps, pending_upload_count, device_id),
    )
    conn.commit()
    if cur.rowcount == 0:
        return None
    return {"device_id": device_id, "heartbeat_accepted": True}


def list_devices():
    conn = get_db()
    rows = conn.execute(
        "SELECT * FROM devices ORDER BY last_seen_at DESC"
    ).fetchall()
    now_dt = datetime.now(timezone(timedelta(hours=8)))
    result = []
    for r in rows:
        last = datetime.fromisoformat(r["last_seen_at"])
        is_online = (
            now_dt - last
        ).total_seconds() < settings.online_threshold_seconds
        result.append(
            {
                "device_id": r["device_id"],
                "device_name": r["device_name"],
                "app_version": r["app_version"],
                "model_version": r["model_version"],
                "registered_at": r["registered_at"],
                "last_seen_at": r["last_seen_at"],
                "battery_level": r["battery_level"],
                "thermal_state": r["thermal_state"],
                "fps": r["fps"],
                "pending_upload_count": r["pending_upload_count"],
                "is_online": is_online,
            }
        )
    return result
