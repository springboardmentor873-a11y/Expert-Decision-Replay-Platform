import os
import shutil
import uuid
from typing import List

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session

from database.database import get_db
from security.auth import get_current_user
from models.decision import Decision
from models.attachment import Attachment
from models.user import User
from Schemas.attachment import AttachmentOut

router = APIRouter(prefix="/decisions/{decision_id}", tags=["File Management"])

UPLOAD_DIR = os.path.join("static", "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)


@router.post("/upload", response_model=AttachmentOut, status_code=201)
def upload_file(
    decision_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    decision = db.query(Decision).filter(Decision.id == decision_id).first()
    if not decision:
        raise HTTPException(status_code=404, detail="Decision not found")

    # Prefix with a UUID to avoid filename collisions on disk
    safe_name = f"{uuid.uuid4().hex}_{file.filename}"
    disk_path = os.path.join(UPLOAD_DIR, safe_name)

    with open(disk_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    file_size = os.path.getsize(disk_path)

    attachment = Attachment(
        decision_id=decision_id,
        uploaded_by_id=current_user.id,
        filename=file.filename,
        file_path=disk_path,
        file_size=file_size,
        content_type=file.content_type,
    )
    db.add(attachment)
    db.commit()
    db.refresh(attachment)
    return attachment


@router.get("/attachments", response_model=List[AttachmentOut])
def list_attachments(
    decision_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    decision = db.query(Decision).filter(Decision.id == decision_id).first()
    if not decision:
        raise HTTPException(status_code=404, detail="Decision not found")

    return db.query(Attachment).filter(Attachment.decision_id == decision_id).all()
