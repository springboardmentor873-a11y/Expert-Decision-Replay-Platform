from typing import List
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.models.user import User
from app.schemas.tag import DecisionTagAssignRequest, TagCreateRequest, TagResponse
from app.core.dependencies import get_current_user
from app.services.tag_service import (
    assign_tags_to_decision,
    create_tag,
    get_tags,
    remove_tag_from_decision,
)

router = APIRouter(tags=["Tags"])


@router.get("", response_model=List[TagResponse])
def list_tags(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List all tags."""
    return get_tags(db)


@router.post("", response_model=TagResponse, status_code=status.HTTP_201_CREATED)
def create_new_tag(
    tag_in: TagCreateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a new tag."""
    return create_tag(db, tag_in, current_user)


@router.post("/decisions/{decision_id}/tags", response_model=List[TagResponse])
def assign_decision_tags(
    decision_id: int,
    assign_in: DecisionTagAssignRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Assign tags to a decision."""
    return assign_tags_to_decision(db, decision_id, assign_in.tag_ids, current_user)


@router.delete("/decisions/{decision_id}/tags/{tag_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_decision_tag(
    decision_id: int,
    tag_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Remove a tag from a decision."""
    remove_tag_from_decision(db, decision_id, tag_id, current_user)
    return None

