from typing import List
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.models.user import User
from app.schemas.meeting_note import (
    MeetingNoteCreateRequest,
    MeetingNoteResponse,
    MeetingNoteUpdateRequest,
)
from app.core.dependencies import get_current_user
from app.services.meeting_note_service import (
    create_meeting_note,
    delete_meeting_note,
    get_notes_for_decision,
    update_meeting_note,
)

router = APIRouter(tags=["Meeting Notes"])


@router.get("/decisions/{decision_id}/meeting-notes", response_model=List[MeetingNoteResponse])
def list_meeting_notes(
    decision_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List all meeting notes attached to a decision."""
    return get_notes_for_decision(db, decision_id, current_user)


@router.post("/decisions/{decision_id}/meeting-notes", response_model=MeetingNoteResponse, status_code=status.HTTP_201_CREATED)
def add_meeting_note(
    decision_id: int,
    note_in: MeetingNoteCreateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Add a new meeting note to a decision."""
    return create_meeting_note(db, decision_id, note_in, current_user)


@router.patch("/decisions/{decision_id}/meeting-notes/{note_id}", response_model=MeetingNoteResponse)
def edit_meeting_note(
    decision_id: int,
    note_id: int,
    note_in: MeetingNoteUpdateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update a meeting note (Author or Admin/Manager)."""
    return update_meeting_note(db, decision_id, note_id, note_in, current_user)


@router.delete("/decisions/{decision_id}/meeting-notes/{note_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_meeting_note(
    decision_id: int,
    note_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete a meeting note (Author or Admin/Manager)."""
    delete_meeting_note(db, decision_id, note_id, current_user)
    return None

