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


def get_device_detail(device_id: str):
    conn = get_db()
    row = conn.execute("SELECT * FROM devices WHERE device_id=?", (device_id,)).fetchone()
    if not row:
        return None

    now_dt = datetime.now(timezone(timedelta(hours=8)))
    last = datetime.fromisoformat(row["last_seen_at"])
    seconds_since_seen = int((now_dt - last).total_seconds())
    is_online = seconds_since_seen < settings.online_threshold_seconds
    recent_events = conn.execute(
        """SELECT event_id, start_time, duration_seconds, vehicle_class, confidence, review_status
           FROM events WHERE device_id=?
           ORDER BY created_at DESC LIMIT 8""",
        (device_id,),
    ).fetchall()

    issues = []
    if not is_online:
        issues.append({
            "severity": "critical",
            "message": f"设备已离线 {seconds_since_seen} 秒",
            "next_action": "检查手机网络、后端地址和前台检测服务",
        })
    if row["pending_upload_count"] > 0:
        issues.append({
            "severity": "warning",
            "message": f"设备侧还有 {row['pending_upload_count']} 条待上传",
            "next_action": "保持同一局域网连接，等待 WorkManager 自动补传",
        })
    if row["fps"] <= 0:
        issues.append({
            "severity": "info",
            "message": "暂未收到有效 FPS",
            "next_action": "确认 Android 端已启动检测或手动模拟",
        })

    return {
        "device_id": row["device_id"],
        "device_name": row["device_name"],
        "app_version": row["app_version"],
        "model_version": row["model_version"],
        "registered_at": row["registered_at"],
        "last_seen_at": row["last_seen_at"],
        "seconds_since_seen": seconds_since_seen,
        "battery_level": row["battery_level"],
        "thermal_state": row["thermal_state"],
        "fps": row["fps"],
        "pending_upload_count": row["pending_upload_count"],
        "is_online": is_online,
        "issues": issues,
        "recent_events": [
            {
                "event_id": event["event_id"],
                "start_time": event["start_time"],
                "duration_seconds": event["duration_seconds"],
                "vehicle_class": event["vehicle_class"],
                "confidence": event["confidence"],
                "review_status": event["review_status"],
            }
            for event in recent_events
        ],
    }
