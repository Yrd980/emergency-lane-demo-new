import sqlite3


def test_init_db_migrates_legacy_task_review_statuses_to_validated(tmp_path, monkeypatch):
    db_path = tmp_path / "legacy.db"
    monkeypatch.setenv("DB_PATH", str(db_path))
    monkeypatch.setenv("EVIDENCE_DIR", str(tmp_path / "evidence"))

    from app.config import settings
    from app.database import init_db

    settings.db_path = str(db_path)
    settings.evidence_dir = str(tmp_path / "evidence")

    conn = sqlite3.connect(db_path)
    conn.executescript(
        """
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
            gps_json TEXT NOT NULL DEFAULT '{}',
            review_status TEXT NOT NULL DEFAULT 'pending',
            operator_note TEXT NOT NULL DEFAULT '',
            created_at TEXT NOT NULL,
            reviewed_at TEXT,
            CHECK (review_status IN ('pending', 'confirmed', 'rejected', 'assigned', 'accepted', 'completed', 'closed'))
        );
        CREATE TABLE review_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            event_id TEXT NOT NULL,
            operator_id TEXT NOT NULL,
            from_status TEXT NOT NULL,
            to_status TEXT NOT NULL,
            operator_note TEXT NOT NULL DEFAULT '',
            reviewed_at TEXT NOT NULL,
            FOREIGN KEY(event_id) REFERENCES events(event_id),
            CHECK (from_status IN ('pending', 'confirmed', 'rejected', 'assigned', 'accepted', 'completed', 'closed')),
            CHECK (to_status IN ('confirmed', 'rejected', 'assigned', 'accepted', 'completed', 'closed'))
        );
        INSERT INTO events (
            event_id, device_id, start_time, end_time, duration_seconds,
            roi_id, track_id, vehicle_class, vehicle_box_json, confidence,
            gps_json, review_status, operator_note, created_at, reviewed_at
        ) VALUES (
            'evt_legacy', 'dev_1', '2026-05-18T08:00:00+08:00', '2026-05-18T08:00:12+08:00', 12,
            'roi_1', 'track_1', 'car', '{"x":1,"y":1,"width":2,"height":2}', 0.92,
            '{}', 'completed', 'legacy dispatch state', '2026-05-18T08:00:15+08:00', '2026-05-18T08:01:00+08:00'
        );
        INSERT INTO review_history (
            event_id, operator_id, from_status, to_status, operator_note, reviewed_at
        ) VALUES (
            'evt_legacy', 'legacy operator', 'assigned', 'completed', 'legacy transition', '2026-05-18T08:02:00+08:00'
        );
        """
    )
    conn.commit()
    conn.close()

    init_db()

    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    event = conn.execute("SELECT review_status FROM events WHERE event_id='evt_legacy'").fetchone()
    history = conn.execute(
        "SELECT from_status, to_status FROM review_history WHERE event_id='evt_legacy'"
    ).fetchone()
    events_sql = conn.execute("SELECT sql FROM sqlite_master WHERE type='table' AND name='events'").fetchone()["sql"]
    history_sql = conn.execute("SELECT sql FROM sqlite_master WHERE type='table' AND name='review_history'").fetchone()["sql"]
    conn.close()

    assert event["review_status"] == "validated"
    assert history["from_status"] == "validated"
    assert history["to_status"] == "validated"
    assert "assigned" not in events_sql
    assert "completed" not in history_sql
