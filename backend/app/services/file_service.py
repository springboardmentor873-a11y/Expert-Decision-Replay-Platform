import os
import uuid
import re
from pathlib import Path
from typing import List, Optional
from fastapi import HTTPException, UploadFile, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.models import Attachment, Comment, Decision, User, Role
from app.schemas import AttachmentResponse, UserResponse
from app.services.decision_service import get_decision

UPLOAD_DIR = os.getenv("UPLOAD_DIR", os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "uploads"))
os.makedirs(UPLOAD_DIR, exist_ok=True)

MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024  # 50 MB

def _sanitize_filename(filename: str) -> str:
    """Sanitize original filename to prevent directory traversal or malicious names."""
    base_name = os.path.basename(filename)
    clean_name = re.sub(r'[^a-zA-Z0-9_.-]', '_', base_name)
    return clean_name or "uploaded_file"

def save_attachment(
    db: Session,
    decision_id: int,
    file: UploadFile,
    current_user: User,
    comment_id: Optional[int] = None
) -> Attachment:
    """
    Save uploaded file locally and store attachment metadata in the database.
    """
    decision = get_decision(db, decision_id)

    if comment_id:
        comment = db.query(Comment).filter(
            Comment.id == comment_id,
            Comment.decision_id == decision_id
        ).first()
        if not comment:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Associated comment with ID {comment_id} not found for this decision."
            )

    original_filename = file.filename or "file.bin"
    sanitized_name = _sanitize_filename(original_filename)
    unique_prefix = uuid.uuid4().hex[:12]
    stored_filename = f"{unique_prefix}_{sanitized_name}"
    file_path = os.path.join(UPLOAD_DIR, stored_filename)

    # Read and validate file content
    try:
        contents = file.file.read()
        file_size = len(contents)
        if file_size > MAX_FILE_SIZE_BYTES:
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail=f"File exceeds maximum allowed size of {MAX_FILE_SIZE_BYTES // (1024 * 1024)}MB"
            )

        with open(file_path, "wb") as f:
            f.write(contents)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to save file: {str(e)}"
        )

    mime_type = file.content_type or "application/octet-stream"

    attachment = Attachment(
        decision_id=decision.id,
        comment_id=comment_id,
        uploader_id=current_user.id,
        file_name=original_filename,
        file_path=file_path,
        file_size=file_size,
        mime_type=mime_type
    )
    db.add(attachment)
    db.commit()
    db.refresh(attachment)
    return attachment

def get_attachment(db: Session, decision_id: int, file_id: int) -> Attachment:
    """Fetch attachment metadata by ID with 404 validation."""
    attachment = db.query(Attachment).filter(
        Attachment.id == file_id,
        Attachment.decision_id == decision_id
    ).first()
    if not attachment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Attachment with ID {file_id} not found."
        )
    return attachment

def create_attachment_download_response(db: Session, decision_id: int, file_id: int) -> FileResponse:
    """Generate a streaming FileResponse for downloading the attachment safely."""
    attachment = get_attachment(db, decision_id, file_id)

    if not os.path.exists(attachment.file_path):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Physical file not found on disk."
        )

    return FileResponse(
        path=attachment.file_path,
        filename=attachment.file_name,
        media_type=attachment.mime_type
    )

def list_attachments(db: Session, decision_id: int) -> List[Attachment]:
    """List all attachments linked to a decision."""
    get_decision(db, decision_id)
    return db.query(Attachment).filter(
        Attachment.decision_id == decision_id
    ).order_by(Attachment.uploaded_at.desc()).all()

def delete_attachment(db: Session, decision_id: int, file_id: int, current_user: User) -> None:
    """Delete an attachment record and remove the file from storage."""
    attachment = get_attachment(db, decision_id, file_id)

    is_uploader = attachment.uploader_id == current_user.id
    is_admin_or_mgr = current_user.role in [Role.ADMINISTRATOR, Role.MANAGER]

    if not (is_uploader or is_admin_or_mgr):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to delete this file."
        )

    # Remove physical file if present
    if os.path.exists(attachment.file_path):
        try:
            os.remove(attachment.file_path)
        except Exception:
            pass

    db.delete(attachment)
    db.commit()

def to_attachment_response(att: Attachment) -> AttachmentResponse:
    """Convert Attachment ORM model to API response schema with download link."""
    uploader_resp = UserResponse.model_validate(att.uploader) if att.uploader else None
    return AttachmentResponse(
        id=att.id,
        decision_id=att.decision_id,
        comment_id=att.comment_id,
        uploader_id=att.uploader_id,
        uploader=uploader_resp,
        file_name=att.file_name,
        file_size=att.file_size,
        mime_type=att.mime_type,
        download_url=f"/api/v1/decisions/{att.decision_id}/attachments/{att.id}/download",
        uploaded_at=att.uploaded_at
    )
