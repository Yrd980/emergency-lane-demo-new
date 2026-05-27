EVIDENCE_ORDER = {"frame_before": 0, "frame_peak": 1, "frame_after": 2, "video_clip": 3}
COMPLETE_EVIDENCE_TYPES = frozenset({"frame_before", "frame_peak", "frame_after"})
VALID_EVIDENCE_TYPES = COMPLETE_EVIDENCE_TYPES | frozenset({"video_clip"})


def sort_key(evidence_type: str) -> int:
    return EVIDENCE_ORDER.get(evidence_type, 99)


def is_complete(evidence_types: set[str]) -> bool:
    return COMPLETE_EVIDENCE_TYPES.issubset(evidence_types)


def summarize(evidence: list[dict]) -> dict:
    evidence_types = {item["evidence_type"] for item in evidence}
    return {
        "has_before": "frame_before" in evidence_types,
        "has_peak": "frame_peak" in evidence_types,
        "has_after": "frame_after" in evidence_types,
        "has_video": any(item["mime_type"].startswith("video/") for item in evidence),
        "image_count": sum(1 for item in evidence if item["mime_type"].startswith("image/")),
        "video_count": sum(1 for item in evidence if item["mime_type"].startswith("video/")),
        "is_complete": is_complete(evidence_types),
    }


def thumbnail_url(suspected_incident_id: str, file_path: str | None) -> str:
    return f"/evidence/{suspected_incident_id}/{file_path.split('/')[-1]}" if file_path else ""


def file_item(row) -> dict:
    return {
        "id": row["id"],
        "suspected_incident_id": row["suspected_incident_id"],
        "evidence_type": row["evidence_type"],
        "mime_type": row["mime_type"],
        "url": thumbnail_url(row["suspected_incident_id"], row["file_path"]),
    }
