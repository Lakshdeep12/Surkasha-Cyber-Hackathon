from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
import os
import logging

from database import engine, SessionLocal
import models
from routers import circulars, compliance, events
from agents.rir_agent import extract_regulatory_intelligence
from services.rir_pdf_generator import generate_rir_pdf

logger = logging.getLogger(__name__)

# Create all tables
models.Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="DRBI Regulatory Publishing API",
    description="Demo Regulatory Bank of India — Internal Regulatory Publishing Portal",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:5175",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174",
        "http://127.0.0.1:5175",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(circulars.router)
app.include_router(compliance.router)
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


def remove_legacy_demo_data():
    """Remove the original seeded demo circulars so dashboards reflect only real uploads."""
    db = SessionLocal()
    try:
        demo_refs = ["DRBI-2026-001", "DRBI-2026-002", "DRBI-2026-003"]
        demo_circulars = db.query(models.Circular).filter(
            models.Circular.reference_number.in_(demo_refs)
        ).all()
        if not demo_circulars:
            return

        upload_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "uploads")
        for circular in demo_circulars:
            if circular.pdf_path:
                path = os.path.join(upload_dir, circular.pdf_path)
                if os.path.exists(path):
                    os.remove(path)
            db.query(models.Event).filter(
                models.Event.regulation_id == circular.reference_number
            ).delete(synchronize_session=False)
            db.delete(circular)

        db.commit()
        print("[DRBI] Removed legacy demo data. Dashboard now reflects real uploads only.")
    except Exception as e:
        db.rollback()
        print(f"[DRBI] Demo cleanup error: {e}")
    finally:
        db.close()


remove_legacy_demo_data()


# ---------------------------------------------------------------------------
# Regulatory Intelligence Report (RIR) Endpoint
# ---------------------------------------------------------------------------
@app.get("/api/v1/regulations/{regulation_id}/download-summary")
def download_regulatory_intelligence_report(regulation_id: str):
    """
    Generate and download a Regulatory Intelligence Report (RIR) PDF.
    Uses local Ollama AI to extract structured compliance intelligence from circular content.
    Falls back to rule-based extraction if Ollama is unavailable.
    """
    db = SessionLocal()
    try:
        circular = (
            db.query(models.Circular)
            .filter(models.Circular.reference_number == regulation_id)
            .first()
        )
        if not circular:
            raise HTTPException(status_code=404, detail=f"Regulation '{regulation_id}' not found")

        logger.info(f"Generating RIR for: {regulation_id}")

        # Build the data dict for the agent
        circular_data = {
            "regulation_id":    circular.reference_number,
            "title":            circular.title,
            "category":         circular.category,
            "priority":         circular.priority,
            "issue_date":       circular.issue_date,
            "effective_date":   circular.effective_date,
            "content":          circular.full_content or circular.summary or "",
            "summary":          circular.summary or "",
            "target_departments": getattr(circular, "target_departments", []) or [],
        }

        # Call AI agent (with rule-based fallback)
        intelligence = extract_regulatory_intelligence(circular_data)

        # Generate professional PDF
        pdf_buffer = generate_rir_pdf(circular_data, intelligence)

        safe_id = regulation_id.replace("/", "_").replace(" ", "_")
        filename = f"Regulatory_Intelligence_Report_{safe_id}.pdf"

        return StreamingResponse(
            pdf_buffer,
            media_type="application/pdf",
            headers={
                "Content-Disposition": f'attachment; filename="{filename}"',
                "X-RIR-Model": intelligence.get("_model_used", "unknown"),
            }
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"RIR generation failed for {regulation_id}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Report generation failed: {str(e)}")
    finally:
        db.close()
