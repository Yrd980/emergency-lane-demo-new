from fastapi import APIRouter
from app.services import stats_service

router = APIRouter(prefix="/api/stats", tags=["stats"])

@router.get("/overview")
def get_overview():
    return stats_service.get_overview()
