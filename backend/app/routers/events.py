from fastapi import APIRouter, Query, HTTPException
from app.models.event import EventCreate, ReviewUpdate
from app.services import event_service

router = APIRouter(prefix="/api/events", tags=["events"])

@router.post("")
def create_event(body: EventCreate):
    gps = body.gps_location.model_dump() if body.gps_location else {}
    return event_service.create_event(
        event_id=body.event_id, device_id=body.device_id,
        start_time=body.start_time, end_time=body.end_time,
        duration_seconds=body.duration_seconds, roi_id=body.roi_id,
        track_id=body.track_id, vehicle_class=body.vehicle_class,
        vehicle_box=body.vehicle_box.model_dump(),
        confidence=body.confidence, gps_location=gps,
    )

@router.get("")
def list_events(
    status: str = Query(None),
    device_id: str = Query(None),
    start_time_from: str = Query(None),
    start_time_to: str = Query(None),
    limit: int = Query(50),
    offset: int = Query(0),
):
    return event_service.list_events(
        status=status, device_id=device_id,
        start_time_from=start_time_from, start_time_to=start_time_to,
        limit=limit, offset=offset,
    )

@router.get("/{event_id}")
def get_event(event_id: str):
    event = event_service.get_event(event_id)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    return event

@router.patch("/{event_id}/review")
def update_review(event_id: str, body: ReviewUpdate):
    if body.review_status not in ("confirmed", "rejected"):
        raise HTTPException(status_code=422, detail="review_status must be 'confirmed' or 'rejected'")
    result = event_service.update_review(event_id, body.review_status, body.operator_note)
    if not result:
        raise HTTPException(status_code=404, detail="Event not found")
    return result
