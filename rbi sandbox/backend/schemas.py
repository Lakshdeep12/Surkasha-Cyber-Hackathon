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
