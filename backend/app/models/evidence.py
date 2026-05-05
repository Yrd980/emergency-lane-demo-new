from pydantic import BaseModel

class EvidenceResponse(BaseModel):
    event_id: str
    evidence_type: str
    stored: bool
    url: str
    sha256: str
