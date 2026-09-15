"""
Documents router — file upload, listing, download, and deletion.

Authorization is enforced via assert_can_access_decision on every
endpoint. Delete is additionally restricted to the uploader, Managers
and Administrators.
"""
import os
import uuid
from pathlib import Path
from typing import List

from fastapi import (
    APIRouter,
    Depends,
    File,
    HTTPException,
    UploadFile,
    status,
)
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.dependencies import get_current_user
from app.db.database import get_db
from app.models.decision import Decision
from app.models.document import Document
from app.models.user import User
from app.schemas.audit_log import AuditAction, AuditEntityType
from app.schemas.document import DocumentResponse
from app.services.activity_service import log_activity
from app.services.audit_service import log_audit
from app.services.authorization import assert_can_access_decision

router = APIRouter(tags=["Documents"])

_MAX_SIZE_BYTES = settings.max_upload_size_mb * 1024 * 1024

_ALLOWED_CONTENT_TYPES = {
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.ms-powerpoint",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    "text/plain",
    "text/csv",
    "image/png",
    "image/jpeg",
    "image/gif",
    "image/webp",
}


def _get_decision_or_404(db: Session, decision_id: int) -> Decision:
    decision = db.query(Decision).filter(Decision.id == decision_id).first()
    if not decision:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Decision not found")
    return decision


# ------------------------------------------------------------------ #
# POST /decisions/{id}/documents                                       #
# ------------------------------------------------------------------ #
@router.post(
    "/decisions/{decision_id}/documents",
    response_model=DocumentResponse,
    status_code=status.HTTP_201_CREATED,
)
async def upload_document(
    decision_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    decision = _get_decision_or_404(db, decision_id)
    assert_can_access_decision(current_user, decision, db)

    # Validate content type
    if file.content_type not in _ALLOWED_CONTENT_TYPES:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail=(
                f"File type '{file.content_type}' is not allowed. "
                f"Accepted: PDF, Word, Excel, PowerPoint, plain text, CSV, images."
            ),
        )

    # Read and validate size
    contents = await file.read()
    if len(contents) > _MAX_SIZE_BYTES:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File exceeds the maximum allowed size of {settings.max_upload_size_mb} MB.",
        )

    # Store file
    upload_dir = Path(settings.upload_dir) / str(decision_id)
    upload_dir.mkdir(parents=True, exist_ok=True)
    stored_name = f"{uuid.uuid4().hex}_{file.filename}"
    stored_path = upload_dir / stored_name
    stored_path.write_bytes(contents)

    doc = Document(
        decision_id=decision_id,
        uploaded_by=current_user.id,
        filename=file.filename or stored_name,
        stored_path=str(stored_path),
        file_size=len(contents),
        content_type=file.content_type,
    )
    db.add(doc)
    db.flush()

    log_audit(
        db=db,
        user_id=current_user.id,
        action=AuditAction.CREATE,
        entity_type=AuditEntityType.DOCUMENT,
        entity_id=doc.id,
        description=f"Document '{doc.filename}' uploaded to decision '{decision.title}'",
        request_method="POST",
        endpoint=f"/decisions/{decision_id}/documents",
    )

    log_activity(
        db=db,
        user_id=current_user.id,
        action="Document Uploaded",
        entity_type="Document",
        entity_id=doc.id,
        description=(
            f"{current_user.full_name} uploaded '{doc.filename}' "
            f"to decision '{decision.title}'"
        ),
    )

    db.commit()
    db.refresh(doc)
    return doc


# ------------------------------------------------------------------ #
# GET /decisions/{id}/documents                                        #
# ------------------------------------------------------------------ #
@router.get(
    "/decisions/{decision_id}/documents",
    response_model=List[DocumentResponse],
)
def list_documents(
    decision_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    decision = _get_decision_or_404(db, decision_id)
    assert_can_access_decision(current_user, decision, db)

    return (
        db.query(Document)
        .filter(Document.decision_id == decision_id)
        .order_by(Document.created_at.desc())
        .all()
    )


# ------------------------------------------------------------------ #
# GET /documents/{id}/download                                         #
# ------------------------------------------------------------------ #
@router.get("/documents/{document_id}/download")
def download_document(
    document_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    doc = db.query(Document).filter(Document.id == document_id).first()
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")

    decision = _get_decision_or_404(db, doc.decision_id)
    assert_can_access_decision(current_user, decision, db)

    if not os.path.exists(doc.stored_path):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File not found on disk — it may have been removed.",
        )

    return FileResponse(
        path=doc.stored_path,
        media_type=doc.content_type,
        filename=doc.filename,
        headers={"Content-Disposition": f'attachment; filename="{doc.filename}"'},
    )


# ------------------------------------------------------------------ #
# DELETE /documents/{id}                                               #
# ------------------------------------------------------------------ #
@router.delete("/documents/{document_id}", status_code=status.HTTP_200_OK)
def delete_document(
    document_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    doc = db.query(Document).filter(Document.id == document_id).first()
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")

    decision = _get_decision_or_404(db, doc.decision_id)
    assert_can_access_decision(current_user, decision, db)

    if (
        doc.uploaded_by != current_user.id
        and current_user.role not in ("Manager", "Administrator")
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the uploader, a Manager, or an Administrator can delete this document.",
        )

    log_audit(
        db=db,
        user_id=current_user.id,
        action=AuditAction.DELETE,
        entity_type=AuditEntityType.DOCUMENT,
        entity_id=doc.id,
        description=f"Document '{doc.filename}' deleted from decision '{decision.title}'",
        request_method="DELETE",
        endpoint=f"/documents/{document_id}",
    )

    log_activity(
        db=db,
        user_id=current_user.id,
        action="Document Deleted",
        entity_type="Document",
        entity_id=doc.id,
        description=(
            f"{current_user.full_name} deleted '{doc.filename}' "
            f"from decision '{decision.title}'"
        ),
    )

    # Remove from disk (best-effort)
    try:
        if os.path.exists(doc.stored_path):
            os.remove(doc.stored_path)
    except OSError:
        pass

    db.delete(doc)
    db.commit()

    return {"message": "Document deleted successfully"}
