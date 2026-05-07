import sqlite3
import os
from app.config import settings

EVENT_REVIEW_STATUSES = (
    "'pending', 'validated', 'false_alarm', 'assigned', 'accepted', 'completed', 'closed'"
)

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
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT NOT NULL UNIQUE,
            password_hash TEXT NOT NULL,
            display_name TEXT NOT NULL,
            role TEXT NOT NULL,
            created_at TEXT NOT NULL,
            CHECK (role IN ('admin', 'reviewer', 'dispatcher', 'patrol'))
        );

        CREATE TABLE IF NOT EXISTS auth_sessions (
            token TEXT PRIMARY KEY,
            user_id INTEGER NOT NULL,
            created_at TEXT NOT NULL,
            expires_at TEXT NOT NULL,
            FOREIGN KEY(user_id) REFERENCES users(id)
        );

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

        CREATE TABLE IF NOT EXISTS device_metric_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            device_id TEXT NOT NULL,
            recorded_at TEXT NOT NULL,
            battery_level REAL NOT NULL DEFAULT 0,
            thermal_state TEXT NOT NULL DEFAULT 'normal',
            fps REAL NOT NULL DEFAULT 0,
            pending_upload_count INTEGER NOT NULL DEFAULT 0,
            FOREIGN KEY(device_id) REFERENCES devices(device_id)
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
            CHECK (review_status IN ('pending', 'validated', 'false_alarm', 'assigned', 'accepted', 'completed', 'closed'))
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

        CREATE TABLE IF NOT EXISTS review_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            event_id TEXT NOT NULL,
            operator_id TEXT NOT NULL,
            from_status TEXT NOT NULL,
            to_status TEXT NOT NULL,
            operator_note TEXT NOT NULL DEFAULT '',
            reviewed_at TEXT NOT NULL,
            FOREIGN KEY(event_id) REFERENCES events(event_id),
            CHECK (from_status IN ('pending', 'validated', 'false_alarm', 'assigned', 'accepted', 'completed', 'closed')),
            CHECK (to_status IN ('validated', 'false_alarm', 'assigned', 'accepted', 'completed', 'closed'))
        );

        CREATE TABLE IF NOT EXISTS dispatch_tasks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            task_id TEXT NOT NULL UNIQUE,
            event_id TEXT NOT NULL,
            assigned_to_user_id INTEGER,
            assigned_to_device_id TEXT,
            assigned_by_user_id INTEGER NOT NULL,
            status TEXT NOT NULL DEFAULT 'assigned',
            note TEXT NOT NULL DEFAULT '',
            created_at TEXT NOT NULL,
            accepted_at TEXT,
            completed_at TEXT,
            completed_note TEXT NOT NULL DEFAULT '',
            FOREIGN KEY(event_id) REFERENCES events(event_id),
            FOREIGN KEY(assigned_to_user_id) REFERENCES users(id),
            FOREIGN KEY(assigned_by_user_id) REFERENCES users(id),
            CHECK (status IN ('assigned', 'accepted', 'completed', 'cancelled'))
        );

        CREATE TABLE IF NOT EXISTS runtime_settings (
            id INTEGER PRIMARY KEY CHECK (id = 1),
            review_mode TEXT NOT NULL DEFAULT 'manual',
            online_window_seconds INTEGER NOT NULL DEFAULT 60,
            evidence_retention_days INTEGER NOT NULL DEFAULT 30,
            require_complete_evidence INTEGER NOT NULL DEFAULT 0,
            device_access_mode TEXT NOT NULL DEFAULT 'open',
            updated_at TEXT NOT NULL,
            CHECK (review_mode IN ('manual', 'strict')),
            CHECK (device_access_mode IN ('open', 'token')),
            CHECK (online_window_seconds BETWEEN 10 AND 3600),
            CHECK (evidence_retention_days BETWEEN 1 AND 3650),
            CHECK (require_complete_evidence IN (0, 1))
        );

        CREATE INDEX IF NOT EXISTS idx_events_device ON events(device_id);
        CREATE INDEX IF NOT EXISTS idx_events_status ON events(review_status);
        CREATE INDEX IF NOT EXISTS idx_events_created ON events(created_at);
        CREATE INDEX IF NOT EXISTS idx_events_start_time ON events(start_time);
        CREATE INDEX IF NOT EXISTS idx_auth_sessions_user ON auth_sessions(user_id);
        CREATE INDEX IF NOT EXISTS idx_dispatch_tasks_event ON dispatch_tasks(event_id);
        CREATE INDEX IF NOT EXISTS idx_dispatch_tasks_user ON dispatch_tasks(assigned_to_user_id, status);
        CREATE INDEX IF NOT EXISTS idx_dispatch_tasks_device ON dispatch_tasks(assigned_to_device_id, status);
        CREATE INDEX IF NOT EXISTS idx_device_metric_history_device ON device_metric_history(device_id, recorded_at DESC);
        CREATE INDEX IF NOT EXISTS idx_evidence_event ON evidence_files(event_id);
        CREATE INDEX IF NOT EXISTS idx_review_history_event ON review_history(event_id);
    """)
    _migrate_events_status_check(conn)
    _migrate_review_history_status_check(conn)
    _migrate_dispatch_tasks_event_fk(conn)
    _seed_builtin_users(conn)
    conn.commit()
    conn.close()


def _migrate_events_status_check(conn: sqlite3.Connection):
    row = conn.execute("SELECT sql FROM sqlite_master WHERE type='table' AND name='events'").fetchone()
    if not row or "validated" in (row["sql"] or ""):
        return
    conn.executescript(f"""
        ALTER TABLE events RENAME TO events_old;
        CREATE TABLE events (
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
            gps_json TEXT NOT NULL DEFAULT '{{}}',
            review_status TEXT NOT NULL DEFAULT 'pending',
            operator_note TEXT NOT NULL DEFAULT '',
            created_at TEXT NOT NULL,
            reviewed_at TEXT,
            CHECK (review_status IN ({EVENT_REVIEW_STATUSES}))
        );
        INSERT INTO events SELECT * FROM events_old;
        DROP TABLE events_old;
    """)


def _migrate_review_history_status_check(conn: sqlite3.Connection):
    row = conn.execute("SELECT sql FROM sqlite_master WHERE type='table' AND name='review_history'").fetchone()
    if not row or "validated" in (row["sql"] or ""):
        return
    conn.executescript(f"""
        ALTER TABLE review_history RENAME TO review_history_old;
        CREATE TABLE review_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            event_id TEXT NOT NULL,
            operator_id TEXT NOT NULL,
            from_status TEXT NOT NULL,
            to_status TEXT NOT NULL,
            operator_note TEXT NOT NULL DEFAULT '',
            reviewed_at TEXT NOT NULL,
            FOREIGN KEY(event_id) REFERENCES events(event_id),
            CHECK (from_status IN ({EVENT_REVIEW_STATUSES})),
            CHECK (to_status IN ('validated', 'false_alarm', 'assigned', 'accepted', 'completed', 'closed'))
        );
        INSERT INTO review_history SELECT * FROM review_history_old;
        DROP TABLE review_history_old;
    """)


def _migrate_dispatch_tasks_event_fk(conn: sqlite3.Connection):
    rows = conn.execute("PRAGMA foreign_key_list(dispatch_tasks)").fetchall()
    if not any(row["table"] == "events_old" for row in rows):
        return
    conn.executescript("""
        ALTER TABLE dispatch_tasks RENAME TO dispatch_tasks_old;
        CREATE TABLE dispatch_tasks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            task_id TEXT NOT NULL UNIQUE,
            event_id TEXT NOT NULL,
            assigned_to_user_id INTEGER,
            assigned_to_device_id TEXT,
            assigned_by_user_id INTEGER NOT NULL,
            status TEXT NOT NULL DEFAULT 'assigned',
            note TEXT NOT NULL DEFAULT '',
            created_at TEXT NOT NULL,
            accepted_at TEXT,
            completed_at TEXT,
            completed_note TEXT NOT NULL DEFAULT '',
            FOREIGN KEY(event_id) REFERENCES events(event_id),
            FOREIGN KEY(assigned_to_user_id) REFERENCES users(id),
            FOREIGN KEY(assigned_by_user_id) REFERENCES users(id),
            CHECK (status IN ('assigned', 'accepted', 'completed', 'cancelled'))
        );
        INSERT INTO dispatch_tasks
        SELECT * FROM dispatch_tasks_old
        WHERE event_id IN (SELECT event_id FROM events);
        DROP TABLE dispatch_tasks_old;
        CREATE INDEX IF NOT EXISTS idx_dispatch_tasks_event ON dispatch_tasks(event_id);
        CREATE INDEX IF NOT EXISTS idx_dispatch_tasks_user ON dispatch_tasks(assigned_to_user_id, status);
        CREATE INDEX IF NOT EXISTS idx_dispatch_tasks_device ON dispatch_tasks(assigned_to_device_id, status);
    """)


def _seed_builtin_users(conn: sqlite3.Connection):
    from app.services.auth_service import hash_password, now_iso

    users = [
        ("admin", "admin123", "Aegis Admin", "admin"),
        ("reviewer", "review123", "Local Reviewer", "reviewer"),
        ("dispatcher", "dispatch123", "Dispatch Lead", "dispatcher"),
        ("patrol", "patrol123", "Patrol Unit", "patrol"),
    ]
    created_at = now_iso()
    for username, password, display_name, role in users:
        conn.execute(
            """INSERT OR IGNORE INTO users (username, password_hash, display_name, role, created_at)
               VALUES (?, ?, ?, ?, ?)""",
            (username, hash_password(password), display_name, role, created_at),
        )
