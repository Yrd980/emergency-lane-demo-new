from pydantic import BaseModel, Field
from typing import Optional

class VehicleBox(BaseModel):
    x: float
    y: float
    width: float
    height: float

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
    operator_id: str = "本地复核员"

class BulkReviewUpdate(ReviewUpdate):
    event_ids: list[str] = Field(default_factory=list, min_length=1)


class AssignEventRequest(BaseModel):
    assigned_to_username: str | None = None
    assigned_to_device_id: str | None = None
    note: str = ""
