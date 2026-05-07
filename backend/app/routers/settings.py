from fastapi import APIRouter, Depends

from app.auth import require_permission
from app.models.settings import RuntimeSettings, RuntimeSettingsUpdate
from app.services import settings_service

router = APIRouter(prefix="/api/settings", tags=["settings"])


@router.get("", response_model=RuntimeSettings)
def get_runtime_settings(user: dict = Depends(require_permission("settings:read"))):
    return settings_service.get_settings()


@router.put("", response_model=RuntimeSettings)
def update_runtime_settings(body: RuntimeSettingsUpdate, user: dict = Depends(require_permission("settings:write"))):
    return settings_service.update_settings(body)
