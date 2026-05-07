import os
import shutil
from datetime import datetime, timezone, timedelta

from app.config import settings
from app.database import get_db


def _now():
    return datetime.now(timezone(timedelta(hours=8)))


def get_status():
    conn = get_db()
    now = _now()
    threshold = (now - timedelta(seconds=settings.online_threshold_seconds)).isoformat()

    devices_total = conn.execute("SELECT COUNT(*) FROM devices").fetchone()[0]
    devices_online = conn.execute(
        "SELECT COUNT(*) FROM devices WHERE last_seen_at >= ?",
        (threshold,),
    ).fetchone()[0]
    pending_review = conn.execute(
        "SELECT COUNT(*) FROM events WHERE review_status='pending'",
    ).fetchone()[0]
    evidence_count = conn.execute("SELECT COUNT(*) FROM evidence_files").fetchone()[0]
    latest_event = conn.execute(
        "SELECT created_at FROM events ORDER BY created_at DESC LIMIT 1",
    ).fetchone()
    pending_upload_total = conn.execute(
        "SELECT COALESCE(SUM(pending_upload_count), 0) FROM devices",
    ).fetchone()[0]

    db_exists = os.path.exists(settings.db_path)
    evidence_dir_exists = os.path.isdir(settings.evidence_dir)
    evidence_usage_bytes = 0
    if evidence_dir_exists:
        for root, _, files in os.walk(settings.evidence_dir):
            for filename in files:
                path = os.path.join(root, filename)
                try:
                    evidence_usage_bytes += os.path.getsize(path)
                except OSError:
                    pass

    disk = shutil.disk_usage(settings.evidence_dir if evidence_dir_exists else ".")
    issues = []
    if devices_total == 0:
        issues.append({
            "severity": "warning",
            "code": "no_devices",
            "message": "还没有设备接入",
            "next_action": "打开接入向导，按局域网地址配置 Android 端",
        })
    elif devices_online == 0:
        issues.append({
            "severity": "critical",
            "code": "all_devices_offline",
            "message": "所有设备离线",
            "next_action": "检查手机和 HP 是否在同一局域网，并确认后端地址",
        })
    if pending_upload_total > 0:
        issues.append({
            "severity": "warning",
            "code": "pending_uploads",
            "message": f"还有 {pending_upload_total} 条设备侧上传积压",
            "next_action": "进入设备页查看积压来源",
        })
    if pending_review > 0:
        issues.append({
            "severity": "info",
            "code": "pending_reviews",
            "message": f"还有 {pending_review} 条事件待复核",
            "next_action": "进入复核工作台处理下一条事件",
        })

    return {
        "status": "critical" if any(i["severity"] == "critical" for i in issues) else "ready",
        "server_time": now.isoformat(),
        "backend": {"status": "ok"},
        "database": {"status": "ok" if db_exists else "missing", "path": settings.db_path},
        "evidence": {
            "status": "ok" if evidence_dir_exists else "missing",
            "dir": settings.evidence_dir,
            "file_count": evidence_count,
            "usage_bytes": evidence_usage_bytes,
            "free_bytes": disk.free,
        },
        "devices": {
            "total": devices_total,
            "online": devices_online,
            "pending_upload_count": pending_upload_total,
        },
        "events": {
            "pending_review_count": pending_review,
            "latest_event_at": latest_event["created_at"] if latest_event else None,
        },
        "issues": issues,
    }
