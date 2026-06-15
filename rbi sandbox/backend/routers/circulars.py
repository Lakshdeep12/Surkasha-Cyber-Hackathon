from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
import os, shutil, uuid
from datetime import datetime

from database import get_db
import models
import schemas

router = APIRouter(prefix="/api/circulars", tags=["circulars"])

UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)


@router.post("", response_model=schemas.CircularOut, status_code=201)
def create_circular(payload: schemas.CircularCreate, db: Session = Depends(get_db)):
    # Check duplicate reference number
    existing = db.query(models.Circular).filter(
        models.Circular.reference_number == payload.reference_number
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Reference number already exists")

    circular = models.Circular(**payload.model_dump())
    db.add(circular)
    db.commit()
    db.refresh(circular)
    return circular


@router.get("", response_model=List[schemas.CircularOut])
def list_circulars(
    status: Optional[str] = None,
    category: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    q = db.query(models.Circular)
    if status:
        q = q.filter(models.Circular.status == status)
    if category:
        q = q.filter(models.Circular.category == category)
    return q.order_by(models.Circular.created_at.desc()).offset(skip).limit(limit).all()


@router.get("/{circular_id}", response_model=schemas.CircularOut)
def get_circular(circular_id: int, db: Session = Depends(get_db)):
    circular = db.query(models.Circular).filter(models.Circular.id == circular_id).first()
    if not circular:
        raise HTTPException(status_code=404, detail="Circular not found")
    return circular


@router.put("/{circular_id}", response_model=schemas.CircularOut)
def update_circular(circular_id: int, payload: schemas.CircularUpdate, db: Session = Depends(get_db)):
    circular = db.query(models.Circular).filter(models.Circular.id == circular_id).first()
    if not circular:
        raise HTTPException(status_code=404, detail="Circular not found")
    if circular.status == "Published":
        raise HTTPException(status_code=400, detail="Cannot edit a published circular")
    
    update_data = payload.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(circular, key, value)
    db.commit()
    db.refresh(circular)
    return circular


@router.post("/{circular_id}/upload")
async def upload_pdf(circular_id: int, file: UploadFile = File(...), db: Session = Depends(get_db)):
    circular = db.query(models.Circular).filter(models.Circular.id == circular_id).first()
    if not circular:
        raise HTTPException(status_code=404, detail="Circular not found")
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are accepted")

    filename = f"{circular.reference_number}_{uuid.uuid4().hex[:8]}.pdf"
    filepath = os.path.join(UPLOAD_DIR, filename)
    with open(filepath, "wb") as f:
        shutil.copyfileobj(file.file, f)

    circular.pdf_path = filename
    db.commit()
    db.refresh(circular)
    return {
        "message": "PDF uploaded successfully",
        "filename": filename,
        "circular_id": circular_id
    }


@router.post("/{circular_id}/publish", response_model=schemas.CircularOut)
def publish_circular(circular_id: int, db: Session = Depends(get_db)):
    circular = db.query(models.Circular).filter(models.Circular.id == circular_id).first()
    if not circular:
        raise HTTPException(status_code=404, detail="Circular not found")
    if circular.status == "Published":
        raise HTTPException(status_code=400, detail="Circular is already published")

    circular.status = "Published"
    circular.published_at = datetime.utcnow()
    db.commit()

    # Generate event
    event_num = db.query(func.count(models.Event.id)).scalar() + 1
    event = models.Event(
        event_id=f"evt_{event_num:04d}",
        event_type="REGULATION_PUBLISHED",
        regulation_id=circular.reference_number,
        regulation_title=circular.title,
        category=circular.category,
        priority=circular.priority,
    )
    db.add(event)
    db.commit()
    db.refresh(circular)
    return circular


@router.get("/{circular_id}/pdf")
def download_pdf(circular_id: int, db: Session = Depends(get_db)):
    from fastapi.responses import FileResponse
    circular = db.query(models.Circular).filter(models.Circular.id == circular_id).first()
    if not circular or not circular.pdf_path:
        raise HTTPException(status_code=404, detail="PDF not found")
    filepath = os.path.join(UPLOAD_DIR, circular.pdf_path)
    if not os.path.exists(filepath):
        raise HTTPException(status_code=404, detail="PDF file not found on disk")
    return FileResponse(
        path=filepath,
        media_type="application/pdf",
        filename=circular.pdf_path
    )
