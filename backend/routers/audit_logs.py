from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
import models, schemas, database, auth

router = APIRouter(
    prefix="/audit-logs",
    tags=["Audit Logs"]
)

@router.get("/", response_model=List[schemas.AuditLogResponse])
def get_audit_logs(skip: int = 0, limit: int = 100, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    # Note: Depending on rules, you might want to restrict this to managers/admins.
    # We'll return all logs for now as per dashboard requirements.
    logs = db.query(models.AuditLog).order_by(models.AuditLog.created_at.desc()).offset(skip).limit(limit).all()
    return logs

@router.get("/{decision_id}", response_model=List[schemas.AuditLogResponse])
def get_decision_audit_logs(decision_id: int, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    logs = db.query(models.AuditLog).filter(models.AuditLog.entity_type == 'Decision', models.AuditLog.entity_id == decision_id).order_by(models.AuditLog.created_at.desc()).all()
    return logs

def log_action(db: Session, user_id: int, action: str, entity_type: str = None, entity_id: int = None, description: str = None):
    log_entry = models.AuditLog(
        user_id=user_id,
        action=action,
        entity_type=entity_type,
        entity_id=entity_id,
        description=description
    )
    db.add(log_entry)
    db.commit()
    db.refresh(log_entry)
    return log_entry
