from pydantic import BaseModel


class DeviceRegister(BaseModel):
    device_id: str
    device_name: str
    app_version: str
    model_version: str


class DeviceHeartbeat(BaseModel):
    device_id: str
    battery_level: float = 0
    thermal_state: str = "normal"
    fps: float = 0
    pending_upload_count: int = 0
