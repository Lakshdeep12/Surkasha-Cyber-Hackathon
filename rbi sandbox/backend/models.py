from sqlalchemy import Column, Integer, String, Text, DateTime, JSON
from sqlalchemy.sql import func
from database import Base

# ---------------------------------------------------------------------------
# Compliance Case Status constants
# ---------------------------------------------------------------------------
COMPLIANCE_STATUS_PENDING = "PENDING"
COMPLIANCE_STATUS_AWAITING_AUTHORIZATION = "AWAITING_AUTHORIZATION"
COMPLIANCE_STATUS_COMPLETED = "COMPLETED"


class Circular(Base):
    __tablename__ = "circulars"

    id = Column(Integer, primary_key=True, index=True)
    reference_number = Column(String(50), unique=True, index=True, nullable=False)
    title = Column(String(255), nullable=False)
    category = Column(String(100), nullable=False)
    priority = Column(String(20), nullable=False, default="Medium")
    summary = Column(Text, nullable=True)
    full_content = Column(Text, nullable=True)
    target_departments = Column(JSON, nullable=True)  # list of strings
    status = Column(String(20), nullable=False, default="Draft")
    pdf_path = Column(String(500), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    published_at = Column(DateTime(timezone=True), nullable=True)
    issue_date = Column(String(20), nullable=True)
    effective_date = Column(String(20), nullable=True)


class ComplianceCase(Base):
    """Tracks authorization lifecycle for each compliance case (keyed by circular reference_number)."""
    __tablename__ = "compliance_cases"

    id = Column(Integer, primary_key=True, index=True)
    case_id = Column(String(50), unique=True, index=True, nullable=False)  # = circular reference_number
    regulation_id = Column(String(50), nullable=False)                     # same as case_id, explicit for audit
    regulation_title = Column(String(255), nullable=True)

    # Lifecycle status: PENDING | AWAITING_AUTHORIZATION | COMPLETED
    status = Column(String(40), nullable=False, default=COMPLIANCE_STATUS_AWAITING_AUTHORIZATION)

    # Authorization receipt
    authorized_by = Column(String(255), nullable=True)
    authorized_at = Column(DateTime(timezone=True), nullable=True)
    authorization_hash = Column(String(64), nullable=True)  # SHA-256

    # Failed attempt audit
    failed_attempts = Column(Integer, nullable=False, default=0)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


class Event(Base):
    __tablename__ = "events"

    id = Column(Integer, primary_key=True, index=True)
    event_id = Column(String(50), unique=True, index=True, nullable=False)
    event_type = Column(String(100), nullable=False)
    regulation_id = Column(String(50), nullable=False)
    regulation_title = Column(String(255), nullable=True)
    category = Column(String(100), nullable=True)
    priority = Column(String(20), nullable=True)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())
