from fastapi import APIRouter, Depends, Query
from app.auth import require_permission
from app.services import stats_service

router = APIRouter(prefix="/api/stats", tags=["stats"])

@router.get("/overview")
def get_overview(user: dict = Depends(require_permission("stats:read"))):
    return stats_service.get_overview()


@router.get("/operations")
def get_operations(
    period: str = Query("30d"),
    roi_id: str | None = Query(None),
    start_date: str | None = Query(None),
    end_date: str | None = Query(None),
    user: dict = Depends(require_permission("stats:read")),
):
    return stats_service.get_operations(
        period=period,
        roi_id=roi_id,
        start_date=start_date,
        end_date=end_date,
    )
