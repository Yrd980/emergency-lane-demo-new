from typing import Literal

from fastapi import APIRouter, Depends, Query, HTTPException
from app.auth import require_permission
from app.domain import incident_review
from app.models.suspected_incident import AssignSuspectedIncidentRequest, BulkReviewUpdate, SuspectedIncidentCreate, ReviewUpdate
from app.services import suspected_incident_service, task_service

router = APIRouter(prefix="/api/suspected-incidents", tags=["suspected_incidents"])

@router.post("")
def create_suspected_incident(body: SuspectedIncidentCreate):
    gps = body.gps_location.model_dump() if body.gps_location else None
    return suspected_incident_service.create_suspected_incident(
        suspected_incident_id=body.suspected_incident_id, device_id=body.device_id,
        start_time=body.start_time, end_time=body.end_time,
        duration_seconds=body.duration_seconds, roi_id=body.roi_id,
        track_id=body.track_id, vehicle_class=body.vehicle_class,
        vehicle_box=body.vehicle_box.model_dump(),
        confidence=body.confidence, gps_location=gps,
    )

@router.get("")
def list_suspected_incidents(
    status: Literal["pending", "validated", "false_alarm", "closed"] | None = Query(None),
    device_id: str = Query(None),
    roi_id: str = Query(None),
    start_time_from: str = Query(None),
    start_time_to: str = Query(None),
    sort: Literal["review_priority", "created_desc"] = Query("review_priority"),
    limit: int = Query(50),
    offset: int = Query(0),
):
    return suspected_incident_service.list_suspected_incidents(
        status=status, device_id=device_id,
        roi_id=roi_id,
        start_time_from=start_time_from, start_time_to=start_time_to,
        sort=sort,
        limit=limit, offset=offset,
    )

@router.get("/{suspected_incident_id}")
def get_suspected_incident(suspected_incident_id: str):
    suspected_incident = suspected_incident_service.get_suspected_incident(suspected_incident_id)
    if not suspected_incident:
        raise HTTPException(status_code=404, detail="Suspected incident not found")
    return suspected_incident

@router.patch("/{suspected_incident_id}/review")
def update_review(suspected_incident_id: str, body: ReviewUpdate, user: dict = Depends(require_permission("suspected_incidents:review"))):
    error = incident_review.validate_router_outcome(body.review_status)
    if error:
        raise HTTPException(status_code=422, detail=error)
    result = suspected_incident_service.update_review(suspected_incident_id, body.review_status, body.operator_note, body.operator_id or user["display_name"])
    if not result:
        raise HTTPException(status_code=404, detail="Suspected incident not found")
    if "error" in result:
        raise HTTPException(status_code=422, detail=result["error"])
    return result

@router.patch("/review/bulk")
def bulk_update_review(body: BulkReviewUpdate, user: dict = Depends(require_permission("suspected_incidents:review"))):
    error = incident_review.validate_router_outcome(body.review_status)
    if error:
        raise HTTPException(status_code=422, detail=error)
    return suspected_incident_service.bulk_update_review(body.suspected_incident_ids, body.review_status, body.operator_note, body.operator_id or user["display_name"])


@router.post("/{suspected_incident_id}/validate")
def validate_suspected_incident(suspected_incident_id: str, body: ReviewUpdate, user: dict = Depends(require_permission("suspected_incidents:review"))):
    result = suspected_incident_service.validate_suspected_incident(suspected_incident_id, body.operator_note, user)
    if not result:
        raise HTTPException(status_code=404, detail="Suspected incident not found")
    if "error" in result:
        raise HTTPException(status_code=422, detail=result["error"])
    return result


@router.post("/{suspected_incident_id}/false-alarm")
def mark_false_alarm(suspected_incident_id: str, body: ReviewUpdate, user: dict = Depends(require_permission("suspected_incidents:review"))):
    result = suspected_incident_service.mark_false_alarm(suspected_incident_id, body.operator_note, user)
    if not result:
        raise HTTPException(status_code=404, detail="Suspected incident not found")
    if "error" in result:
        raise HTTPException(status_code=422, detail=result["error"])
    return result


@router.post("/{suspected_incident_id}/assign")
def assign_suspected_incident(suspected_incident_id: str, body: AssignSuspectedIncidentRequest, user: dict = Depends(require_permission("suspected_incidents:assign"))):
    result = task_service.assign_task(suspected_incident_id, body.assigned_to_username, body.assigned_to_device_id, body.note, user)
    if not result:
        raise HTTPException(status_code=404, detail="Suspected incident not found")
    if "error" in result:
        raise HTTPException(status_code=422, detail=result["error"])
    return result

@router.delete("/{suspected_incident_id}")
def delete_suspected_incident(suspected_incident_id: str, user: dict = Depends(require_permission("suspected_incidents:delete"))):
    result = suspected_incident_service.delete_suspected_incident(suspected_incident_id)
    if not result:
        raise HTTPException(status_code=404, detail="Suspected incident not found")
    return result
