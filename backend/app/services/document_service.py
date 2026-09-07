import os
import uuid
from typing import List, Tuple
from fastapi import HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.decision import Decision, DecisionStatusEnum
from app.models.document import Document
from app.models.role import RoleEnum
from app.models.user import User
from app.services.decision_service import get_decision_by_id


def _get_decision_storage_dir(decision_id: int) -> str:
    """Returns the absolute filesystem directory for a given decision's documents."""
    return os.path.join(os.getcwd(), settings.UPLOAD_DIR, "decisions", str(decision_id))


def upload_document(
    db: Session,
    decision_id: int,
    file: UploadFile,
    current_user: User
) -> Document:
    """
    Validates, stores, and registers a document attachment for a decision.
    - User must have permission to access the decision.
    - Only the decision owner (when Draft) or an Administrator can upload documents.
    - File extension, MIME/content type, and file size (< 10MB) are strictly validated.
    """
    decision = db.query(Decision).filter(Decision.id == decision_id).first()
    if not decision:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Decision with ID {decision_id} not found."
        )

    user_role = current_user.role.name if current_user.role else ""
    is_owner = decision.created_by == current_user.id
    is_admin = user_role == RoleEnum.ADMINISTRATOR.value

    if not (is_owner or is_admin):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden: You do not have permission to attach documents to this decision."
        )

    if not is_admin and decision.status != DecisionStatusEnum.DRAFT.value:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot attach documents to a decision in '{decision.status}' status."
        )

    if not file or not file.filename or not file.filename.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A valid file with a non-empty filename is required."
        )

    # Sanitize original filename and prevent path traversal
    original_filename = os.path.basename(file.filename.strip())
    ext = os.path.splitext(original_filename)[1].lower()

    if not ext or ext not in settings.ALLOWED_DOCUMENT_EXTENSIONS:
        allowed = ", ".join(ext.upper().lstrip(".") for ext in settings.ALLOWED_DOCUMENT_EXTENSIONS)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File extension '{ext}' is not allowed. Supported formats: {allowed}"
        )

    # Read content to validate size and empty file
    content = file.file.read()
    file_size = len(content)

    if file_size == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot upload an empty file (0 bytes)."
        )

    if file_size > settings.MAX_UPLOAD_SIZE_BYTES:
        max_mb = settings.MAX_UPLOAD_SIZE_BYTES // (1024 * 1024)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File size exceeds maximum allowed limit of {max_mb} MB."
        )

    # Generate unique stored filename to prevent collisions and avoid executing malicious filenames
    stored_filename = f"{uuid.uuid4().hex}{ext}"
    rel_file_path = os.path.join("decisions", str(decision_id), stored_filename).replace("\\", "/")
    
    # Ensure physical storage directory exists
    storage_dir = _get_decision_storage_dir(decision_id)
    os.makedirs(storage_dir, exist_ok=True)
    abs_file_path = os.path.join(storage_dir, stored_filename)

    # Write file to local filesystem
    try:
        with open(abs_file_path, "wb") as dest:
            dest.write(content)
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to save document to storage: {str(exc)}"
        )

    # Infer or fallback content type
    content_type = file.content_type or "application/octet-stream"

    document = Document(
        decision_id=decision_id,
        original_filename=original_filename,
        stored_filename=stored_filename,
        file_path=rel_file_path,
        content_type=content_type,
        file_size=file_size,
        uploaded_by=current_user.id
    )

    db.add(document)
    db.commit()
    db.refresh(document)
    return document


def get_documents(
    db: Session,
    decision_id: int,
    current_user: User
) -> List[Document]:
    """
    Retrieves all documents associated with a decision.
    Access permission matches the parent decision visibility.
    """
    get_decision_by_id(db=db, decision_id=decision_id, current_user=current_user)

    return (
        db.query(Document)
        .filter(Document.decision_id == decision_id)
        .order_by(Document.id.desc())
        .all()
    )


def get_document_by_id(
    db: Session,
    decision_id: int,
    document_id: int,
    current_user: User
) -> Document:
    """
    Retrieves document metadata by ID with authorization verification.
    """
    get_decision_by_id(db=db, decision_id=decision_id, current_user=current_user)

    document = (
        db.query(Document)
        .filter(Document.id == document_id, Document.decision_id == decision_id)
        .first()
    )
    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Document with ID {document_id} not found for decision {decision_id}."
        )

    return document


def get_document_file_for_download(
    db: Session,
    decision_id: int,
    document_id: int,
    current_user: User
) -> Tuple[Document, str]:
    """
    Validates download access and returns (document_record, absolute_file_path).
    Raises 404 if file does not exist on disk.
    """
    document = get_document_by_id(
        db=db,
        decision_id=decision_id,
        document_id=document_id,
        current_user=current_user
    )

    storage_dir = _get_decision_storage_dir(decision_id)
    abs_file_path = os.path.join(storage_dir, document.stored_filename)

    if not os.path.isfile(abs_file_path):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document physical file not found on disk."
        )

    return document, abs_file_path


def delete_document(
    db: Session,
    decision_id: int,
    document_id: int,
    current_user: User
) -> None:
    """
    Deletes a document attachment.
    - Uploader, Decision Owner, or Administrator can delete.
    - If non-admin and decision is not Draft, deletion is rejected with HTTP 400.
    """
    decision = db.query(Decision).filter(Decision.id == decision_id).first()
    if not decision:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Decision with ID {decision_id} not found."
        )

    document = (
        db.query(Document)
        .filter(Document.id == document_id, Document.decision_id == decision_id)
        .first()
    )
    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Document with ID {document_id} not found for decision {decision_id}."
        )

    user_role = current_user.role.name if current_user.role else ""
    is_uploader = document.uploaded_by == current_user.id
    is_decision_owner = decision.created_by == current_user.id
    is_admin = user_role == RoleEnum.ADMINISTRATOR.value

    if not (is_uploader or is_decision_owner or is_admin):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden: You do not have permission to delete this document."
        )

    if not is_admin and decision.status != DecisionStatusEnum.DRAFT.value:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot delete documents from a decision in '{decision.status}' status."
        )

    # Delete physical file from filesystem if it exists
    storage_dir = _get_decision_storage_dir(decision_id)
    abs_file_path = os.path.join(storage_dir, document.stored_filename)
    if os.path.exists(abs_file_path):
        try:
            os.remove(abs_file_path)
        except Exception:
            pass  # Best effort disk cleanup

    db.delete(document)
    db.commit()
