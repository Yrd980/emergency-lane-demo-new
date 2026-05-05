from fastapi import APIRouter

from app.models.device import DeviceRegister, DeviceHeartbeat
from app.services import device_service

router = APIRouter(prefix="/api/devices", tags=["devices"])


@router.get("")
def list_devices():
    return device_service.list_devices()


@router.post("/register")
def register_device(body: DeviceRegister):
    return device_service.register(
        device_id=body.device_id,
        device_name=body.device_name,
        app_version=body.app_version,
        model_version=body.model_version,
    )


@router.post("/heartbeat")
def device_heartbeat(body: DeviceHeartbeat):
    return device_service.heartbeat(
        device_id=body.device_id,
        battery_level=body.battery_level,
        thermal_state=body.thermal_state,
        fps=body.fps,
        pending_upload_count=body.pending_upload_count,
    )
