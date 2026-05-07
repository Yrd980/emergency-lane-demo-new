from typing import Literal

from fastapi import APIRouter, Depends, Query, HTTPException
from app.auth import require_permission
from app.models.event import AssignEventRequest, BulkReviewUpdate, EventCreate, ReviewUpdate
from app.services import event_service, task_service

router = APIRouter(prefix="/api/events", tags=["events"])

@router.post("")
def create_event(body: EventCreate):
    gps = body.gps_location.model_dump() if body.gps_location else None
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
    status: Literal["pending", "validated", "false_alarm", "assigned", "accepted", "completed", "closed"] | None = Query(None),
    device_id: str = Query(None),
    roi_id: str = Query(None),
    start_time_from: str = Query(None),
    start_time_to: str = Query(None),
    limit: int = Query(50),
    offset: int = Query(0),
):
    return event_service.list_events(
        status=status, device_id=device_id,
        roi_id=roi_id,
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
def update_review(event_id: str, body: ReviewUpdate, user: dict = Depends(require_permission("events:review"))):
    if body.review_status not in ("validated", "false_alarm"):
        raise HTTPException(status_code=422, detail="review_status must be a review outcome")
    result = event_service.update_review(event_id, body.review_status, body.operator_note, body.operator_id or user["display_name"])
    if not result:
        raise HTTPException(status_code=404, detail="Event not found")
    if "error" in result:
        raise HTTPException(status_code=422, detail=result["error"])
    return result

@router.patch("/review/bulk")
def bulk_update_review(body: BulkReviewUpdate, user: dict = Depends(require_permission("events:review"))):
    if body.review_status not in ("validated", "false_alarm"):
        raise HTTPException(status_code=422, detail="review_status must be a review outcome")
    return event_service.bulk_update_review(body.event_ids, body.review_status, body.operator_note, body.operator_id or user["display_name"])


@router.post("/{event_id}/validate")
def validate_event(event_id: str, body: ReviewUpdate, user: dict = Depends(require_permission("events:review"))):
    result = event_service.validate_event(event_id, body.operator_note, user)
    if not result:
        raise HTTPException(status_code=404, detail="Event not found")
    if "error" in result:
        raise HTTPException(status_code=422, detail=result["error"])
    return result


@router.post("/{event_id}/false-alarm")
def mark_false_alarm(event_id: str, body: ReviewUpdate, user: dict = Depends(require_permission("events:review"))):
    result = event_service.mark_false_alarm(event_id, body.operator_note, user)
    if not result:
        raise HTTPException(status_code=404, detail="Event not found")
    if "error" in result:
        raise HTTPException(status_code=422, detail=result["error"])
    return result


@router.post("/{event_id}/assign")
def assign_event(event_id: str, body: AssignEventRequest, user: dict = Depends(require_permission("events:assign"))):
    result = task_service.assign_task(event_id, body.assigned_to_username, body.assigned_to_device_id, body.note, user)
    if not result:
        raise HTTPException(status_code=404, detail="Event not found")
    if "error" in result:
        raise HTTPException(status_code=422, detail=result["error"])
    return result

@router.delete("/{event_id}")
def delete_event(event_id: str, user: dict = Depends(require_permission("events:delete"))):
    result = event_service.delete_event(event_id)
    if not result:
        raise HTTPException(status_code=404, detail="Event not found")
    return result
