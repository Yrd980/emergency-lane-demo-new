from pydantic import BaseModel

class EvidenceResponse(BaseModel):
    suspected_incident_id: str
    evidence_type: str
    stored: bool
    url: str
    sha256: str
