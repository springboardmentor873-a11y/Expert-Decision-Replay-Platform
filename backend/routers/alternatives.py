from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

import models, schemas, database, auth

router = APIRouter(
    prefix="/decisions/{decision_id}/alternatives",
    tags=["Alternatives"]
)

@router.get("/", response_model=List[schemas.AlternativeResponse])
def get_alternatives(decision_id: int, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    # Verify decision exists
    decision = db.query(models.Decision).filter(models.Decision.id == decision_id).first()
    if not decision:
        raise HTTPException(status_code=404, detail="Decision not found")
        
    alternatives = db.query(models.Alternative).filter(models.Alternative.decision_id == decision_id).all()
    return alternatives

@router.post("/", response_model=schemas.AlternativeResponse, status_code=status.HTTP_201_CREATED)
def create_alternative(decision_id: int, alternative: schemas.AlternativeCreate, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    decision = db.query(models.Decision).filter(models.Decision.id == decision_id).first()
    if not decision:
        raise HTTPException(status_code=404, detail="Decision not found")
        
    db_alt = models.Alternative(**alternative.model_dump(), decision_id=decision_id)
    db.add(db_alt)
    db.commit()
    db.refresh(db_alt)
    return db_alt

@router.put("/{alternative_id}", response_model=schemas.AlternativeResponse)
def update_alternative(decision_id: int, alternative_id: int, alternative_update: schemas.AlternativeCreate, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    db_alt = db.query(models.Alternative).filter(models.Alternative.id == alternative_id, models.Alternative.decision_id == decision_id).first()
    if not db_alt:
        raise HTTPException(status_code=404, detail="Alternative not found")
        
    update_data = alternative_update.model_dump(exclude_unset=True)
    if update_data:
        for key, value in update_data.items():
            setattr(db_alt, key, value)
        db.commit()
        db.refresh(db_alt)
        
    return db_alt

@router.delete("/{alternative_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_alternative(decision_id: int, alternative_id: int, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    db_alt = db.query(models.Alternative).filter(models.Alternative.id == alternative_id, models.Alternative.decision_id == decision_id).first()
    if not db_alt:
        raise HTTPException(status_code=404, detail="Alternative not found")
        
    db.delete(db_alt)
    db.commit()
    return None
