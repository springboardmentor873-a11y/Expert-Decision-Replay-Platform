from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import User
from app.schemas import AttachmentResponse
from app.auth import get_current_active_user
from app.services import file_service

router = APIRouter(prefix="/decisions", tags=["Document Management & Attachments"])

@router.post("/{id}/attachments", response_model=AttachmentResponse, status_code=status.HTTP_201_CREATED)
def upload_attachment(
    id: int,
    file: UploadFile = File(...),
    comment_id: Optional[int] = Form(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Upload a multipart document attachment associated with a decision or comment.
    """
    attachment = file_service.save_attachment(
        db=db,
        decision_id=id,
        file=file,
        current_user=current_user,
        comment_id=comment_id
    )
    return file_service.to_attachment_response(attachment)

@router.get("/{id}/attachments", response_model=List[AttachmentResponse])
def list_attachments(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    List all uploaded attachments and document references linked to a decision.
    """
    attachments = file_service.list_attachments(db, id)
    return [file_service.to_attachment_response(a) for a in attachments]

@router.get("/{id}/attachments/{file_id}/download")
def download_attachment(
    id: int,
    file_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Download an attachment file by file ID with authenticated access.
    """
    return file_service.create_attachment_download_response(db, id, file_id)

@router.delete("/{id}/attachments/{file_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_attachment(
    id: int,
    file_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Delete an attachment file and remove its record.
    """
    file_service.delete_attachment(db, id, file_id, current_user)
    return None
