"""Seed richer demo operations data from a JSON scenario into SQLite.

The frontend reads all dashboard numbers from the API. This script keeps demo
data out of React code while making the local dashboard useful for design and QA.
"""
import argparse
import json
import os
from datetime import datetime, timedelta, timezone
from pathlib import Path

from app.config import settings
from app.database import get_db, init_db

ROOT = Path(__file__).resolve().parent
DEFAULT_SCENARIO = ROOT / "demo_scenario.json"
DEMO_PREFIXES = ("demo_", "evt_seed_")
DEMO_DEVICE_IDS = {"vivo_x100_001", "vivo_x100_002"}
TZ = timezone(timedelta(hours=8))


def now():
    return datetime.now(TZ).replace(microsecond=0)


def iso(dt: datetime):
    return dt.isoformat()


def read_scenario(path: Path):
    with path.open("r", encoding="utf-8") as handle:
        return json.load(handle)


def user_ids(conn):
    return {
        row["username"]: row["id"]
        for row in conn.execute("SELECT id, username FROM users").fetchall()
    }


def clear_demo_rows(conn):
    demo_event_ids = [
        row["event_id"]
        for row in conn.execute("SELECT event_id, device_id FROM events").fetchall()
        if row["event_id"].startswith(DEMO_PREFIXES) or row["device_id"] in DEMO_DEVICE_IDS
    ]
    demo_task_ids = [
        row["task_id"]
        for row in conn.execute("SELECT task_id FROM dispatch_tasks").fetchall()
        if row["task_id"].startswith(DEMO_PREFIXES)
    ]
    for task_id in demo_task_ids:
        conn.execute("DELETE FROM dispatch_tasks WHERE task_id=?", (task_id,))
    for event_id in demo_event_ids:
        conn.execute("DELETE FROM evidence_files WHERE event_id=?", (event_id,))
        conn.execute("DELETE FROM review_history WHERE event_id=?", (event_id,))
        conn.execute("DELETE FROM dispatch_tasks WHERE event_id=?", (event_id,))
        conn.execute("DELETE FROM events WHERE event_id=?", (event_id,))
    for device in conn.execute("SELECT device_id FROM devices").fetchall():
        if device["device_id"].startswith("demo_") or device["device_id"] in DEMO_DEVICE_IDS:
            conn.execute("DELETE FROM device_metric_history WHERE device_id=?", (device["device_id"],))
            conn.execute("DELETE FROM devices WHERE device_id=?", (device["device_id"],))


