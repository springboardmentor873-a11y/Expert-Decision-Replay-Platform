from datetime import datetime, UTC
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db
from app.core.exceptions import NotFoundError, ForbiddenError
from app.models.collaboration import Comment, Discussion, MeetingNote
from app.models.decision import Decision
from app.models.identity import Role, User, UserProfile
from app.schemas.collaboration import (
    CommentCreate,
    CommentOut,
    DiscussionCreate,
    DiscussionOut,
    MeetingNoteCreate,
    MeetingNoteOut,
    MeetingNoteUpdate,
)
from app.services.audit_service import log_audit

router = APIRouter(tags=["discussions & meeting notes"])


def build_comment_out(db: Session, c: Comment) -> CommentOut:
    author = db.scalar(select(User).where(User.id == c.author_id))
    profile = db.scalar(select(UserProfile).where(UserProfile.user_id == c.author_id)) if author else None
    author_name = profile.full_name if profile else (author.email if author else "Unknown")

    replies = db.scalars(
        select(Comment)
        .where(Comment.parent_id == c.id, Comment.deleted_at.is_(None))
        .order_by(Comment.created_at)
    ).all()
    reply_outs = [build_comment_out(db, r) for r in replies]

    return CommentOut(
        id=c.id,
        discussion_id=c.discussion_id,
        parent_id=c.parent_id,
        author_id=c.author_id,
        author_name=author_name,
        author_email=author.email if author else None,
        body=c.body,
        replies=reply_outs,
        created_at=c.created_at,
        updated_at=c.updated_at,
    )


@router.get("/decisions/{decision_id}/discussions", response_model=list[DiscussionOut])
def list_discussions(
    decision_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[DiscussionOut]:
    """List discussion threads for a decision with nested comments."""
    threads = db.scalars(
        select(Discussion)
        .where(Discussion.decision_id == decision_id, Discussion.deleted_at.is_(None))
        .order_by(Discussion.created_at.desc())
    ).all()

    results = []
    for d in threads:
        creator = db.scalar(select(User).where(User.id == d.created_by_id))
        c_prof = db.scalar(select(UserProfile).where(UserProfile.user_id == d.created_by_id)) if creator else None
        c_name = c_prof.full_name if c_prof else (creator.email if creator else "Unknown")

        top_comments = db.scalars(
            select(Comment)
            .where(Comment.discussion_id == d.id, Comment.parent_id.is_(None), Comment.deleted_at.is_(None))
            .order_by(Comment.created_at)
        ).all()
        c_outs = [build_comment_out(db, c) for c in top_comments]

        results.append(
            DiscussionOut(
                id=d.id,
                decision_id=d.decision_id,
                title=d.title,
                created_by_id=d.created_by_id,
                created_by_name=c_name,
                comments=c_outs,
                created_at=d.created_at,
                updated_at=d.updated_at,
            )
        )
    return results


@router.post("/decisions/{decision_id}/discussions", response_model=DiscussionOut, status_code=status.HTTP_201_CREATED)
def create_discussion(
    decision_id: UUID,
    data: DiscussionCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> DiscussionOut:
    """Create a new discussion thread."""
    decision = db.scalar(select(Decision).where(Decision.id == decision_id, Decision.deleted_at.is_(None)))
    if not decision:
        raise NotFoundError(message="Decision not found.")

    disc = Discussion(
        decision_id=decision_id,
        title=data.title.strip(),
        created_by_id=current_user.id,
    )
    db.add(disc)
    db.flush()

    comment_outs = []
    if data.initial_comment:
        comm = Comment(
            discussion_id=disc.id,
            author_id=current_user.id,
            body=data.initial_comment.strip(),
        )
        db.add(comm)
        db.flush()
        comment_outs.append(build_comment_out(db, comm))

    log_audit(
        db=db,
        action="discussion_create",
        entity_type="discussion",
        entity_id=disc.id,
        actor_id=current_user.id,
        decision_id=decision_id,
    )
    db.commit()
    db.refresh(disc)

    profile = db.scalar(select(UserProfile).where(UserProfile.user_id == current_user.id))
    return DiscussionOut(
        id=disc.id,
        decision_id=disc.decision_id,
        title=disc.title,
        created_by_id=disc.created_by_id,
        created_by_name=profile.full_name if profile else current_user.email,
        comments=comment_outs,
        created_at=disc.created_at,
        updated_at=disc.updated_at,
    )


@router.post("/discussions/{discussion_id}/comments", response_model=CommentOut, status_code=status.HTTP_201_CREATED)
def add_comment(
    discussion_id: UUID,
    data: CommentCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> CommentOut:
    """Add a comment or reply to a discussion thread."""
    disc = db.scalar(select(Discussion).where(Discussion.id == discussion_id, Discussion.deleted_at.is_(None)))
    if not disc:
        raise NotFoundError(message="Discussion not found.")

    comm = Comment(
        discussion_id=discussion_id,
        parent_id=data.parent_id,
        author_id=current_user.id,
        body=data.body.strip(),
    )
    db.add(comm)
    db.flush()

    log_audit(
        db=db,
        action="comment_add",
        entity_type="comment",
        entity_id=comm.id,
        actor_id=current_user.id,
        decision_id=disc.decision_id,
    )
    db.commit()
    db.refresh(comm)

    return build_comment_out(db, comm)


@router.delete("/comments/{comment_id}")
def delete_comment(
    comment_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict:
    """Soft delete a comment."""
    comm = db.scalar(select(Comment).where(Comment.id == comment_id, Comment.deleted_at.is_(None)))
    if not comm:
        raise NotFoundError(message="Comment not found.")

    user_role = db.scalar(select(Role).where(Role.id == current_user.role_id))
    is_admin = user_role and user_role.code == "administrator"
    if comm.author_id != current_user.id and not is_admin:
        raise ForbiddenError(message="You can only delete your own comments.")

    comm.deleted_at = datetime.now(UTC)
    db.commit()
    return {"status": "ok", "message": "Comment deleted."}


# ---------------- MEETING NOTES ----------------

@router.get("/decisions/{decision_id}/meeting-notes", response_model=list[MeetingNoteOut])
def list_meeting_notes(
    decision_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[MeetingNoteOut]:
    """List meeting notes for a decision."""
    notes = db.scalars(
        select(MeetingNote)
        .where(MeetingNote.decision_id == decision_id, MeetingNote.deleted_at.is_(None))
        .order_by(MeetingNote.occurred_at.desc())
    ).all()
    results = []
    for n in notes:
        rec = db.scalar(select(User).where(User.id == n.recorded_by_id))
        prof = db.scalar(select(UserProfile).where(UserProfile.user_id == n.recorded_by_id)) if rec else None
        rec_name = prof.full_name if prof else (rec.email if rec else "Unknown")
        results.append(
            MeetingNoteOut(
                id=n.id,
                decision_id=n.decision_id,
                title=n.title,
                body=n.body,
                occurred_at=n.occurred_at,
                recorded_by_id=n.recorded_by_id,
                recorded_by_name=rec_name,
                created_at=n.created_at,
                updated_at=n.updated_at,
            )
        )
    return results


@router.post("/decisions/{decision_id}/meeting-notes", response_model=MeetingNoteOut, status_code=status.HTTP_201_CREATED)
def add_meeting_note(
    decision_id: UUID,
    data: MeetingNoteCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> MeetingNoteOut:
    """Record notes from a decision-making stakeholder meeting."""
    decision = db.scalar(select(Decision).where(Decision.id == decision_id, Decision.deleted_at.is_(None)))
    if not decision:
        raise NotFoundError(message="Decision not found.")

    note = MeetingNote(
        decision_id=decision_id,
        title=data.title.strip(),
        body=data.body.strip(),
        occurred_at=data.occurred_at,
        recorded_by_id=current_user.id,
    )
    db.add(note)
    db.flush()

    log_audit(
        db=db,
        action="meeting_note_create",
        entity_type="meeting_note",
        entity_id=note.id,
        actor_id=current_user.id,
        decision_id=decision_id,
    )
    db.commit()
    db.refresh(note)

    profile = db.scalar(select(UserProfile).where(UserProfile.user_id == current_user.id))
    return MeetingNoteOut(
        id=note.id,
        decision_id=note.decision_id,
        title=note.title,
        body=note.body,
        occurred_at=note.occurred_at,
        recorded_by_id=note.recorded_by_id,
        recorded_by_name=profile.full_name if profile else current_user.email,
        created_at=note.created_at,
        updated_at=note.updated_at,
    )


@router.delete("/meeting-notes/{note_id}")
def delete_meeting_note(
    note_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict:
    """Soft delete a meeting note."""
    note = db.scalar(select(MeetingNote).where(MeetingNote.id == note_id, MeetingNote.deleted_at.is_(None)))
    if not note:
        raise NotFoundError(message="Meeting note not found.")

    note.deleted_at = datetime.now(UTC)
    db.commit()
    return {"status": "ok", "message": "Meeting note deleted."}
