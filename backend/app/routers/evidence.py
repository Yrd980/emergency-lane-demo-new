from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException
from app.auth import require_device_access
from app.services import evidence_service

router = APIRouter(prefix="/api/suspected-incidents", tags=["evidence"])

MAX_EVIDENCE_SIZE = 50 * 1024 * 1024  # 50 MB

@router.post("/{suspected_incident_id}/evidence")
def upload_evidence(
    suspected_incident_id: str,
    device_access: dict | None = Depends(require_device_access),
    evidence_type: str = Form(...),
    file: UploadFile = File(...),
):
    content = file.file.read()
    if len(content) > MAX_EVIDENCE_SIZE:
        raise HTTPException(status_code=413, detail="Evidence file exceeds 50MB limit")
    result = evidence_service.save_evidence(
        suspected_incident_id=suspected_incident_id,
        evidence_type=evidence_type,
        file_content=content,
        filename=file.filename or "unknown",
        mime_type=file.content_type or "application/octet-stream",
    )
    if not result:
        raise HTTPException(status_code=404, detail="Suspected incident not found")
    if "error" in result:
        raise HTTPException(status_code=422, detail=result["error"])
    return result
