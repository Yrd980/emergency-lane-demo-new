import os
import hashlib
import shutil
from datetime import datetime, timezone, timedelta
from app.database import get_db
from app.config import settings

def _now():
    tz = timezone(timedelta(hours=8))
    return datetime.now(tz).isoformat()

def save_evidence(event_id: str, evidence_type: str, file_content: bytes, filename: str, mime_type: str):
    conn = get_db()
    event = conn.execute("SELECT event_id FROM events WHERE event_id=?", (event_id,)).fetchone()
    if not event:
        return None

    event_dir = os.path.join(settings.evidence_dir, event_id)
    os.makedirs(event_dir, exist_ok=True)
    filename = os.path.basename(filename) or "unknown"
    dest = os.path.join(event_dir, filename)
    with open(dest, "wb") as f:
        f.write(file_content)
    size = os.path.getsize(dest)
    sha256 = hashlib.sha256(file_content).hexdigest()

    conn.execute(
        """INSERT INTO evidence_files (event_id, evidence_type, file_path, mime_type, size_bytes, sha256, uploaded_at)
           VALUES (?, ?, ?, ?, ?, ?, ?)""",
        (event_id, evidence_type, dest, mime_type, size, sha256, _now()),
    )
    conn.commit()
    return {
        "event_id": event_id,
        "evidence_type": evidence_type,
        "stored": True,
        "url": f"/evidence/{event_id}/{filename}",
        "sha256": sha256,
    }


def cleanup_expired_evidence():
    """Delete evidence for events older than retention_days from runtime_settings."""
    try:
        conn = get_db()
        row = conn.execute(
            "SELECT evidence_retention_days FROM runtime_settings WHERE id=1"
        ).fetchone()
        retention_days = row["evidence_retention_days"] if row else 30

        cutoff = datetime.now(timezone(timedelta(hours=8))) - timedelta(days=retention_days)
        old_events = conn.execute(
            "SELECT event_id FROM events WHERE created_at < ?", (cutoff.isoformat(),)
        ).fetchall()
        for event in old_events:
            event_dir = os.path.join(settings.evidence_dir, event["event_id"])
            if os.path.isdir(event_dir):
                shutil.rmtree(event_dir)
            conn.execute("DELETE FROM evidence_files WHERE event_id=?", (event["event_id"],))
        conn.commit()
    except Exception:
        pass
