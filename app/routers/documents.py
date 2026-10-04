import os
import uuid
from typing import List

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
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
from app.services.audit_service import log_audit
from app.services.activity_service import log_activity
from app.services.authorization import assert_can_access_decision


router = APIRouter(tags=["Documents"])

# Business-document types only — no executables, scripts, or archives.
ALLOWED_EXTENSIONS = {
    ".pdf", ".doc", ".docx", ".xls", ".xlsx", ".ppt", ".pptx",
    ".png", ".jpg", ".jpeg", ".txt", ".csv", ".md",
}


def _get_decision_or_404(db: Session, decision_id: int) -> Decision:
    decision = db.query(Decision).filter(Decision.id == decision_id).first()
    if not decision:
        raise HTTPException(status_code=404, detail="Decision not found")
    return decision


def _upload_root() -> str:
    root = os.path.abspath(settings.upload_dir)
    os.makedirs(root, exist_ok=True)
    return root


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

    original_name = file.filename or "upload"
    ext = os.path.splitext(original_name)[1].lower()

    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                f"File type '{ext}' is not allowed. Allowed types: "
                f"{', '.join(sorted(ALLOWED_EXTENSIONS))}"
            ),
        )

    max_bytes = settings.max_upload_size_mb * 1024 * 1024
    contents = await file.read()

    if len(contents) > max_bytes:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File exceeds the {settings.max_upload_size_mb}MB limit",
        )

    if len(contents) == 0:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="File is empty")

    stored_name = f"{uuid.uuid4().hex}{ext}"
    decision_folder = os.path.join(_upload_root(), str(decision_id))
    os.makedirs(decision_folder, exist_ok=True)
    stored_path = os.path.join(decision_folder, stored_name)

    with open(stored_path, "wb") as f:
        f.write(contents)

    document = Document(
        decision_id=decision_id,
        uploaded_by=current_user.id,
        filename=original_name,
        stored_path=stored_path,
        file_size=len(contents),
        content_type=file.content_type or "application/octet-stream",
    )
    db.add(document)
    db.flush()

    log_audit(
        db=db,
        user_id=current_user.id,
        action=AuditAction.CREATE,
        entity_type=AuditEntityType.DOCUMENT,
        entity_id=document.id,
        description=(
            f"User {current_user.id} uploaded document '{original_name}' "
            f"to Decision {decision_id}"
        ),
        request_method="POST",
        endpoint=f"/decisions/{decision_id}/documents",
    )

    log_activity(
        db=db,
        user_id=current_user.id,
        action="Document Uploaded",
        entity_type="Document",
        entity_id=document.id,
        description=f"{current_user.full_name} uploaded '{original_name}' to '{decision.title}'",
    )

    db.commit()
    db.refresh(document)

    return document


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


@router.get("/documents/mine", response_model=List[DocumentResponse])
def list_my_accessible_documents(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """All documents attached to any decision the current user can access."""
    from app.services.authorization import visible_decision_ids_filter

    decision_query = visible_decision_ids_filter(db.query(Decision.id), current_user, db)
    visible_ids = [row[0] for row in decision_query.all()]

    return (
        db.query(Document)
        .filter(Document.decision_id.in_(visible_ids))
        .order_by(Document.created_at.desc())
        .all()
    )


def _get_document_or_404(db: Session, document_id: int) -> Document:
    document = db.query(Document).filter(Document.id == document_id).first()
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    return document


@router.get("/documents/{document_id}/download")
def download_document(
    document_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    document = _get_document_or_404(db, document_id)
    decision = _get_decision_or_404(db, document.decision_id)
    assert_can_access_decision(current_user, decision, db)

    if not os.path.exists(document.stored_path):
        raise HTTPException(status_code=404, detail="File is missing from storage")

    return FileResponse(
        path=document.stored_path,
        filename=document.filename,
        media_type=document.content_type,
    )


@router.delete("/documents/{document_id}")
def delete_document(
    document_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    document = _get_document_or_404(db, document_id)
    decision = _get_decision_or_404(db, document.decision_id)
    assert_can_access_decision(current_user, decision, db)

    if document.uploaded_by != current_user.id and current_user.role not in (
        "Manager",
        "Administrator",
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the uploader, a Manager or an Administrator can delete this document",
        )

    log_audit(
        db=db,
        user_id=current_user.id,
        action=AuditAction.DELETE,
        entity_type=AuditEntityType.DOCUMENT,
        entity_id=document.id,
        description=f"User {current_user.id} deleted document '{document.filename}'",
        request_method="DELETE",
        endpoint=f"/documents/{document_id}",
    )

    log_activity(
        db=db,
        user_id=current_user.id,
        action="Document Deleted",
        entity_type="Document",
        entity_id=document.id,
        description=f"{current_user.full_name} deleted '{document.filename}' from '{decision.title}'",
    )

    if os.path.exists(document.stored_path):
        try:
            os.remove(document.stored_path)
        except OSError:
            pass

    db.delete(document)
    db.commit()

    return {"message": "Document deleted successfully"}
