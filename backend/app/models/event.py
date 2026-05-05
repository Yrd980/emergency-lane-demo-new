from pydantic import BaseModel
from typing import Optional

class VehicleBox(BaseModel):
    x: int
    y: int
    width: int
    height: int

class GpsLocation(BaseModel):
    lat: float = 0.0
    lng: float = 0.0
    accuracy_meters: float = 0.0

class EventCreate(BaseModel):
    event_id: str
    device_id: str
    start_time: str
    end_time: str
    duration_seconds: float
    roi_id: str
    track_id: str
    vehicle_class: str
    vehicle_box: VehicleBox
    confidence: float
    gps_location: Optional[GpsLocation] = None

class ReviewUpdate(BaseModel):
    review_status: str
    operator_note: str = ""
