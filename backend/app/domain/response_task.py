ACTIVE_STATUSES = frozenset({"assigned", "accepted"})
TERMINAL_STATUSES = frozenset({"completed", "cancelled"})


def is_active(status: str) -> bool:
    return status in ACTIVE_STATUSES


def can_accept(status: str) -> bool:
    return status in ACTIVE_STATUSES


def can_complete(status: str) -> bool:
    return status in ACTIVE_STATUSES


def assignment_guard(review_status: str) -> str | None:
    if review_status != "validated":
        return "Response tasks can only be assigned after the suspected incident is validated"
    return None


def actor_guard(row, user: dict) -> str | None:
    if row["assigned_to_user_id"] and row["assigned_to_user_id"] != user["id"] and user["role"] != "admin":
        return "任务已派发给其他巡查员"
    return None
