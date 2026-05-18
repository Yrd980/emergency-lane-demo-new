import sqlite3


def test_init_db_uses_suspected_incident_schema(tmp_path, monkeypatch):
    db_path = tmp_path / "aegis.db"
    monkeypatch.setenv("DB_PATH", str(db_path))
    monkeypatch.setenv("EVIDENCE_DIR", str(tmp_path / "evidence"))

    from app.config import settings
    from app.database import init_db

    settings.db_path = str(db_path)
    settings.evidence_dir = str(tmp_path / "evidence")

    init_db()

    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    table_names = {
        row["name"]
        for row in conn.execute("SELECT name FROM sqlite_master WHERE type='table'")
    }
    suspected_incidents_sql = conn.execute(
        "SELECT sql FROM sqlite_master WHERE type='table' AND name='suspected_incidents'"
    ).fetchone()["sql"]
    review_history_sql = conn.execute(
        "SELECT sql FROM sqlite_master WHERE type='table' AND name='review_history'"
    ).fetchone()["sql"]
    conn.close()

    assert "suspected_incidents" in table_names
    assert "events" not in table_names
    assert "suspected_incident_id" in suspected_incidents_sql
    assert "assigned" not in review_history_sql
    assert "accepted" not in review_history_sql
    assert "completed" not in review_history_sql
