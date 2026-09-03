"""
Handles where uploaded files actually live on disk.

Kept isolated so that switching to S3/MinIO later (per the architecture
plan) only means rewriting this one file — no router or model changes.
"""
import uuid
from pathlib import Path

from fastapi import HTTPException, UploadFile, status

from app.core.config import settings

ALLOWED_CONTENT_TYPES = {
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "image/png",
    "image/jpeg",
    "text/csv",
    "text/plain",
}


def _decision_dir(decision_id: uuid.UUID) -> Path:
    directory = Path(settings.STORAGE_DIR) / str(decision_id)
    directory.mkdir(parents=True, exist_ok=True)
    return directory


async def save_upload(decision_id: uuid.UUID, upload: UploadFile) -> dict:
    """
    Streams the upload to disk in chunks (so a large file doesn't get
    loaded entirely into memory), enforcing type and size limits as it
    goes. Returns the info needed to create the Attachment database row.
    """
    if upload.content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail=f"File type '{upload.content_type}' isn't allowed.",
        )

    max_bytes = settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024
    # Never trust the browser-supplied filename as a real path — generate
    # our own on-disk name and keep the original only for display.
    stored_name = f"{uuid.uuid4()}_{Path(upload.filename or 'file').name}"
    destination = _decision_dir(decision_id) / stored_name

    size = 0
    with destination.open("wb") as f:
        while chunk := await upload.read(1024 * 1024):
            size += len(chunk)
            if size > max_bytes:
                f.close()
                destination.unlink(missing_ok=True)
                raise HTTPException(
                    status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                    detail=f"File exceeds the {settings.MAX_UPLOAD_SIZE_MB}MB limit.",
                )
            f.write(chunk)

    return {
        "filename": upload.filename or stored_name,
        "stored_path": str(destination),
        "content_type": upload.content_type,
        "size_bytes": size,
    }


def delete_file(stored_path: str) -> None:
    Path(stored_path).unlink(missing_ok=True)
