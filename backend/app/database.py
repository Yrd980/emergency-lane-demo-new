import sqlite3
import os
from app.config import settings

def get_db() -> sqlite3.Connection:
    os.makedirs(os.path.dirname(settings.db_path), exist_ok=True)
    conn = sqlite3.connect(settings.db_path)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute("PRAGMA foreign_keys=ON")
    return conn

def init_db():
    conn = get_db()
    conn.executescript("""
        CREATE TABLE IF NOT EXISTS devices (
            device_id TEXT PRIMARY KEY,
            device_name TEXT NOT NULL,
            app_version TEXT NOT NULL,
            model_version TEXT NOT NULL,
            registered_at TEXT NOT NULL,
            last_seen_at TEXT NOT NULL,
            battery_level REAL DEFAULT 0,
            thermal_state TEXT DEFAULT 'normal',
            fps REAL DEFAULT 0,
            pending_upload_count INTEGER DEFAULT 0
        );

        CREATE TABLE IF NOT EXISTS events (
            event_id TEXT PRIMARY KEY,
            device_id TEXT NOT NULL,
            start_time TEXT NOT NULL,
            end_time TEXT NOT NULL,
            duration_seconds REAL NOT NULL,
            roi_id TEXT NOT NULL,
            track_id TEXT NOT NULL,
            vehicle_class TEXT NOT NULL,
            vehicle_box_json TEXT NOT NULL,
            confidence REAL NOT NULL,
            gps_json TEXT NOT NULL DEFAULT '{}',
            review_status TEXT NOT NULL DEFAULT 'pending',
            operator_note TEXT NOT NULL DEFAULT '',
            created_at TEXT NOT NULL,
            reviewed_at TEXT,
            CHECK (review_status IN ('pending', 'confirmed', 'rejected'))
        );

        CREATE TABLE IF NOT EXISTS evidence_files (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            event_id TEXT NOT NULL,
            evidence_type TEXT NOT NULL,
            file_path TEXT NOT NULL,
            mime_type TEXT NOT NULL,
            size_bytes INTEGER NOT NULL,
            sha256 TEXT NOT NULL DEFAULT '',
            uploaded_at TEXT NOT NULL,
            FOREIGN KEY(event_id) REFERENCES events(event_id)
        );

        CREATE INDEX IF NOT EXISTS idx_events_device ON events(device_id);
        CREATE INDEX IF NOT EXISTS idx_events_status ON events(review_status);
        CREATE INDEX IF NOT EXISTS idx_events_created ON events(created_at);
        CREATE INDEX IF NOT EXISTS idx_evidence_event ON evidence_files(event_id);
    """)
    conn.commit()
    conn.close()
