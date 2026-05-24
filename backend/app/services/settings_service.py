from datetime import datetime, timedelta, timezone

from app.config import settings as config_settings
from app.database import get_db


DEFAULT_SETTINGS = {
    "review_mode": "manual",
    "online_window_seconds": 60,
    "evidence_retention_days": 30,
    "require_complete_evidence": False,
    "device_access_mode": "open",
}


def get_effective_online_threshold() -> int:
    """Read online_window_seconds from runtime_settings, fall back to config."""
    try:
        conn = get_db()
        row = conn.execute(
            "SELECT online_window_seconds FROM runtime_settings WHERE id=1"
        ).fetchone()
        if row:
            return row["online_window_seconds"]
    except Exception:
        pass
    return config_settings.online_threshold_seconds


def get_device_access_mode() -> str:
    conn = None
    try:
        conn = get_db()
        row = conn.execute(
            "SELECT device_access_mode FROM runtime_settings WHERE id=1"
        ).fetchone()
        if row:
            return row["device_access_mode"]
    except Exception:
        pass
    finally:
        if conn:
            conn.close()
    return DEFAULT_SETTINGS["device_access_mode"]


def _now():
    return datetime.now(timezone(timedelta(hours=8))).isoformat()


def _serialize(row):
    return {
        "review_mode": row["review_mode"],
        "online_window_seconds": row["online_window_seconds"],
        "evidence_retention_days": row["evidence_retention_days"],
        "require_complete_evidence": bool(row["require_complete_evidence"]),
        "device_access_mode": row["device_access_mode"],
        "updated_at": row["updated_at"],
    }


def get_settings():
    conn = get_db()
    try:
        row = conn.execute("SELECT * FROM runtime_settings WHERE id=1").fetchone()
        if row:
            return _serialize(row)

        updated_at = _now()
        conn.execute(
            """
            INSERT INTO runtime_settings (
                id, review_mode, online_window_seconds, evidence_retention_days,
                require_complete_evidence, device_access_mode, updated_at
            ) VALUES (1, ?, ?, ?, ?, ?, ?)
            """,
            (
                DEFAULT_SETTINGS["review_mode"],
                DEFAULT_SETTINGS["online_window_seconds"],
                DEFAULT_SETTINGS["evidence_retention_days"],
                int(DEFAULT_SETTINGS["require_complete_evidence"]),
                DEFAULT_SETTINGS["device_access_mode"],
                updated_at,
            ),
        )
        conn.commit()
        return {**DEFAULT_SETTINGS, "updated_at": updated_at}
    finally:
        conn.close()


def update_settings(settings):
    updated_at = _now()
    conn = get_db()
    try:
        conn.execute(
            """
            INSERT INTO runtime_settings (
                id, review_mode, online_window_seconds, evidence_retention_days,
                require_complete_evidence, device_access_mode, updated_at
            ) VALUES (1, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(id) DO UPDATE SET
                review_mode=excluded.review_mode,
                online_window_seconds=excluded.online_window_seconds,
                evidence_retention_days=excluded.evidence_retention_days,
                require_complete_evidence=excluded.require_complete_evidence,
                device_access_mode=excluded.device_access_mode,
                updated_at=excluded.updated_at
            """,
            (
                settings.review_mode,
                settings.online_window_seconds,
                settings.evidence_retention_days,
                int(settings.require_complete_evidence),
                settings.device_access_mode,
                updated_at,
            ),
        )
        conn.commit()
        row = conn.execute("SELECT * FROM runtime_settings WHERE id=1").fetchone()
        return _serialize(row)
    finally:
        conn.close()
