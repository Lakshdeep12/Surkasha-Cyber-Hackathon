from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime
import json

from database import engine, SessionLocal
import models
from routers import circulars, events

# Create all tables
models.Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="DRBI Regulatory Publishing API",
    description="Demo Regulatory Bank of India — Internal Regulatory Publishing Portal",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(circulars.router)
app.include_router(events.router)


@app.get("/")
def root():
    return {
        "system": "DRBI Regulatory Publishing Portal",
        "version": "1.0.0",
        "status": "OPERATIONAL",
        "environment": "OFFLINE REGULATORY SANDBOX"
    }


@app.get("/api/stats", response_model=None)
def get_stats():
    db = SessionLocal()
    try:
        total = db.query(models.Circular).count()
        drafts = db.query(models.Circular).filter(models.Circular.status == "Draft").count()
        published = db.query(models.Circular).filter(models.Circular.status == "Published").count()
        critical = db.query(models.Circular).filter(
            models.Circular.priority == "Critical",
            models.Circular.status == "Published"
        ).count()
        recent_events = (
            db.query(models.Event)
            .order_by(models.Event.timestamp.desc())
            .limit(5)
            .all()
        )
        recent_pubs = (
            db.query(models.Circular)
            .filter(models.Circular.status == "Published")
            .order_by(models.Circular.published_at.desc())
            .limit(5)
            .all()
        )
        return {
            "total_circulars": total,
            "draft_circulars": drafts,
            "published_circulars": published,
            "critical_advisories": critical,
            "recent_publications": [
                {
                    "id": c.id,
                    "reference_number": c.reference_number,
                    "title": c.title,
                    "category": c.category,
                    "priority": c.priority,
                    "published_at": c.published_at.isoformat() if c.published_at else None,
                    "status": c.status,
                }
                for c in recent_pubs
            ],
            "recent_events": [
                {
                    "id": e.id,
                    "event_id": e.event_id,
                    "event_type": e.event_type,
                    "regulation_id": e.regulation_id,
                    "regulation_title": e.regulation_title,
                    "category": e.category,
                    "priority": e.priority,
                    "timestamp": e.timestamp.isoformat(),
                }
                for e in recent_events
            ],
        }
    finally:
        db.close()


