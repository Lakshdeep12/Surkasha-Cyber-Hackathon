from pydantic import BaseModel, Field
from typing import List, Optional, Any
from datetime import datetime

class ExtractedTask(BaseModel):
    task_id: str = Field(..., description="Unique identifier for the task")
    title: str = Field(..., description="Title of the compliance obligation")
    description: str = Field(..., description="Detailed description of the task")
    target_department: str = Field(..., description="Department responsible for execution")
    deadline: Optional[str] = Field(None, description="Deadline for compliance (ISO 8601 string)")
    risk_level: str = Field(..., description="Risk tier: Low, Medium, High, Critical")

class ExtractedSchema(BaseModel):
    circular_id: str = Field(..., description="ID of the circular")
    tasks: List[ExtractedTask] = Field(..., description="List of extracted actionable tasks")

class ValidationResult(BaseModel):
    is_valid: bool = Field(..., description="Whether the extraction is valid and safe")
    confidence_score: float = Field(..., description="Confidence score from 0.0 to 1.0")
    feedback: str = Field(..., description="Feedback or reasoning from the auditor node")

class AuditLogEntry(BaseModel):
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    action: str = Field(..., description="Action performed (e.g., extraction, validation, routing)")
    details: Any = Field(..., description="Details of the action")
    payload_hash: str = Field(..., description="SHA-256 hash of the payload for tamper-evidence")
