from datetime import datetime, UTC
from uuid import UUID
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from fastapi.responses import FileResponse
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db
from app.core.exceptions import NotFoundError, ForbiddenError
from app.models.collaboration import Attachment
from app.models.decision import Decision
from app.models.identity import Role, User, UserProfile
from app.schemas.attachment import AttachmentOut
from app.services.audit_service import log_audit
from app.services.file_service import get_attachment_file_path, save_attachment

router = APIRouter(tags=["attachments & files"])


@router.post("/decisions/{decision_id}/attachments", response_model=AttachmentOut, status_code=status.HTTP_201_CREATED)
def upload_file_attachment(
    decision_id: UUID,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> AttachmentOut:
    """Upload a supporting file or document for a decision."""
    decision = db.scalar(select(Decision).where(Decision.id == decision_id, Decision.deleted_at.is_(None)))
    if not decision:
        raise NotFoundError(message="Decision not found.")

    att = save_attachment(db=db, decision_id=decision_id, user_id=current_user.id, file=file)
    db.commit()
    db.refresh(att)

    profile = db.scalar(select(UserProfile).where(UserProfile.user_id == current_user.id))
    return AttachmentOut(
        id=att.id,
        decision_id=att.decision_id,
        uploaded_by_id=att.uploaded_by_id,
        uploaded_by_name=profile.full_name if profile else current_user.email,
        file_name=att.file_name,
        content_type=att.content_type,
        byte_size=att.byte_size,
        storage_backend=att.storage_backend,
        created_at=att.created_at,
    )


@router.get("/decisions/{decision_id}/attachments", response_model=list[AttachmentOut])
def list_attachments(
    decision_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[AttachmentOut]:
    """List all attachments uploaded to a decision."""
    attachments = db.scalars(
        select(Attachment)
        .where(Attachment.decision_id == decision_id, Attachment.deleted_at.is_(None))
        .order_by(Attachment.created_at.desc())
    ).all()
    results = []
    for a in attachments:
        uploader = db.scalar(select(User).where(User.id == a.uploaded_by_id))
        prof = db.scalar(select(UserProfile).where(UserProfile.user_id == a.uploaded_by_id)) if uploader else None
        up_name = prof.full_name if prof else (uploader.email if uploader else "Unknown")
        results.append(
            AttachmentOut(
                id=a.id,
                decision_id=a.decision_id,
                uploaded_by_id=a.uploaded_by_id,
                uploaded_by_name=up_name,
                file_name=a.file_name,
                content_type=a.content_type,
                byte_size=a.byte_size,
                storage_backend=a.storage_backend,
                created_at=a.created_at,
            )
        )
    return results


@router.get("/attachments/{attachment_id}/download")
def download_attachment(
    attachment_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Download an attachment file with authentic filename and content headers."""
    att = db.scalar(select(Attachment).where(Attachment.id == attachment_id, Attachment.deleted_at.is_(None)))
    if not att:
        raise NotFoundError(message="Attachment not found.")

    file_path = get_attachment_file_path(att)
    return FileResponse(
        path=str(file_path),
        filename=att.file_name,
        media_type=att.content_type,
    )


@router.delete("/attachments/{attachment_id}")
def delete_attachment(
    attachment_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict:
    """Soft delete an attachment."""
    att = db.scalar(select(Attachment).where(Attachment.id == attachment_id, Attachment.deleted_at.is_(None)))
    if not att:
        raise NotFoundError(message="Attachment not found.")

    user_role = db.scalar(select(Role).where(Role.id == current_user.role_id))
    is_admin = user_role and user_role.code == "administrator"
    if att.uploaded_by_id != current_user.id and not is_admin:
        raise ForbiddenError(message="You can only delete your own attachments.")

    att.deleted_at = datetime.now(UTC)
    log_audit(
        db=db,
        action="attachment_delete",
        entity_type="attachment",
        entity_id=att.id,
        actor_id=current_user.id,
        decision_id=att.decision_id,
        extra={"file_name": att.file_name},
    )
    db.commit()
    return {"status": "ok", "message": "Attachment deleted."}
