HIGH_CONFIDENCE_THRESHOLD = 0.85
LONG_OCCUPATION_SECONDS = 10


def is_high(review_status: str, confidence: float, duration_seconds: float) -> bool:
    return (
        review_status == "pending"
        and (confidence >= HIGH_CONFIDENCE_THRESHOLD or duration_seconds >= LONG_OCCUPATION_SECONDS)
    )


def calculate(row) -> str:
    return "high" if is_high(row["review_status"], row["confidence"], row["duration_seconds"]) else "normal"


def reason(priority: str) -> str:
    return "高置信度或长时间停留" if priority == "high" else "按时间顺序处理"
