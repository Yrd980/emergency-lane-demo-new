from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from app.services import evidence_service

router = APIRouter(prefix="/api/events", tags=["evidence"])

MAX_EVIDENCE_SIZE = 50 * 1024 * 1024  # 50 MB

@router.post("/{event_id}/evidence")
def upload_evidence(
    event_id: str,
    evidence_type: str = Form(...),
    file: UploadFile = File(...),
):
    content = file.file.read()
    if len(content) > MAX_EVIDENCE_SIZE:
        raise HTTPException(status_code=413, detail="Evidence file exceeds 50MB limit")
    result = evidence_service.save_evidence(
        event_id=event_id,
        evidence_type=evidence_type,
        file_content=content,
        filename=file.filename or "unknown",
        mime_type=file.content_type or "application/octet-stream",
    )
    if not result:
        raise HTTPException(status_code=404, detail="Event not found")
    return result
