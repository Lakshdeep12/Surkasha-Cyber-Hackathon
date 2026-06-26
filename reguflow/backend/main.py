from fastapi import FastAPI, Depends, BackgroundTasks, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from datetime import datetime, timezone
import hashlib
import json
import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database.connection import engine, Base, get_db
from database import models
from backend import schemas
from workflows.main_graph import run_compliance_workflow

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="ReguFlow API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def create_audit_log(db: Session, actor: str, event_type: str, event_details: dict):
    details_str = json.dumps(event_details)
    sha256_hash = hashlib.sha256(f"{actor}{event_type}{details_str}{datetime.now().isoformat()}".encode()).hexdigest()
    
    log = models.AuditLog(
        actor=actor,
        event_type=event_type,
        event_details=details_str,
        sha256_hash=sha256_hash
    )
    db.add(log)
    db.commit()

@app.get("/")
def read_root():
    return {"message": "Welcome to ReguFlow API"}

@app.post("/regulations/process")
def process_regulation(regulation: schemas.RegulationCreate, db: Session = Depends(get_db)):
    # 1. Save regulation to DB
    db_reg = models.Regulation(
        title=regulation.title,
        published_date=regulation.published_date,
        content_text=regulation.content_text
    )
    db.add(db_reg)
    db.commit()
    db.refresh(db_reg)
    
    create_audit_log(db, "System", "CIRCULAR_RECEIVED", {"title": db_reg.title, "id": db_reg.id})

    # 2. Run LangGraph Workflow
    try:
        # Pass model_name here. In production, this can come from config.
        workflow_result = run_compliance_workflow(db_reg.content_text, model_name="llama3")
        
        # 3. Save Obligations
        obligations_data = workflow_result.get("obligations", [])
        maps_data = workflow_result.get("maps", [])
        
        for obs_data in obligations_data:
            # Map RiskLevel enum safely
            risk_val = obs_data.get("risk_level", "Medium")
            if risk_val not in ["Critical", "High", "Medium", "Low"]:
                risk_val = "Medium"
                
            db_obs = models.Obligation(
                regulation_id=db_reg.id,
                description=obs_data.get("description", ""),
                risk_level=models.RiskLevel(risk_val),
                affected_departments=",".join(obs_data.get("affected_departments", []))
            )
            db.add(db_obs)
            db.commit()
            db.refresh(db_obs)
            
            create_audit_log(db, "Agent1", "OBLIGATION_EXTRACTED", {"obligation_id": db_obs.id})
            
            # 4. Save MAPs for this obligation
            # We try to match MAPs to this obligation by description
            for map_data in maps_data:
                if map_data.get("_obligation_desc") == obs_data.get("description"):
                    db_map = models.MAP(
                        obligation_id=db_obs.id,
                        task=map_data.get("task", ""),
                        owner_department=map_data.get("owner", ""),
                        success_criteria=map_data.get("success_criteria", ""),
                        status="PENDING"
                    )
                    db.add(db_map)
                    db.commit()
                    db.refresh(db_map)
                    create_audit_log(db, "Agent2", "MAP_GENERATED", {"map_id": db_map.id})
        
        db_reg.processed = True
        db.commit()
        
    except Exception as e:
        print(f"Workflow error: {e}")
        db_reg.processed = False
        db.commit()
        raise HTTPException(status_code=500, detail=f"Workflow processing failed: {e}")
        
    return {"message": "Regulation processed successfully", "regulation_id": db_reg.id}

@app.get("/regulations", response_model=list[schemas.RegulationResponse])
def get_regulations(db: Session = Depends(get_db)):
    return db.query(models.Regulation).all()

@app.get("/maps", response_model=list[schemas.MAPResponse])
def get_maps(db: Session = Depends(get_db)):
    return db.query(models.MAP).all()