def seed_devices(conn, scenario, base_time):
    for index, device in enumerate(scenario["devices"]):
        last_seen = base_time - timedelta(seconds=device.get("last_seen_seconds_ago", 20))
        conn.execute(
            """INSERT OR REPLACE INTO devices (
                   device_id, device_name, app_version, model_version, registered_at,
                   last_seen_at, battery_level, thermal_state, fps, pending_upload_count
               ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            (
                device["device_id"],
                device["device_name"],
                device.get("app_version", "0.1.0"),
                device.get("model_version", "yolov8n-int8-demo"),
                iso(base_time - timedelta(days=18, hours=index)),
                iso(last_seen),
                device.get("battery_level", 80),
                device.get("thermal_state", "normal"),
                device.get("fps", 15),
                device.get("pending_upload_count", 0),
            ),
        )
        for day in range(7, -1, -1):
            conn.execute(
                """INSERT INTO device_metric_history (
                       device_id, recorded_at, battery_level, thermal_state, fps, pending_upload_count
                   ) VALUES (?, ?, ?, ?, ?, ?)""",
                (
                    device["device_id"],
                    iso(base_time - timedelta(days=day, minutes=index * 7)),
                    max(18, device.get("battery_level", 80) - day * 2),
                    device.get("thermal_state", "normal"),
                    max(8, device.get("fps", 15) - (day % 3)),
                    device.get("pending_upload_count", 0) + (day % 2),
                ),
            )


def event_status(index, statuses):
    weighted = []
    for status, weight in statuses.items():
        weighted.extend([status] * max(1, int(weight)))
    return weighted[index % len(weighted)]


def seed_events(conn, scenario, base_time):
    rois = scenario["rois"]
    devices = scenario["devices"]
    vehicles = scenario.get("vehicle_classes", ["car", "truck", "bus"])
    statuses = scenario.get("review_status_mix", {"pending": 2, "validated": 5, "false_alarm": 1})
    created = []
    total_days = int(scenario.get("days", 30))
    event_limit = int(scenario.get("event_count", 30))

    event_index = 0
    for day_offset in range(total_days - 1, -1, -1):
        day_factor = 1 + ((total_days - day_offset) % 6)
        for roi_index, roi in enumerate(rois):
            count = max(0, int(roi.get("base_daily_events", 1)) + ((day_factor + roi_index) % 3) - 1)
            if day_offset in roi.get("spike_days_ago", []):
                count += int(roi.get("spike_extra", 4))
            for item in range(count):
                if event_index >= event_limit:
                    return created
                hour = roi.get("peak_hours", [8, 17])[(event_index + item) % len(roi.get("peak_hours", [8, 17]))]
                minute = (event_index * 11 + item * 7) % 60
                start = base_time - timedelta(days=day_offset)
                start = start.replace(hour=hour, minute=minute, second=0)
                duration = 6 + ((event_index + roi_index) % 9)
                status = event_status(event_index + roi_index, statuses)
                if day_offset <= 2 and (event_index + roi_index) % 5 == 0:
                    status = "pending"
                if event_index in (3, 9, 17):
                    status = "pending"
                event_id = f"demo_evt_{event_index:04d}"
                device = devices[(event_index + roi_index) % len(devices)]
                vehicle_class = vehicles[(event_index + roi_index) % len(vehicles)]
                high_priority = status == "pending" and event_index in (3, 9, 17)
                confidence = round(0.92 if high_priority else min(0.98, 0.68 + ((event_index + roi_index) % 9) * 0.035), 3)
                duration = 14 if high_priority else duration
                conn.execute(
                    """INSERT INTO events (
                           event_id, device_id, start_time, end_time, duration_seconds,
                           roi_id, track_id, vehicle_class, vehicle_box_json, confidence,
                           gps_json, review_status, operator_note, created_at, reviewed_at
                       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
                    (
                        event_id,
                        device["device_id"],
                        iso(start),
                        iso(start + timedelta(seconds=duration)),
                        duration,
                        roi["roi_id"],
                        f"demo_track_{event_index:04d}",
                        vehicle_class,
                        json.dumps({
                            "x": 90 + (event_index % 7) * 28,
                            "y": 170 + (roi_index % 3) * 18,
                            "width": 145 + (event_index % 4) * 16,
                            "height": 72 + (event_index % 3) * 12,
                        }),
                        confidence,
                        json.dumps({
                            "lat": roi.get("lat", 31.23) + item * 0.0004,
                            "lng": roi.get("lng", 121.47) + item * 0.0005,
                            "accuracy_meters": 4.5 + (event_index % 4),
                        }),
                        status,
                        note_for_status(status, roi["label"]),
                        iso(start + timedelta(seconds=duration + 8)),
                        None if status == "pending" else iso(start + timedelta(minutes=4 + event_index % 9)),
                    ),
                )
                if status != "pending":
                    conn.execute(
                        """INSERT INTO review_history (
                               event_id, operator_id, from_status, to_status, operator_note, reviewed_at
                           ) VALUES (?, ?, 'pending', ?, ?, ?)""",
                        (
                            event_id,
                            "Aegis Admin" if event_index % 2 == 0 else "Local Reviewer",
                            status,
                            note_for_status(status, roi["label"]),
                            iso(start + timedelta(minutes=4 + event_index % 9)),
                        ),
                    )
                created.append((event_id, status, start, roi["roi_id"]))
                event_index += 1
    return created


def note_for_status(status, label):
    if status in ("validated", "confirmed"):
        return f"Confirmed emergency-lane occupation at {label}"
    if status in ("false_alarm", "rejected"):
        return f"Dismissed after context review at {label}"
    return ""


def seed_tasks(conn, scenario, events, users, base_time):
    task_targets = [event for event in events if event[1] in ("validated", "assigned", "accepted", "completed")]
    if not task_targets:
        task_targets = events[:]
    patrol_user = users.get("patrol")
    admin_user = users.get("admin") or patrol_user
    if not patrol_user or not admin_user:
        raise RuntimeError("Built-in admin/patrol users are missing. Run init_db before seeding.")
    task_count = min(int(scenario.get("task_count", 18)), len(task_targets))
    status_cycle = ["completed", "completed", "accepted", "assigned"]
    for index, (event_id, _status, start, roi_id) in enumerate(task_targets[:task_count]):
        if not conn.execute("SELECT 1 FROM events WHERE event_id=?", (event_id,)).fetchone():
            continue
        status = status_cycle[index % len(status_cycle)]
        created_at = start + timedelta(minutes=9)
        accepted_at = created_at + timedelta(minutes=3 + index % 4) if status in ("accepted", "completed") else None
        completed_at = accepted_at + timedelta(minutes=12 + index % 8) if status == "completed" else None
        conn.execute(
            """INSERT INTO dispatch_tasks (
                   task_id, event_id, assigned_to_user_id, assigned_to_device_id,
                   assigned_by_user_id, status, note, created_at, accepted_at,
                   completed_at, completed_note
               ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            (
                f"demo_task_{index:03d}",
                event_id,
                patrol_user,
                None,
                admin_user,
                status,
                f"Patrol sweep for {roi_id}",
                iso(created_at),
                iso(accepted_at) if accepted_at else None,
                iso(completed_at) if completed_at else None,
                "Lane cleared and evidence logged" if completed_at else "",
            ),
        )


def seed_runtime_settings(conn, base_time):
    conn.execute(
        """INSERT INTO runtime_settings (
               id, review_mode, online_window_seconds, evidence_retention_days,
               require_complete_evidence, device_access_mode, updated_at
           ) VALUES (1, 'manual', 3600, 30, 0, 'open', ?)
           ON CONFLICT(id) DO UPDATE SET
               online_window_seconds=excluded.online_window_seconds,
               updated_at=excluded.updated_at""",
        (iso(base_time),),
    )


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--scenario", default=str(DEFAULT_SCENARIO), help="Path to JSON demo scenario")
    parser.add_argument("--keep-existing", action="store_true", help="Do not clear existing demo rows first")
    args = parser.parse_args()

    os.chdir(ROOT)
    init_db()
    scenario = read_scenario(Path(args.scenario))
    conn = get_db()
    try:
        base_time = now()
        if not args.keep_existing:
            clear_demo_rows(conn)
        seed_runtime_settings(conn, base_time)
        seed_devices(conn, scenario, base_time)
        events = seed_events(conn, scenario, base_time)
        seed_tasks(conn, scenario, events, user_ids(conn), base_time)
        conn.commit()
        print(f"Seeded {len(events)} events, {len(scenario['devices'])} devices into {settings.db_path}")
    finally:
        conn.close()


if __name__ == "__main__":
    main()
