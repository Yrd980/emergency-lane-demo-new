from fastapi import APIRouter
from datetime import datetime, timezone, timedelta

router = APIRouter(tags=["health"])


@router.get("/api/health")
def health_check():
    tz = timezone(timedelta(hours=8))
    return {
        "status": "ok",
        "server_time": datetime.now(tz).isoformat(),
    }
