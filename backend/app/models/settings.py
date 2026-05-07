from typing import Literal

from pydantic import BaseModel, Field


class RuntimeSettings(BaseModel):
    review_mode: Literal["manual", "strict"] = "manual"
    online_window_seconds: int = Field(default=60, ge=10, le=3600)
    evidence_retention_days: int = Field(default=30, ge=1, le=3650)
    require_complete_evidence: bool = False
    device_access_mode: Literal["open", "token"] = "open"
    updated_at: str


class RuntimeSettingsUpdate(BaseModel):
    review_mode: Literal["manual", "strict"] = "manual"
    online_window_seconds: int = Field(default=60, ge=10, le=3600)
    evidence_retention_days: int = Field(default=30, ge=1, le=3650)
    require_complete_evidence: bool = False
    device_access_mode: Literal["open", "token"] = "open"
