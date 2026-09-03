import uuid
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException, UploadFile, status
from fastapi.responses import FileResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.attachment import Attachment
from app.models.user import User
from app.schemas.attachment import AttachmentOut
from app.services.decision_service import ensure_can_edit, get_decision_or_404
from app.services.file_service import delete_file, save_upload

router = APIRouter(prefix="/api/v1/decisions/{decision_id}/attachments", tags=["attachments"])


async def _get_attachment_or_404(db: AsyncSession, decision_id: uuid.UUID, attachment_id: uuid.UUID) -> Attachment:
    result = await db.execute(
        select(Attachment).where(Attachment.id == attachment_id, Attachment.decision_id == decision_id)
    )
    attachment = result.scalar_one_or_none()
    if attachment is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Attachment not found.")
    return attachment


@router.post("", response_model=AttachmentOut, status_code=status.HTTP_201_CREATED)
async def upload_attachment(
    decision_id: uuid.UUID,
    file: UploadFile,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    decision = await get_decision_or_404(db, decision_id)
    ensure_can_edit(current_user, decision)

    file_info = await save_upload(decision_id, file)

    attachment = Attachment(decision_id=decision_id, uploaded_by=current_user.id, **file_info)
    db.add(attachment)
    await db.commit()
    await db.refresh(attachment)
    return attachment


@router.get("/{attachment_id}/download")
async def download_attachment(
    decision_id: uuid.UUID,
    attachment_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    attachment = await _get_attachment_or_404(db, decision_id, attachment_id)
    if not Path(attachment.stored_path).exists():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="File is missing from storage.")

    return FileResponse(
        path=attachment.stored_path,
        filename=attachment.filename,
        media_type=attachment.content_type or "application/octet-stream",
    )


@router.delete("/{attachment_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_attachment(
    decision_id: uuid.UUID,
    attachment_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    decision = await get_decision_or_404(db, decision_id)
    ensure_can_edit(current_user, decision)

    attachment = await _get_attachment_or_404(db, decision_id, attachment_id)
    delete_file(attachment.stored_path)
    await db.delete(attachment)
    await db.commit()
    return None
