from sqlalchemy import Column, Integer, String, Text, DateTime, JSON
from sqlalchemy.sql import func
from database import Base


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
