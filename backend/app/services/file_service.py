import os
import re
from pathlib import Path
from uuid import UUID, uuid4
from fastapi import UploadFile, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.collaboration import Attachment
from app.services.audit_service import log_audit

MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024  # 25MB
ALLOWED_EXTENSIONS = {
    ".pdf", ".doc", ".docx", ".xls", ".xlsx", ".ppt", ".pptx",
    ".png", ".jpg", ".jpeg", ".svg", ".gif",
    ".txt", ".md", ".csv", ".json", ".zip"
}
STORAGE_DIR = Path("storage/uploads").resolve()
STORAGE_DIR.mkdir(parents=True, exist_ok=True)


def sanitize_filename(filename: str) -> str:
    """Sanitize the uploaded filename to prevent directory traversal and special character attacks."""
    clean = os.path.basename(filename)
    clean = re.sub(r'[^a-zA-Z0-9._-]', '_', clean)
    return clean or "unnamed_file"


def save_attachment(
    db: Session,
    decision_id: UUID,
    user_id: UUID,
    file: UploadFile,
) -> Attachment:
    """Validate, store, and record a new file attachment."""
    safe_name = sanitize_filename(file.filename or "file")
    ext = os.path.splitext(safe_name)[1].lower()

    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File extension '{ext}' is not permitted.",
        )

    # Read content to check size
    file_bytes = file.file.read()
    byte_size = len(file_bytes)

    if byte_size > MAX_FILE_SIZE_BYTES:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File exceeds maximum allowed size of 25MB.",
        )

    # Generate unique storage key
    unique_key = f"{uuid4()}_{safe_name}"
    target_path = STORAGE_DIR / unique_key

    with open(target_path, "wb") as f:
        f.write(file_bytes)

    attachment = Attachment(
        decision_id=decision_id,
        uploaded_by_id=user_id,
        file_name=safe_name,
        content_type=file.content_type or "application/octet-stream",
        byte_size=byte_size,
        storage_backend="local",
        storage_key=unique_key,
    )
    db.add(attachment)
    db.flush()

    log_audit(
        db=db,
        action="attachment_upload",
        entity_type="attachment",
        entity_id=attachment.id,
        actor_id=user_id,
        decision_id=decision_id,
        extra={"file_name": safe_name, "byte_size": byte_size},
    )

    return attachment


def get_attachment_file_path(attachment: Attachment) -> Path:
    """Resolve the physical filesystem path of an attachment."""
    target_path = STORAGE_DIR / attachment.storage_key
    if not target_path.exists():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Physical file not found on disk.",
        )
    return target_path
