import os
import shutil
import uuid
from typing import List

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session

from database.database import get_db
from security.auth import get_current_user
from security.audit import log_action
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

    log_action(
        db,
        actor=current_user,
        action="attachment.uploaded",
        entity_type="decision",
        entity_id=decision_id,
        details=f"File '{file.filename}' ({file_size} bytes) uploaded to decision '{decision.title}'",
    )

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


@router.get("/attachments/{attachment_id}/download")
def download_attachment_file(
    decision_id: int,
    attachment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    attachment = (
        db.query(Attachment)
        .filter(Attachment.id == attachment_id, Attachment.decision_id == decision_id)
        .first()
    )
    if not attachment:
        raise HTTPException(status_code=404, detail="Attachment not found")
    if not os.path.exists(attachment.file_path):
        raise HTTPException(
            status_code=404, detail=f"File '{attachment.filename}' not found on server disk"
        )

    from fastapi.responses import FileResponse

    return FileResponse(
        path=attachment.file_path,
        filename=attachment.filename,
        media_type=attachment.content_type or "application/octet-stream",
    )
