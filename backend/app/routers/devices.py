from fastapi import APIRouter, Depends, HTTPException

from app.auth import require_device_access, require_permission
from app.models.device import DeviceRegister, DeviceHeartbeat
from app.services import device_service

router = APIRouter(prefix="/api/devices", tags=["devices"])


@router.get("")
def list_devices(user: dict = Depends(require_permission("devices:read"))):
    return device_service.list_devices()


@router.get("/{device_id}")
def get_device(device_id: str, user: dict = Depends(require_permission("devices:read"))):
    result = device_service.get_device_detail(device_id)
    if not result:
        raise HTTPException(status_code=404, detail="Device not found")
    return result


@router.post("/register")
def register_device(body: DeviceRegister, device_access: dict | None = Depends(require_device_access)):
    return device_service.register(
        device_id=body.device_id,
        device_name=body.device_name,
        app_version=body.app_version,
        model_version=body.model_version,
    )


@router.post("/heartbeat")
def device_heartbeat(body: DeviceHeartbeat, device_access: dict | None = Depends(require_device_access)):
    result = device_service.heartbeat(
        device_id=body.device_id,
        battery_level=body.battery_level,
        thermal_state=body.thermal_state,
        fps=body.fps,
        pending_upload_count=body.pending_upload_count,
    )
    if not result:
        raise HTTPException(status_code=404, detail="Device not found")
    return result

@router.delete("/{device_id}")
def delete_device(device_id: str, user: dict = Depends(require_permission("suspected_incidents:delete"))):
    result = device_service.delete_device(device_id)
    if not result:
        raise HTTPException(status_code=404, detail="Device not found")
    return result
