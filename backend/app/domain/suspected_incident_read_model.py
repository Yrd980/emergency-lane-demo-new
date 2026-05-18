import json

from app.domain import evidence_set, incident_review, review_priority


def thumbnail_select_sql(alias: str = "e") -> str:
    return f"""(SELECT file_path FROM evidence_files ef
                WHERE ef.suspected_incident_id = {alias}.suspected_incident_id AND ef.evidence_type = 'frame_peak'
                LIMIT 1) AS thumbnail_file_path"""


def list_item(row) -> dict:
    priority = review_priority.calculate(row)
    return {
        "suspected_incident_id": row["suspected_incident_id"],
        "device_id": row["device_id"],
        "start_time": row["start_time"],
        "duration_seconds": row["duration_seconds"],
        "vehicle_class": row["vehicle_class"],
        "confidence": row["confidence"],
        "review_status": row["review_status"],
        "thumbnail_url": evidence_set.thumbnail_url(row["suspected_incident_id"], row["thumbnail_file_path"]),
        "review_priority": priority,
        "review_priority_reason": review_priority.reason(priority),
    }


def recent_item(row) -> dict:
    return {
        "suspected_incident_id": row["suspected_incident_id"],
        "device_id": row["device_id"],
        "start_time": row["start_time"],
        "duration_seconds": row["duration_seconds"],
        "vehicle_class": row["vehicle_class"],
        "confidence": row["confidence"],
        "review_status": row["review_status"],
        "thumbnail_url": evidence_set.thumbnail_url(row["suspected_incident_id"], row["thumbnail_file_path"]),
    }


def device_recent_item(row) -> dict:
    return {
        "suspected_incident_id": row["suspected_incident_id"],
        "start_time": row["start_time"],
        "duration_seconds": row["duration_seconds"],
        "vehicle_class": row["vehicle_class"],
        "confidence": row["confidence"],
        "review_status": row["review_status"],
    }


def task_context(row) -> dict:
    # Response Tasks belong to Validated Incidents, but patrol users still need
    # the original urgency signal from confidence and occupation duration.
    priority = review_priority.calculate({
        "review_status": "pending",
        "confidence": row["confidence"],
        "duration_seconds": row["duration_seconds"],
    })
    return {
        "vehicle_class": row["vehicle_class"],
        "confidence": row["confidence"],
        "start_time": row["start_time"],
        "device_id": row["device_id"],
        "review_priority": priority,
        "thumbnail_url": evidence_set.thumbnail_url(row["suspected_incident_id"], row["thumbnail_file_path"]),
    }


def detail(row, evidence_rows: list, review_history_rows: list, previous_suspected_incident_id: str | None, next_suspected_incident_id: str | None) -> dict:
    priority = review_priority.calculate(row)
    evidence = [
        evidence_set.file_item(evidence_row)
        for evidence_row in sorted(evidence_rows, key=lambda item: evidence_set.sort_key(item["evidence_type"]))
    ]
    return {
        "suspected_incident_id": row["suspected_incident_id"],
        "device_id": row["device_id"],
        "start_time": row["start_time"],
        "end_time": row["end_time"],
        "duration_seconds": row["duration_seconds"],
        "roi_id": row["roi_id"],
        "track_id": row["track_id"],
        "vehicle_class": row["vehicle_class"],
        "vehicle_box": json.loads(row["vehicle_box_json"]),
        "confidence": row["confidence"],
        "gps_location": json.loads(row["gps_json"]),
        "review_status": row["review_status"],
        "operator_note": row["operator_note"],
        "created_at": row["created_at"],
        "reviewed_at": row["reviewed_at"],
        "evidence_files": evidence,
        "evidence_summary": evidence_set.summarize(evidence),
        "review_history": [incident_review.history_item(history_row) for history_row in review_history_rows],
        "review_priority": priority,
        "review_priority_reason": review_priority.reason(priority),
        "previous_suspected_incident_id": previous_suspected_incident_id,
        "next_suspected_incident_id": next_suspected_incident_id,
    }
