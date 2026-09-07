from typing import List
from fastapi import APIRouter, Depends, File, UploadFile, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user
from app.database.database import get_db
from app.models.user import User
from app.schemas.document import DocumentResponse
from app.services.document_service import (
    delete_document,
    get_document_by_id,
    get_document_file_for_download,
    get_documents,
    upload_document,
)

router = APIRouter()


@router.post(
    "",
    response_model=DocumentResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Upload a supporting document for a decision"
)
def upload_decision_document(
    decision_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Uploads and attaches a supporting document/file to a decision.
    Only the decision owner (when Draft) or an Administrator can upload documents.
    """
    return upload_document(
        db=db,
        decision_id=decision_id,
        file=file,
        current_user=current_user
    )


@router.get(
    "",
    response_model=List[DocumentResponse],
    summary="List all documents for a decision"
)
def list_decision_documents(
    decision_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Retrieves all attached documents for a specific decision.
    Visibility matches the permissions of the parent decision.
    """
    return get_documents(
        db=db,
        decision_id=decision_id,
        current_user=current_user
    )


@router.get(
    "/{document_id}",
    response_model=DocumentResponse,
    summary="Get document details"
)
def get_single_document(
    decision_id: int,
    document_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Retrieves metadata for a specific document attachment.
    """
    return get_document_by_id(
        db=db,
        decision_id=decision_id,
        document_id=document_id,
        current_user=current_user
    )


@router.get(
    "/{document_id}/download",
    summary="Download a document attachment"
)
def download_decision_document(
    decision_id: int,
    document_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Streams and securely downloads the document file.
    Preserves original filename in the Content-Disposition header.
    """
    document, abs_file_path = get_document_file_for_download(
        db=db,
        decision_id=decision_id,
        document_id=document_id,
        current_user=current_user
    )

    return FileResponse(
        path=abs_file_path,
        media_type=document.content_type,
        filename=document.original_filename
    )


@router.delete(
    "/{document_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a document attachment"
)
def remove_decision_document(
    decision_id: int,
    document_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Deletes a document attachment and removes its stored file from disk.
    Allowed for Document Uploader, Decision Owner (in Draft status), or Administrator.
    """
    delete_document(
        db=db,
        decision_id=decision_id,
        document_id=document_id,
        current_user=current_user
    )
    return None