def seed_demo_data():
    """Pre-load 3 demo regulations on first run."""
    db = SessionLocal()
    try:
        if db.query(models.Circular).count() > 0:
            return  # Already seeded

        demo_circulars = [
            {
                "reference_number": "DRBI-2026-001",
                "title": "AES-256 Encryption Mandate for Core Banking Systems",
                "category": "Cyber Advisory",
                "priority": "Critical",
                "summary": "All scheduled commercial banks and payment system operators must implement AES-256 encryption for data at rest and in transit across all core banking infrastructure by Q3 2026.",
                "full_content": """RESERVE REGULATORY CIRCULAR

Ref: DRBI/CISA/2026/001
Date: June 14, 2026

To,
All Scheduled Commercial Banks,
All Payment System Operators,
All Non-Banking Financial Companies (NBFCs)

Subject: Mandatory Implementation of AES-256 Encryption Standards

1. BACKGROUND
The Reserve Regulatory Authority has observed significant gaps in encryption standards across regulated entities' core banking systems. Recent threat intelligence reports indicate an escalation in targeted attacks on financial infrastructure.

2. DIRECTIVE
All regulated entities are hereby directed to:
a) Implement AES-256-GCM encryption for all data at rest in core banking databases.
b) Enforce TLS 1.3 minimum for all data in transit across internal and external channels.
c) Retire all instances of DES, 3DES, RC4, and AES-128 within 90 days of this circular.
d) Submit compliance attestation to the DRBI Cyber Risk Division by September 30, 2026.

3. PENALTY PROVISIONS
Non-compliance shall attract penalties under Section 47A of the Banking Regulation Act.

4. EFFECTIVE DATE
This circular is effective immediately upon publication.

Issued by: DRBI Cyber and Information Security Advisory Division""",
                "target_departments": ["IT Security", "Core Banking", "Risk Management", "Compliance"],
                "status": "Published",
                "issue_date": "2026-06-14",
                "effective_date": "2026-06-14",
                "published_at": datetime(2026, 6, 14, 9, 0, 0),
            },
            {
                "reference_number": "DRBI-2026-002",
                "title": "Multi-Factor Authentication Requirement for Customer-Facing Portals",
                "category": "Data Security Circular",
                "priority": "High",
                "summary": "Mandates implementation of strong multi-factor authentication across all customer-facing digital banking channels, including mobile banking apps, internet banking portals, and API gateways.",
                "full_content": """RESERVE REGULATORY CIRCULAR

Ref: DRBI/CISA/2026/002
Date: June 14, 2026

To,
All Scheduled Commercial Banks,
All Digital Payment Operators,
All Fintech Regulated Entities

Subject: Mandatory Multi-Factor Authentication for Customer-Facing Digital Channels

1. OBJECTIVE
To strengthen authentication security across digital banking channels and reduce account takeover fraud incidents.

2. REQUIREMENTS
2.1 All customer-facing portals must implement MFA using at least two of the following factors:
    - Knowledge factor (password/PIN)
    - Possession factor (OTP via registered mobile/hardware token)
    - Inherence factor (biometric authentication)

2.2 MFA must be enforced for:
    - Login to internet banking portals
    - High-value transaction authorization (> INR 50,000)
    - Profile changes (contact details, nominee, etc.)
    - API access using customer credentials

2.3 SMS-only OTP is no longer acceptable as sole second factor for transactions above INR 1,00,000.

3. IMPLEMENTATION TIMELINE
- Phase 1 (0-30 days): Internet banking portals
- Phase 2 (30-60 days): Mobile banking applications
- Phase 3 (60-90 days): API gateways and third-party integrations

4. REPORTING
Monthly compliance reports to be submitted via the DRBI Regulatory Reporting Portal.

Issued by: DRBI Digital Banking Supervision Division""",
                "target_departments": ["Digital Banking", "IT Security", "Customer Experience", "Compliance"],
                "status": "Published",
                "issue_date": "2026-06-14",
                "effective_date": "2026-07-01",
                "published_at": datetime(2026, 6, 14, 10, 30, 0),
            },
            {
                "reference_number": "DRBI-2026-003",
                "title": "Cyber Incident Reporting Framework — Revised Standards",
                "category": "Compliance Notice",
                "priority": "High",
                "summary": "Establishes revised timelines and formats for reporting cybersecurity incidents to DRBI. Introduces a tiered classification system with mandatory 2-hour, 6-hour, and 24-hour reporting windows based on incident severity.",
                "full_content": """RESERVE REGULATORY CIRCULAR

Ref: DRBI/CISA/2026/003
Date: June 14, 2026

To,
All Regulated Financial Entities,
All Payment System Participants

Subject: Revised Cyber Incident Reporting Framework

1. PURPOSE
This circular supersedes the earlier incident reporting guidelines issued in 2023 and establishes a comprehensive, tiered framework for cyber incident reporting.

2. INCIDENT CLASSIFICATION

TIER 1 — CRITICAL (Report within 2 hours):
- Ransomware attacks affecting operational systems
- Data breach involving > 10,000 customer records
- Disruption to payment settlement systems
- Compromise of privileged administrative accounts

TIER 2 — SEVERE (Report within 6 hours):
- DDoS attacks causing service degradation > 30 minutes
- Unauthorized access to internal systems
- Data breach involving 1,000–10,000 records
- Malware detected in production environments

TIER 3 — SIGNIFICANT (Report within 24 hours):
- Phishing campaigns targeting staff
- Vulnerability exploitation attempts
- Minor data exposure incidents
- Third-party vendor security incidents

3. REPORTING MECHANISM
All incidents must be reported via the DRBI Cyber Incident Portal at: drbi-internal://incident-portal
Telephonic notification: DRBI Cyber Emergency Hotline (24x7)

4. POST-INCIDENT REQUIREMENTS
- Root Cause Analysis report within 15 days
- Remediation closure report within 30 days

Issued by: DRBI Cybersecurity Risk Supervision Wing""",
                "target_departments": ["CISO Office", "IT Operations", "Risk Management", "Legal"],
                "status": "Draft",
                "issue_date": "2026-06-14",
                "effective_date": "2026-07-15",
            },
        ]

        for data in demo_circulars:
            published_at = data.pop("published_at", None)
            circular = models.Circular(**data)
            circular.published_at = published_at
            db.add(circular)

        db.flush()

        # Generate events for published circulars
        published = db.query(models.Circular).filter(models.Circular.status == "Published").all()
        for i, c in enumerate(published, 1):
            event = models.Event(
                event_id=f"evt_{i:04d}",
                event_type="REGULATION_PUBLISHED",
                regulation_id=c.reference_number,
                regulation_title=c.title,
                category=c.category,
                priority=c.priority,
                timestamp=c.published_at,
            )
            db.add(event)

        db.commit()
        print("[DRBI] Demo data seeded successfully.")
    except Exception as e:
        db.rollback()
        print(f"[DRBI] Seed error: {e}")
    finally:
        db.close()


# Seed on startup
seed_demo_data()
