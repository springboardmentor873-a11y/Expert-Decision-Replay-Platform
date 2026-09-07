import os
import uuid

from fastapi import APIRouter
from fastapi import Depends
from fastapi import File
from fastapi import HTTPException
from fastapi import UploadFile

from fastapi.responses import FileResponse

from sqlalchemy.orm import Session

from datetime import datetime

from app.database import get_db
from app.models import Decision
from app.models import DecisionDocument
from app.auth import get_current_user
from app.routes.decisions import record_version


# ==========================================
# ROUTER
# ==========================================

router = APIRouter(
    tags=["Decision Documents"]
)


# ==========================================
# CONFIG
# ==========================================

ALLOWED_EXTENSIONS = {
    ".pdf",
    ".png",
    ".jpg",
    ".jpeg",
    ".gif",
    ".webp",
    ".svg",
    ".bmp",
    ".txt",
    ".md",
    ".csv",
    ".xls",
    ".xlsx",
    ".doc",
    ".docx",
    ".ppt",
    ".pptx",
    ".zip",
    ".json",
    ".xml",
    ".log"
}

MAX_FILE_SIZE = 15 * 1024 * 1024


# ==========================================
# UPLOAD DIRECTORY
# ==========================================

UPLOAD_DIR = os.path.join(
    os.path.dirname(
        os.path.dirname(
            os.path.dirname(
                os.path.dirname(
                    os.path.abspath(__file__)
                )
            )
        )
    ),
    "uploads"
)


# ==========================================
# HELPER: GET DECISION OR 404
# ==========================================

def get_decision_or_404(
    db: Session,
    decision_id: int
):

    decision = (
        db.query(Decision)
        .filter(
            Decision.decision_id == decision_id
        )
        .first()
    )

    if not decision:

        raise HTTPException(
            status_code=404,
            detail="Decision not found"
        )

    return decision


# ==========================================
# HELPER: GET DOCUMENT OR 404
# ==========================================

def get_document_or_404(
    db: Session,
    document_id: int
):

    document = (
        db.query(DecisionDocument)
        .filter(
            DecisionDocument.document_id == document_id
        )
        .first()
    )

    if not document:

        raise HTTPException(
            status_code=404,
            detail="Document not found"
        )

    return document


# ==========================================
# HELPER: DOCUMENT DICT
# ==========================================

def document_dict(document):

    return {
        "document_id": document.document_id,
        "decision_id": document.decision_id,
        "uploaded_by": document.uploaded_by,
        "uploaded_by_name": (
            document.uploader.name
            if document.uploader
            else None
        ),
        "original_file_name": document.original_file_name,
        "file_type": document.file_type,
        "file_size": document.file_size,
        "uploaded_at": document.uploaded_at
    }


# ==========================================
# SANITIZE FILE NAME
# ==========================================

def sanitize_file_name(file_name):

    name = os.path.basename(
        (file_name or "").replace("\\", "/")
    )

    name = "".join(
        ch for ch in name
        if ch not in "\x00\r\n\t"
    ).strip()

    return name[:255]


# ==========================================
# UPLOAD DOCUMENT
# ==========================================

@router.post(
    "/decisions/{decision_id}/documents"
)
async def upload_document(
    decision_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):

    decision = get_decision_or_404(db, decision_id)

    original_name = sanitize_file_name(file.filename)

    if not original_name:

        raise HTTPException(
            status_code=422,
            detail="File name is empty"
        )

    ext = os.path.splitext(original_name)[1].lower()

    if ext not in ALLOWED_EXTENSIONS:

        raise HTTPException(
            status_code=422,
            detail=(
                "File type not allowed. Supported types: "
                + ", ".join(
                    sorted(ALLOWED_EXTENSIONS)
                )
            )
        )

    os.makedirs(UPLOAD_DIR, exist_ok=True)

    stored_name = f"{uuid.uuid4().hex}{ext}"

    stored_path = os.path.join(UPLOAD_DIR, stored_name)

    file_type = (
        file.content_type
        or ext.lstrip(".").upper()
        or "Unknown"
    )

    file_size = 0

    try:

        with open(stored_path, "wb") as out_file:

            while True:

                chunk = await file.read(1024 * 1024)

                if not chunk:
                    break

                file_size += len(chunk)

                if file_size > MAX_FILE_SIZE:

                    out_file.close()

                    if os.path.exists(stored_path):
                        os.remove(stored_path)

                    raise HTTPException(
                        status_code=413,
                        detail=(
                            "File too large. "
                            "Maximum allowed size is 15 MB"
                        )
                    )

                out_file.write(chunk)

    finally:

        await file.close()

    now = datetime.utcnow()

    document = DecisionDocument(
        decision_id=decision_id,
        uploaded_by=current_user.user_id,
        file_name=stored_name,
        original_file_name=original_name,
        file_path=stored_path,
        file_type=file_type,
        file_size=file_size,
        uploaded_at=now
    )

    db.add(document)

    record_version(
        db,
        decision,
        current_user,
        f"Document uploaded: {original_name}"
    )

    try:

        db.commit()

    except Exception:

        db.rollback()

        if os.path.exists(stored_path):

            try:

                os.remove(stored_path)

            except OSError:

                pass

        raise

    db.refresh(document)

    return document_dict(document)


# ==========================================
# LIST DOCUMENTS
# ==========================================

@router.get(
    "/decisions/{decision_id}/documents"
)
def get_documents(
    decision_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):

    get_decision_or_404(db, decision_id)

    documents = (
        db.query(DecisionDocument)
        .filter(
            DecisionDocument.decision_id == decision_id
        )
        .order_by(
            DecisionDocument.uploaded_at.desc(),
            DecisionDocument.document_id.desc()
        )
        .all()
    )

    return [
        document_dict(d)
        for d in documents
    ]


# ==========================================
# DOWNLOAD DOCUMENT
# ==========================================

@router.get(
    "/documents/{document_id}/download"
)
def download_document(
    document_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):

    document = get_document_or_404(db, document_id)

    if not os.path.exists(document.file_path):

        raise HTTPException(
            status_code=404,
            detail="File not found on server"
        )

    return FileResponse(
        document.file_path,
        filename=document.original_file_name,
        media_type=(
            document.file_type
            or "application/octet-stream"
        )
    )


# ==========================================
# CAN MANAGE DOCUMENT
# ==========================================

def can_manage_document(
    decision: Decision,
    document: DecisionDocument,
    current_user
):

    return True


# ==========================================
# DELETE DOCUMENT
# ==========================================

@router.delete("/documents/{document_id}")
def delete_document(
    document_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):

    document = get_document_or_404(db, document_id)

    decision = get_decision_or_404(
        db,
        document.decision_id
    )

    if not can_manage_document(
        decision,
        document,
        current_user
    ):

        raise HTTPException(
            status_code=403,
            detail=(
                "You do not have permission to delete "
                "this document"
            )
        )

    if os.path.exists(document.file_path):

        try:

            os.remove(document.file_path)

        except OSError:

            pass

    original_name = document.original_file_name

    db.delete(document)

    record_version(
        db,
        decision,
        current_user,
        f"Document deleted: {original_name}"
    )

    db.commit()

    return {
        "message": "Document deleted successfully",
        "document_id": document_id
    }