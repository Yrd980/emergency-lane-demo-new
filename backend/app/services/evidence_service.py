import os
import hashlib
import shutil
from datetime import datetime, timezone, timedelta
from app.database import get_db
from app.config import settings
from app.domain import evidence_set

def _now():
    tz = timezone(timedelta(hours=8))
    return datetime.now(tz).isoformat()

def save_evidence(suspected_incident_id: str, evidence_type: str, file_content: bytes, filename: str, mime_type: str):
    if evidence_type not in evidence_set.VALID_EVIDENCE_TYPES:
        return {"suspected_incident_id": suspected_incident_id, "evidence_type": evidence_type, "error": "Unsupported evidence type"}
    conn = get_db()
    try:
        suspected_incident = conn.execute("SELECT suspected_incident_id FROM suspected_incidents WHERE suspected_incident_id=?", (suspected_incident_id,)).fetchone()
        if not suspected_incident:
            return None

        suspected_incident_dir = os.path.join(settings.evidence_dir, suspected_incident_id)
        os.makedirs(suspected_incident_dir, exist_ok=True)
        filename = os.path.basename(filename) or "unknown"
        dest = os.path.join(suspected_incident_dir, filename)
        with open(dest, "wb") as f:
            f.write(file_content)
        size = os.path.getsize(dest)
        sha256 = hashlib.sha256(file_content).hexdigest()

        conn.execute(
            """INSERT INTO evidence_files (suspected_incident_id, evidence_type, file_path, mime_type, size_bytes, sha256, uploaded_at)
               VALUES (?, ?, ?, ?, ?, ?, ?)""",
            (suspected_incident_id, evidence_type, dest, mime_type, size, sha256, _now()),
        )
        conn.commit()
        return {
            "suspected_incident_id": suspected_incident_id,
            "evidence_type": evidence_type,
            "stored": True,
            "url": f"/evidence/{suspected_incident_id}/{filename}",
            "sha256": sha256,
        }
    finally:
        conn.close()


def cleanup_expired_evidence():
    """Delete evidence for suspected_incidents older than retention_days from runtime_settings."""
    conn = None
    try:
        conn = get_db()
        row = conn.execute(
            "SELECT evidence_retention_days FROM runtime_settings WHERE id=1"
        ).fetchone()
        retention_days = row["evidence_retention_days"] if row else 30

        cutoff = datetime.now(timezone(timedelta(hours=8))) - timedelta(days=retention_days)
        old_suspected_incidents = conn.execute(
            "SELECT suspected_incident_id FROM suspected_incidents WHERE created_at < ?", (cutoff.isoformat(),)
        ).fetchall()
        for suspected_incident in old_suspected_incidents:
            suspected_incident_dir = os.path.join(settings.evidence_dir, suspected_incident["suspected_incident_id"])
            if os.path.isdir(suspected_incident_dir):
                shutil.rmtree(suspected_incident_dir)
            conn.execute("DELETE FROM evidence_files WHERE suspected_incident_id=?", (suspected_incident["suspected_incident_id"],))
        conn.commit()
    except Exception:
        pass
    finally:
        if conn:
            conn.close()
