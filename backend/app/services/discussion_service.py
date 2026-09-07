from typing import List, Optional
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.decision import Decision
from app.models.discussion import Discussion
from app.models.role import RoleEnum
from app.models.user import User
from app.services.decision_service import get_decision_by_id

MAX_CONTENT_LENGTH = 2000


def validate_content(content: str) -> str:
    """Validates discussion content: non-empty, non-whitespace, within max length."""
    if not content:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Comment content cannot be empty."
        )
    stripped = content.strip()
    if len(stripped) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Comment content cannot be empty or whitespace-only."
        )
    if len(stripped) > MAX_CONTENT_LENGTH:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Comment content exceeds maximum limit of {MAX_CONTENT_LENGTH} characters."
        )
    return stripped


def create_discussion(
    db: Session,
    decision_id: int,
    content: str,
    current_user: User,
    parent_id: Optional[int] = None
) -> Discussion:
    """
    Creates a new comment or reply associated with a decision.
    - User must have permission to view/access the parent decision.
    - Content is strictly validated for length and non-whitespace.
    - If parent_id is specified, validates that the parent discussion exists and belongs to the same decision.
    """
    # Enforces parent decision existence and user visibility authorization
    get_decision_by_id(db=db, decision_id=decision_id, current_user=current_user)

    cleaned_content = validate_content(content)

    if parent_id is not None:
        parent = (
            db.query(Discussion)
            .filter(Discussion.id == parent_id, Discussion.decision_id == decision_id)
            .first()
        )
        if not parent:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Parent discussion with ID {parent_id} not found in decision {decision_id}."
            )

    discussion = Discussion(
        decision_id=decision_id,
        user_id=current_user.id,
        parent_id=parent_id,
        content=cleaned_content
    )

    db.add(discussion)
    db.commit()
    db.refresh(discussion)
    return discussion


def get_discussions_for_decision(
    db: Session,
    decision_id: int,
    current_user: User
) -> List[Discussion]:
    """
    Retrieves top-level discussion comments for a decision with nested replies pre-loaded.
    Access permission matches parent decision visibility.
    """
    get_decision_by_id(db=db, decision_id=decision_id, current_user=current_user)

    return (
        db.query(Discussion)
        .filter(Discussion.decision_id == decision_id, Discussion.parent_id == None)
        .order_by(Discussion.created_at.asc())
        .all()
    )


def get_discussion_by_id(
    db: Session,
    decision_id: int,
    discussion_id: int,
    current_user: User
) -> Discussion:
    """
    Retrieves a single discussion comment by ID with authorization verification.
    """
    get_decision_by_id(db=db, decision_id=decision_id, current_user=current_user)

    discussion = (
        db.query(Discussion)
        .filter(Discussion.id == discussion_id, Discussion.decision_id == decision_id)
        .first()
    )
    if not discussion:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Discussion with ID {discussion_id} not found for decision {decision_id}."
        )

    return discussion


def update_discussion(
    db: Session,
    decision_id: int,
    discussion_id: int,
    content: str,
    current_user: User
) -> Discussion:
    """
    Updates an existing discussion comment.
    Only the original author can edit their comment.
    """
    get_decision_by_id(db=db, decision_id=decision_id, current_user=current_user)

    discussion = (
        db.query(Discussion)
        .filter(Discussion.id == discussion_id, Discussion.decision_id == decision_id)
        .first()
    )
    if not discussion:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Discussion with ID {discussion_id} not found for decision {decision_id}."
        )

    if discussion.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden: You can only edit your own comments."
        )

    cleaned_content = validate_content(content)
    discussion.content = cleaned_content

    db.commit()
    db.refresh(discussion)
    return discussion


def delete_discussion(
    db: Session,
    decision_id: int,
    discussion_id: int,
    current_user: User
) -> None:
    """
    Deletes a discussion comment and its child replies.
    Only the original author or an Administrator can delete comments.
    """
    get_decision_by_id(db=db, decision_id=decision_id, current_user=current_user)

    discussion = (
        db.query(Discussion)
        .filter(Discussion.id == discussion_id, Discussion.decision_id == decision_id)
        .first()
    )
    if not discussion:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Discussion with ID {discussion_id} not found for decision {decision_id}."
        )

    user_role = current_user.role.name if current_user.role else ""
    is_author = discussion.user_id == current_user.id
    is_admin = user_role == RoleEnum.ADMINISTRATOR.value

    if not (is_author or is_admin):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden: You do not have permission to delete this comment."
        )

    db.delete(discussion)
    db.commit()
