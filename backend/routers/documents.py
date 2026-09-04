import os
import shutil
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
from typing import List

import models, schemas, database, auth

router = APIRouter(
    prefix="/decisions/{decision_id}/documents",
    tags=["Documents"]
)

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.get("/", response_model=List[schemas.DocumentResponse])
def get_documents(decision_id: int, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    decision = db.query(models.Decision).filter(models.Decision.id == decision_id).first()
    if not decision:
        raise HTTPException(status_code=404, detail="Decision not found")
        
    documents = db.query(models.Document).filter(models.Document.decision_id == decision_id).all()
    return documents

@router.post("/", response_model=schemas.DocumentResponse, status_code=status.HTTP_201_CREATED)
def upload_document(decision_id: int, file: UploadFile = File(...), db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    decision = db.query(models.Decision).filter(models.Decision.id == decision_id).first()
    if not decision:
        raise HTTPException(status_code=404, detail="Decision not found")
    
    file_path = os.path.join(UPLOAD_DIR, f"decision_{decision_id}_{file.filename}")
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    db_document = models.Document(
        filename=file.filename,
        file_path=file_path,
        decision_id=decision_id,
        uploaded_by_id=current_user.id
    )
    db.add(db_document)
    db.commit()
    db.refresh(db_document)
    return db_document

@router.delete("/{document_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_document(decision_id: int, document_id: int, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    db_document = db.query(models.Document).filter(models.Document.id == document_id, models.Document.decision_id == decision_id).first()
    if not db_document:
        raise HTTPException(status_code=404, detail="Document not found")
        
    # Check authorization
    if db_document.uploaded_by_id != current_user.id and current_user.role != models.RoleEnum.ADMINISTRATOR:
        raise HTTPException(status_code=403, detail="Not authorized to delete this document")
        
    # Try deleting the physical file
    if os.path.exists(db_document.file_path):
        os.remove(db_document.file_path)
        
    db.delete(db_document)
    db.commit()
    return None
