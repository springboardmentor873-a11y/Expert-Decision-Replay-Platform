from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime

import models, schemas, database, auth

router = APIRouter(
    prefix="/decisions",
    tags=["Decisions"]
)

@router.get("/", response_model=List[schemas.DecisionResponse])
def get_decisions(skip: int = 0, limit: int = 100, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    decisions = db.query(models.Decision).offset(skip).limit(limit).all()
    return decisions

@router.post("/", response_model=schemas.DecisionResponse, status_code=status.HTTP_201_CREATED)
def create_decision(decision: schemas.DecisionCreate, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    db_decision = models.Decision(**decision.model_dump(), creator_id=current_user.id)
    db.add(db_decision)
    db.commit()
    db.refresh(db_decision)
    return db_decision

@router.get("/{decision_id}", response_model=schemas.DecisionResponse)
def get_decision(decision_id: int, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    decision = db.query(models.Decision).filter(models.Decision.id == decision_id).first()
    if not decision:
        raise HTTPException(status_code=404, detail="Decision not found")
    return decision

@router.put("/{decision_id}", response_model=schemas.DecisionResponse)
def update_decision(decision_id: int, decision_update: schemas.DecisionUpdate, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    db_decision = db.query(models.Decision).filter(models.Decision.id == decision_id).first()
    if not db_decision:
        raise HTTPException(status_code=404, detail="Decision not found")
    
    update_data = decision_update.model_dump(exclude_unset=True)
    if update_data:
        for key, value in update_data.items():
            setattr(db_decision, key, value)
        
        # Bump version on edit
        db_decision.version += 1
        db_decision.updated_at = datetime.utcnow()
        
        db.commit()
        db.refresh(db_decision)
    
    return db_decision

@router.delete("/{decision_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_decision(decision_id: int, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    db_decision = db.query(models.Decision).filter(models.Decision.id == decision_id).first()
    if not db_decision:
        raise HTTPException(status_code=404, detail="Decision not found")
        
    if db_decision.creator_id != current_user.id and current_user.role != models.RoleEnum.ADMINISTRATOR:
        raise HTTPException(status_code=403, detail="Not authorized to delete this decision")
        
    db.delete(db_decision)
    db.commit()
    return None
