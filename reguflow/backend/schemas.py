from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime

class ObligationBase(BaseModel):
    description: str
    deadline: Optional[datetime] = None
    risk_level: str
    affected_departments: str

class ObligationCreate(ObligationBase):
    pass

class ObligationResponse(ObligationBase):
    id: int
    regulation_id: int
    class Config:
        from_attributes = True

class RegulationBase(BaseModel):
    title: str
    published_date: datetime
    content_text: str

class RegulationCreate(RegulationBase):
    pass

class RegulationResponse(RegulationBase):
    id: int
    processed: bool
    created_at: datetime
    obligations: List[ObligationResponse] = []
    class Config:
        from_attributes = True

class MAPBase(BaseModel):
    task: str
    owner_department: str
    deadline: Optional[datetime] = None
    success_criteria: str
    status: str = "PENDING"

class MAPCreate(MAPBase):
    obligation_id: int

class MAPResponse(MAPBase):
    id: int
    obligation_id: int
    class Config:
        from_attributes = True

# AI Output Schemas
class ExtractedObligation(BaseModel):
    description: str = Field(description="The core requirement or action dictated by the regulation")
    deadline: Optional[str] = Field(description="The deadline for compliance, if any, in YYYY-MM-DD format or descriptive text")
    affected_departments: List[str] = Field(description="List of bank departments that need to act")
    risk_level: str = Field(description="Risk level: Critical, High, Medium, or Low")

class RegulatoryIntelligenceOutput(BaseModel):
    obligations: List[ExtractedObligation]

class MAPGenerationOutput(BaseModel):
    map_id: str
    task: str
    owner: str
    deadline: str
    success_criteria: str
