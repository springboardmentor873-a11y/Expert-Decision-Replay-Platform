from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user
from app.db.database import get_db
from app.models.decision import Decision
from app.models.meeting_note import MeetingNote
from app.models.user import User
from app.services.activity_service import log_activity
from app.services.authorization import assert_can_access_decision


router = APIRouter(
    prefix="/decisions",
    tags=["Meeting Notes"]
)


class MeetingNoteCreate(BaseModel):
    content: str


class MeetingNoteResponse(BaseModel):
    id: int
    decision_id: int
    user_id: int
    content: str

    class Config:
        from_attributes = True


def _get_decision_or_404(db: Session, decision_id: int) -> Decision:
    decision = db.query(Decision).filter(Decision.id == decision_id).first()
    if not decision:
        raise HTTPException(status_code=404, detail="Decision not found")
    return decision


@router.post(
    "/{decision_id}/meeting-notes",
    response_model=MeetingNoteResponse,
    status_code=status.HTTP_201_CREATED
)
def create_meeting_note(
    decision_id: int,
    note_data: MeetingNoteCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    decision = _get_decision_or_404(db, decision_id)
    assert_can_access_decision(current_user, decision, db)

    note = MeetingNote(
        decision_id=decision_id,
        user_id=current_user.id,
        content=note_data.content
    )

    db.add(note)
    db.flush()

    log_activity(
        db=db,
        user_id=current_user.id,
        action="Meeting Note Added",
        entity_type="MeetingNote",
        entity_id=note.id,
        description=f"{current_user.full_name} added meeting notes to '{decision.title}'"
    )

    db.commit()
    db.refresh(note)

    return note


@router.get(
    "/{decision_id}/meeting-notes",
    response_model=list[MeetingNoteResponse]
)
def get_meeting_notes(
    decision_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    decision = _get_decision_or_404(db, decision_id)
    assert_can_access_decision(current_user, decision, db)

    return db.query(MeetingNote).filter(
        MeetingNote.decision_id == decision_id
    ).order_by(MeetingNote.created_at.asc()).all()
