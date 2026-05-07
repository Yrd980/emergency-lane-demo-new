from fastapi import APIRouter

from app.services import system_service

router = APIRouter(prefix="/api/system", tags=["system"])


@router.get("/status")
def get_system_status():
    return system_service.get_status()
