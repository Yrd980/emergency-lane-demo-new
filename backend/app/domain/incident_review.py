from app.domain import evidence_set

VALID_REVIEW_STATUSES = frozenset({"pending", "validated", "false_alarm", "closed"})
REVIEW_OUTCOMES = frozenset({"validated", "false_alarm", "closed"})
ROUTER_REVIEW_OUTCOMES = REVIEW_OUTCOMES


def normalize_operator(operator_id: str | None, default: str = "本地复核员") -> str:
    return (operator_id or default).strip() or default


def validate_review_status(review_status: str) -> str | None:
    if review_status not in VALID_REVIEW_STATUSES:
        return "Unsupported review status"
    return None


def validate_router_outcome(review_status: str) -> str | None:
    if review_status not in ROUTER_REVIEW_OUTCOMES:
        return "review_status must be a review outcome"
    return None


def confirmation_guard(conn, suspected_incident_id: str, require_complete_evidence: bool) -> str | None:
    if not require_complete_evidence:
        return None
    if not has_complete_evidence(conn, suspected_incident_id):
        return "Complete evidence (before/peak/after) required before confirmation"
    return None


def bulk_confirmation_guard(conn, suspected_incident_id: str) -> str | None:
    suspected_incident = conn.execute("SELECT review_status FROM suspected_incidents WHERE suspected_incident_id=?", (suspected_incident_id,)).fetchone()
    if not suspected_incident:
        return None
    if suspected_incident["review_status"] != "pending":
        return "Bulk confirmation only supports pending suspected_incidents"
    if not has_complete_evidence(conn, suspected_incident_id):
        return "Complete evidence (before/peak/after) required for bulk confirmation"
    return None


def has_complete_evidence(conn, suspected_incident_id: str) -> bool:
    evidence_types = {
        row["evidence_type"]
        for row in conn.execute("SELECT evidence_type FROM evidence_files WHERE suspected_incident_id=?", (suspected_incident_id,))
    }
    return evidence_set.is_complete(evidence_types)


def history_item(row) -> dict:
    return {
        "id": row["id"],
        "suspected_incident_id": row["suspected_incident_id"],
        "operator_id": row["operator_id"],
        "from_status": row["from_status"],
        "to_status": row["to_status"],
        "operator_note": row["operator_note"],
        "reviewed_at": row["reviewed_at"],
    }
