from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

import models, schemas, database, auth

router = APIRouter(
    prefix="/decisions/{decision_id}/discussions",
    tags=["Discussions"]
)

@router.get("/", response_model=List[schemas.DiscussionResponse])
def get_discussions(decision_id: int, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    decision = db.query(models.Decision).filter(models.Decision.id == decision_id).first()
    if not decision:
        raise HTTPException(status_code=404, detail="Decision not found")
        
    discussions = db.query(models.Discussion).filter(models.Discussion.decision_id == decision_id).all()
    return discussions

@router.post("/", response_model=schemas.DiscussionResponse, status_code=status.HTTP_201_CREATED)
def create_discussion(decision_id: int, discussion: schemas.DiscussionCreate, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    decision = db.query(models.Decision).filter(models.Decision.id == decision_id).first()
    if not decision:
        raise HTTPException(status_code=404, detail="Decision not found")
        
    db_discussion = models.Discussion(**discussion.model_dump(), decision_id=decision_id, user_id=current_user.id)
    db.add(db_discussion)
    db.commit()
    db.refresh(db_discussion)
    return db_discussion

@router.delete("/{discussion_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_discussion(decision_id: int, discussion_id: int, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    db_discussion = db.query(models.Discussion).filter(models.Discussion.id == discussion_id, models.Discussion.decision_id == decision_id).first()
    if not db_discussion:
        raise HTTPException(status_code=404, detail="Discussion not found")
        
    # Check if the user is the owner or an admin
    if db_discussion.user_id != current_user.id and current_user.role != models.RoleEnum.ADMINISTRATOR:
        raise HTTPException(status_code=403, detail="Not authorized to delete this discussion")
        
    db.delete(db_discussion)
    db.commit()
    return None
