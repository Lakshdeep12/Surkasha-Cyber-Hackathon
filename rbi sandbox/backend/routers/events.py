from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List

from database import get_db
import models
import schemas

router = APIRouter(tags=["events"])


@router.get("/api/events", response_model=List[schemas.EventOut])
def get_events(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return (
        db.query(models.Event)
        .order_by(models.Event.timestamp.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )


@router.get("/api/publications", response_model=List[schemas.CircularOut])
def get_publications(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return (
        db.query(models.Circular)
        .filter(models.Circular.status == "Published")
        .order_by(models.Circular.published_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )
