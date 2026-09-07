from typing import List
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user
from app.database.database import get_db
from app.models.user import User
from app.schemas.discussion import (
    DiscussionCreate,
    DiscussionResponse,
    DiscussionUpdate,
)
from app.services.discussion_service import (
    create_discussion,
    delete_discussion,
    get_discussion_by_id,
    get_discussions_for_decision,
    update_discussion,
)

router = APIRouter()


@router.post(
    "",
    response_model=DiscussionResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Post a new discussion comment on a decision"
)
def create_decision_discussion(
    decision_id: int,
    discussion_in: DiscussionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Creates a top-level discussion comment for the specified decision.
    User must have access to view the decision.
    """
    return create_discussion(
        db=db,
        decision_id=decision_id,
        content=discussion_in.content,
        current_user=current_user,
        parent_id=None
    )


@router.get(
    "",
    response_model=List[DiscussionResponse],
    summary="List all discussions and threaded replies for a decision"
)
def list_decision_discussions(
    decision_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Retrieves all top-level discussion comments for a decision with nested replies.
    Access matches the visibility of the parent decision.
    """
    return get_discussions_for_decision(
        db=db,
        decision_id=decision_id,
        current_user=current_user
    )


@router.get(
    "/{discussion_id}",
    response_model=DiscussionResponse,
    summary="Get discussion comment details"
)
def get_single_discussion(
    decision_id: int,
    discussion_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Retrieves metadata for a specific discussion comment.
    """
    return get_discussion_by_id(
        db=db,
        decision_id=decision_id,
        discussion_id=discussion_id,
        current_user=current_user
    )


@router.patch(
    "/{discussion_id}",
    response_model=DiscussionResponse,
    summary="Update own discussion comment"
)
def patch_discussion(
    decision_id: int,
    discussion_id: int,
    discussion_in: DiscussionUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Updates the content of an existing discussion comment.
    Only the original author can edit their comment.
    """
    return update_discussion(
        db=db,
        decision_id=decision_id,
        discussion_id=discussion_id,
        content=discussion_in.content,
        current_user=current_user
    )


@router.delete(
    "/{discussion_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete discussion comment"
)
def remove_discussion(
    decision_id: int,
    discussion_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Deletes a discussion comment and its child replies.
    Allowed for comment author or Administrator.
    """
    delete_discussion(
        db=db,
        decision_id=decision_id,
        discussion_id=discussion_id,
        current_user=current_user
    )
    return None


@router.post(
    "/{discussion_id}/replies",
    response_model=DiscussionResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Reply to a discussion comment"
)
def create_discussion_reply(
    decision_id: int,
    discussion_id: int,
    reply_in: DiscussionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Posts a reply to an existing discussion comment.
    """
    return create_discussion(
        db=db,
        decision_id=decision_id,
        content=reply_in.content,
        current_user=current_user,
        parent_id=discussion_id
    )
