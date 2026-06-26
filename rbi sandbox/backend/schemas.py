from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


# ── Circular ──────────────────────────────────────────────────
class CircularBase(BaseModel):
    reference_number: str
    title: str
    category: str
    priority: str = "Medium"
    summary: Optional[str] = None
    full_content: Optional[str] = None
    target_departments: Optional[List[str]] = []
    status: str = "Draft"
    issue_date: Optional[str] = None
    effective_date: Optional[str] = None


class CircularCreate(CircularBase):
    pass


class CircularUpdate(BaseModel):
    title: Optional[str] = None
    category: Optional[str] = None
    priority: Optional[str] = None
    summary: Optional[str] = None
    full_content: Optional[str] = None
    target_departments: Optional[List[str]] = None
    status: Optional[str] = None
    issue_date: Optional[str] = None
    effective_date: Optional[str] = None


class CircularOut(CircularBase):
    id: int
    pdf_path: Optional[str] = None
    created_at: datetime
    published_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# ── Event ─────────────────────────────────────────────────────
class EventOut(BaseModel):
    id: int
    event_id: str
    event_type: str
    regulation_id: str
    regulation_title: Optional[str] = None
    category: Optional[str] = None
    priority: Optional[str] = None
    timestamp: datetime

    class Config:
        from_attributes = True


# ── Compliance Authorization ───────────────────────────────────
class AuthorizationRequest(BaseModel):
    """Request body for POST /api/v1/compliance/{case_id}/authorize"""
    authorization_code: str


class AuthorizationResponse(BaseModel):
    """Response returned by the authorization endpoint."""
    case_id: str
    status: str                          # AWAITING_AUTHORIZATION | COMPLETED
    message: str                         # human-readable result
    authorized_by: Optional[str] = None
    authorized_at: Optional[str] = None  # ISO-8601 string
    authorization_hash: Optional[str] = None
    failed_attempts: int = 0


class ComplianceCaseOut(BaseModel):
    """Full compliance case state (returned by GET /status)."""
    case_id: str
    regulation_id: str
    regulation_title: Optional[str] = None
    status: str
    authorized_by: Optional[str] = None
    authorized_at: Optional[datetime] = None
    authorization_hash: Optional[str] = None
    failed_attempts: int
    created_at: datetime

    class Config:
        from_attributes = True
