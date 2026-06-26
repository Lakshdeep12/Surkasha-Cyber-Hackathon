from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Enum, Boolean
from sqlalchemy.orm import relationship
import enum
from datetime import datetime, timezone
from .connection import Base

class RiskLevel(enum.Enum):
    CRITICAL = "Critical"
    HIGH = "High"
    MEDIUM = "Medium"
    LOW = "Low"

class Regulation(Base):
    __tablename__ = "regulations"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), index=True)
    published_date = Column(DateTime)
    content_text = Column(Text)
    processed = Column(Boolean, default=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

class Obligation(Base):
    __tablename__ = "obligations"

    id = Column(Integer, primary_key=True, index=True)
    regulation_id = Column(Integer, ForeignKey("regulations.id"))
    description = Column(Text)
    deadline = Column(DateTime, nullable=True)
    risk_level = Column(Enum(RiskLevel), nullable=True)
    affected_departments = Column(String(255))
    
    regulation = relationship("Regulation", backref="obligations")

class MAP(Base):
    __tablename__ = "maps"
    
    id = Column(Integer, primary_key=True, index=True)
    obligation_id = Column(Integer, ForeignKey("obligations.id"))
    task = Column(Text)
    owner_department = Column(String(255))
    deadline = Column(DateTime, nullable=True)
    success_criteria = Column(Text)
    status = Column(String(50), default="PENDING")
    
    obligation = relationship("Obligation", backref="maps")

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    actor = Column(String(100))
    event_type = Column(String(100))
    event_details = Column(Text)
    sha256_hash = Column(String(64))
