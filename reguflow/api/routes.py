from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel
import logging
from infrastructure.database import db_client

logger = logging.getLogger(__name__)
router = APIRouter()

class CircularPayload(BaseModel):
    id: str
    content: str

@router.post("/ingest")
async def ingest_circular(payload: CircularPayload, background_tasks: BackgroundTasks):
    """
    Webhook endpoint to manually ingest a circular.
    """
    logger.info(f"Received circular via API: {payload.id}")
    return {"status": "success", "message": "Circular received for processing"}

@router.get("/status")
async def get_status():
    """
    Dashboard API to check system health.
    """
    return {"status": "online", "mode": "air-gapped"}

@router.get("/ledger")
async def get_ledger():
    """
    Dashboard API to retrieve the audit ledger.
    """
    try:
        cursor = db_client.db["audit_ledger"].find().sort("timestamp", -1).limit(50)
        ledger_entries = await cursor.to_list(length=50)
        # Convert ObjectId to string for JSON serialization
        for entry in ledger_entries:
            entry["_id"] = str(entry["_id"])
        return {"status": "success", "data": ledger_entries}
    except Exception as e:
        logger.error(f"Error fetching ledger: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch ledger")
