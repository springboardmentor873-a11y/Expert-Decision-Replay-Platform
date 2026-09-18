from typing import List, Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user
from app.database.database import get_db
from app.models.user import User
from app.schemas.decision import DecisionCreateRequest, DecisionResponse, DecisionUpdateRequest
from app.services.decision_service import (
    archive_decision,
    create_decision,
    delete_decision,
    get_decision_by_id,
    get_decisions,
    submit_decision,
    unarchive_decision,
    update_decision,
)
from app.api.routes import alternatives, documents, discussions, decision_versions
from app.api.routes.approvals import decision_approvals_router

router = APIRouter()

# Mount alternatives sub-resource router
router.include_router(
    alternatives.router,
    prefix="/{decision_id}/alternatives",
    tags=["Alternative Comparison"]
)

# Mount documents sub-resource router
router.include_router(
    documents.router,
    prefix="/{decision_id}/documents",
    tags=["Document Management"]
)

# Mount discussions sub-resource router
router.include_router(
    discussions.router,
    prefix="/{decision_id}/discussions",
    tags=["Discussions & Collaboration"]
)

# Mount version tracking sub-resource router
router.include_router(
    decision_versions.router,
    prefix="/{decision_id}/versions",
    tags=["Version Tracking"]
)

# Mount approval workflows sub-resource router
router.include_router(
    decision_approvals_router,
    tags=["Approval Workflows"]
)


@router.post("", response_model=DecisionResponse, status_code=status.HTTP_201_CREATED, summary="Create a new decision")
def create_new_decision(
    decision_in: DecisionCreateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Creates a new decision for the authenticated user with initial status 'Draft'."""
    return create_decision(db=db, decision_in=decision_in, user_id=current_user.id)


@router.get("", response_model=List[DecisionResponse], summary="List accessible decisions")
def list_decisions(
    status: Optional[str] = Query(None, description="Filter decisions by status (Draft, Submitted, etc.)"),
    search: Optional[str] = Query(None, description="Search term across title, problem, context, and status"),
    category_id: Optional[int] = Query(None, description="Filter by category ID"),
    team_id: Optional[int] = Query(None, description="Filter by team ID"),
    tag_id: Optional[int] = Query(None, description="Filter by tag ID"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=200),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Retrieves decisions accessible to the authenticated user with optional status filter, category, team, tag, and search query."""
    status_val = status if isinstance(status, str) else None
    search_val = search if isinstance(search, str) else None
    category_val = category_id if isinstance(category_id, int) else None
    team_val = team_id if isinstance(team_id, int) else None
    tag_val = tag_id if isinstance(tag_id, int) else None
    skip_val = skip if isinstance(skip, int) else 0
    limit_val = limit if isinstance(limit, int) else 100
    return get_decisions(
        db=db,
        current_user=current_user,
        status_filter=status_val,
        search=search_val,
        category_id=category_val,
        team_id=team_val,
        tag_id=tag_val,
        skip=skip_val,
        limit=limit_val,
    )


@router.get("/{decision_id}", response_model=DecisionResponse, summary="Get decision by ID")
def get_single_decision(
    decision_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Retrieves details of a specific decision by ID."""
    return get_decision_by_id(db=db, decision_id=decision_id, current_user=current_user)


@router.patch("/{decision_id}", response_model=DecisionResponse, summary="Update a decision")
def patch_decision(
    decision_id: int,
    decision_in: DecisionUpdateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Updates fields of an existing decision."""
    return update_decision(db=db, decision_id=decision_id, decision_in=decision_in, current_user=current_user)


@router.post("/{decision_id}/submit", response_model=DecisionResponse, summary="Submit a draft decision")
def submit_draft_decision(
    decision_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Transitions a decision status from 'Draft' to 'Submitted'."""
    return submit_decision(db=db, decision_id=decision_id, current_user=current_user)


@router.post("/{decision_id}/archive", response_model=DecisionResponse, summary="Archive a decision")
def archive_existing_decision(
    decision_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Archives a decision making it read-only."""
    return archive_decision(db=db, decision_id=decision_id, current_user=current_user)


@router.post("/{decision_id}/unarchive", response_model=DecisionResponse, summary="Unarchive a decision")
def unarchive_existing_decision(
    decision_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Restores an archived decision back to active Draft status."""
    return unarchive_decision(db=db, decision_id=decision_id, current_user=current_user)


@router.delete("/{decision_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Delete a decision")
def remove_decision(
    decision_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Deletes a draft decision (or any decision for Administrators)."""
    delete_decision(db=db, decision_id=decision_id, current_user=current_user)
    return None