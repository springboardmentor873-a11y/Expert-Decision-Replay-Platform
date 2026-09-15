import os
import shutil

from fastapi import (
    APIRouter,
    Depends,
    File as FastAPIFile,
    HTTPException,
    UploadFile
)
from fastapi.responses import FileResponse as FastAPIFileResponse
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Decision, DecisionFile, User
from app.schemas.file import FileResponse
from app.security.jwt import get_current_user

router = APIRouter(
    prefix="/decisions",
    tags=["Files"]
)


UPLOAD_DIR = "uploads"

os.makedirs(UPLOAD_DIR, exist_ok=True)


# --------------------------------------------------
# Upload File
# --------------------------------------------------

@router.post(
    "/{decision_id}/files/",
    response_model=FileResponse
)
def upload_file(
    decision_id: int,
    uploaded_file: UploadFile = FastAPIFile(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):

    # Check whether decision exists
    decision = (
        db.query(Decision)
        .filter(Decision.id == decision_id)
        .first()
    )

    if not decision:
        raise HTTPException(
            status_code=404,
            detail="Decision not found"
        )

    # Check file name
    if not uploaded_file.filename:
        raise HTTPException(
            status_code=400,
            detail="Invalid file name"
        )

    file_name = uploaded_file.filename

    # Create file path
    file_path = os.path.join(
        UPLOAD_DIR,
        file_name
    )

    # Save physical file
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(
            uploaded_file.file,
            buffer
        )

    # Save file information in database
    new_file = DecisionFile(
        decision_id=decision_id,
        file_name=file_name,
        file_path=file_path,
        file_type=uploaded_file.content_type
    )

    db.add(new_file)
    db.commit()
    db.refresh(new_file)

    return new_file


# --------------------------------------------------
# Get All Files for a Decision
# --------------------------------------------------

@router.get(
    "/{decision_id}/files/",
    response_model=list[FileResponse]
)
def get_decision_files(
    decision_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):

    # Check whether decision exists
    decision = (
        db.query(Decision)
        .filter(Decision.id == decision_id)
        .first()
    )

    if not decision:
        raise HTTPException(
            status_code=404,
            detail="Decision not found"
        )

    files = (
        db.query(DecisionFile)
        .filter(
            DecisionFile.decision_id == decision_id
        )
        .all()
    )

    return files


# --------------------------------------------------
# Get Single File Information
# --------------------------------------------------

@router.get(
    "/{decision_id}/files/{file_id}",
    response_model=FileResponse
)
def get_file(
    decision_id: int,
    file_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):

    file = (
        db.query(DecisionFile)
        .filter(
            DecisionFile.id == file_id,
            DecisionFile.decision_id == decision_id
        )
        .first()
    )

    if not file:
        raise HTTPException(
            status_code=404,
            detail="File not found"
        )

    return file

# --------------------------------------------------
# Download / View File
# --------------------------------------------------

@router.get(
    "/{decision_id}/files/{file_id}/download"
)
def download_file(
    decision_id: int,
    file_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):

    file = (
        db.query(DecisionFile)
        .filter(
            DecisionFile.id == file_id,
            DecisionFile.decision_id == decision_id
        )
        .first()
    )

    if not file:
        raise HTTPException(
            status_code=404,
            detail="File not found"
        )

    if not os.path.exists(file.file_path):
        raise HTTPException(
            status_code=404,
            detail="Physical file not found"
        )

    return FastAPIFileResponse(
        path=file.file_path,
        filename=file.file_name,
        media_type=file.file_type or "application/octet-stream"
    )


# --------------------------------------------------
# Delete File
# --------------------------------------------------

@router.delete(
    "/{decision_id}/files/{file_id}"
)
def delete_file(
    decision_id: int,
    file_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):

    file = (
        db.query(DecisionFile)
        .filter(
            DecisionFile.id == file_id,
            DecisionFile.decision_id == decision_id
        )
        .first()
    )

    if not file:
        raise HTTPException(
            status_code=404,
            detail="File not found"
        )

    # Delete physical file
    if os.path.exists(file.file_path):
        os.remove(file.file_path)

    # Delete database record
    db.delete(file)
    db.commit()

    return {
        "message": "File deleted successfully"
    }