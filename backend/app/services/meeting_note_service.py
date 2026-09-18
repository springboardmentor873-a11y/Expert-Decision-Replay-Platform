from datetime import datetime, timezone
from typing import List
from sqlalchemy.orm import Session, joinedload
from fastapi import HTTPException, status

from app.models.meeting_note import MeetingNote
from app.models.decision import Decision
from app.models.role import RoleEnum
from app.models.user import User
from app.models.audit_log import AuditActionEnum
from app.schemas.meeting_note import MeetingNoteCreateRequest, MeetingNoteUpdateRequest
from app.services.audit_service import create_audit_log


def get_notes_for_decision(db: Session, decision_id: int, current_user: User) -> List[dict]:
    decision = db.query(Decision).filter(Decision.id == decision_id).first()
    if not decision:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Decision #{decision_id} not found.")

    notes = db.query(MeetingNote).options(joinedload(MeetingNote.author)).filter(
        MeetingNote.decision_id == decision_id
    ).order_by(MeetingNote.meeting_date.desc(), MeetingNote.created_at.desc()).all()

    results = []
    for n in notes:
        results.append({
            "id": n.id,
            "decision_id": n.decision_id,
            "title": n.title,
            "notes": n.notes,
            "meeting_date": n.meeting_date,
            "created_by": n.created_by,
            "author_name": n.author.full_name if n.author else None,
            "author_email": n.author.email if n.author else None,
            "created_at": n.created_at,
            "updated_at": n.updated_at,
        })
    return results


def create_meeting_note(db: Session, decision_id: int, note_in: MeetingNoteCreateRequest, current_user: User) -> dict:
    decision = db.query(Decision).filter(Decision.id == decision_id).first()
    if not decision:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Decision #{decision_id} not found.")

    meeting_date = note_in.meeting_date or datetime.now(timezone.utc)

    note = MeetingNote(
        decision_id=decision_id,
        title=note_in.title.strip(),
        notes=note_in.notes.strip(),
        meeting_date=meeting_date,
        created_by=current_user.id
    )
    db.add(note)
    db.commit()
    db.refresh(note)

    create_audit_log(
        db=db,
        user_id=current_user.id,
        action=AuditActionEnum.MEETING_NOTE_CREATED.value,
        entity_type="MeetingNote",
        entity_id=note.id,
        description=f"User '{current_user.full_name}' created meeting note '{note.title}' for decision #{decision_id}."
    )

    return {
        "id": note.id,
        "decision_id": note.decision_id,
        "title": note.title,
        "notes": note.notes,
        "meeting_date": note.meeting_date,
        "created_by": note.created_by,
        "author_name": current_user.full_name,
        "author_email": current_user.email,
        "created_at": note.created_at,
        "updated_at": note.updated_at,
    }


def update_meeting_note(db: Session, decision_id: int, note_id: int, note_in: MeetingNoteUpdateRequest, current_user: User) -> dict:
    note = db.query(MeetingNote).options(joinedload(MeetingNote.author)).filter(
        MeetingNote.id == note_id,
        MeetingNote.decision_id == decision_id
    ).first()
    if not note:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Meeting note not found.")

    role_name = current_user.role.name if current_user.role else ""
    is_admin_or_mgr = role_name in (RoleEnum.ADMINISTRATOR.value, RoleEnum.MANAGER.value)
    if note.created_by != current_user.id and not is_admin_or_mgr:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You do not have permission to edit this meeting note.")

    if note_in.title is not None:
        note.title = note_in.title.strip()
    if note_in.notes is not None:
        note.notes = note_in.notes.strip()
    if note_in.meeting_date is not None:
        note.meeting_date = note_in.meeting_date

    db.commit()
    db.refresh(note)

    create_audit_log(
        db=db,
        user_id=current_user.id,
        action=AuditActionEnum.MEETING_NOTE_UPDATED.value,
        entity_type="MeetingNote",
        entity_id=note.id,
        description=f"User '{current_user.full_name}' updated meeting note #{note.id} for decision #{decision_id}."
    )

    return {
        "id": note.id,
        "decision_id": note.decision_id,
        "title": note.title,
        "notes": note.notes,
        "meeting_date": note.meeting_date,
        "created_by": note.created_by,
        "author_name": note.author.full_name if note.author else current_user.full_name,
        "author_email": note.author.email if note.author else current_user.email,
        "created_at": note.created_at,
        "updated_at": note.updated_at,
    }


def delete_meeting_note(db: Session, decision_id: int, note_id: int, current_user: User) -> None:
    note = db.query(MeetingNote).filter(
        MeetingNote.id == note_id,
        MeetingNote.decision_id == decision_id
    ).first()
    if not note:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Meeting note not found.")

    role_name = current_user.role.name if current_user.role else ""
    is_admin_or_mgr = role_name in (RoleEnum.ADMINISTRATOR.value, RoleEnum.MANAGER.value)
    if note.created_by != current_user.id and not is_admin_or_mgr:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You do not have permission to delete this meeting note.")

    note_title = note.title
    db.delete(note)
    db.commit()

    create_audit_log(
        db=db,
        user_id=current_user.id,
        action=AuditActionEnum.MEETING_NOTE_DELETED.value,
        entity_type="MeetingNote",
        entity_id=note_id,
        description=f"User '{current_user.full_name}' deleted meeting note '{note_title}' from decision #{decision_id}."
    )
