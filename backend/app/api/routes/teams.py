from typing import List, Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user
from app.database.database import get_db
from app.models.user import User
from app.schemas.team import (
    TeamCreateRequest,
    TeamMemberAddRequest,
    TeamMemberResponse,
    TeamResponse,
    TeamUpdateRequest,
)
from app.schemas.team_join_request import (
    TeamJoinRequestCreate,
    TeamJoinRequestResponse,
    TeamJoinRequestReview,
)
from app.services.team_service import (
    add_team_member,
    create_join_request,
    create_team,
    delete_team,
    get_join_requests,
    get_my_teams,
    get_team_by_id,
    get_teams,
    remove_team_member,
    review_join_request,
    update_team,
)

router = APIRouter()


@router.post("", response_model=TeamResponse, status_code=status.HTTP_201_CREATED, summary="Create a new team")
def create_new_team(
    team_in: TeamCreateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Creates a new organizational team and designates the creator as team Lead."""
    return create_team(db=db, team_in=team_in, current_user=current_user)


@router.get("", response_model=List[TeamResponse], summary="List all teams")
def list_teams(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=200),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Lists teams across the organization with member counts."""
    return get_teams(db=db, current_user=current_user, skip=skip, limit=limit)


@router.get("/my", response_model=List[TeamResponse], summary="List my teams")
def list_my_teams(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Retrieves all teams that the current authenticated user belongs to."""
    return get_my_teams(db=db, current_user=current_user)


@router.get("/join-requests", response_model=List[TeamJoinRequestResponse], summary="List join requests")
def list_team_join_requests(
    team_id: Optional[int] = Query(None, description="Filter by team ID"),
    status: Optional[str] = Query(None, description="Filter by request status (PENDING, APPROVED, REJECTED)"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Lists team join requests visible to the user (own requests or requests for teams they lead/manage)."""
    return get_join_requests(db=db, current_user=current_user, team_id=team_id, status_filter=status)


@router.patch("/join-requests/{request_id}/approve", response_model=TeamJoinRequestResponse, summary="Approve a join request")
def approve_team_join_request(
    request_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Approves a pending join request and enrolls the user as a Team Member."""
    return review_join_request(
        db=db,
        request_id=request_id,
        review_in=TeamJoinRequestReview(action="APPROVE"),
        current_user=current_user,
    )


@router.patch("/join-requests/{request_id}/reject", response_model=TeamJoinRequestResponse, summary="Reject a join request")
def reject_team_join_request(
    request_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Rejects a pending team join request."""
    return review_join_request(
        db=db,
        request_id=request_id,
        review_in=TeamJoinRequestReview(action="REJECT"),
        current_user=current_user,
    )


@router.get("/{team_id}", response_model=TeamResponse, summary="Get team by ID")
def get_single_team(
    team_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Retrieves detailed information and full member roster for a specific team."""
    return get_team_by_id(db=db, team_id=team_id, current_user=current_user)


@router.patch("/{team_id}", response_model=TeamResponse, summary="Update a team")
def patch_team(
    team_id: int,
    team_in: TeamUpdateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Updates team metadata (name, description). Restricted to Admin, Manager, or team Lead."""
    return update_team(db=db, team_id=team_id, team_in=team_in, current_user=current_user)


@router.delete("/{team_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Delete a team")
def remove_team(
    team_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Deletes a team. Restricted to Admin, Manager, or team creator."""
    delete_team(db=db, team_id=team_id, current_user=current_user)
    return None


@router.post("/{team_id}/join-request", response_model=TeamJoinRequestResponse, status_code=status.HTTP_201_CREATED, summary="Request to join team")
def request_to_join_team(
    team_id: int,
    request_in: TeamJoinRequestCreate = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Submits a request to join the designated team."""
    if request_in is None:
        request_in = TeamJoinRequestCreate()
    return create_join_request(db=db, team_id=team_id, request_in=request_in, current_user=current_user)


@router.post("/{team_id}/members", response_model=TeamMemberResponse, status_code=status.HTTP_201_CREATED, summary="Add member to team")
def add_member_to_team(
    team_id: int,
    member_in: TeamMemberAddRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Adds an active user to the team roster. Restricted to Admin, Manager, or team Lead."""
    return add_team_member(db=db, team_id=team_id, member_in=member_in, current_user=current_user)


@router.delete("/{team_id}/members/{user_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Remove member from team")
def remove_member_from_team(
    team_id: int,
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Removes a user from the team roster. Allowed for team managers or self-removal."""
    remove_team_member(db=db, team_id=team_id, user_id=user_id, current_user=current_user)
    return None


@router.get("/{team_id}/workspace", summary="Get complete team workspace details across all 7 tabs")
def get_team_workspace_data(
    team_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Retrieves consolidated data for the 7 tabs of the Team Workspace."""
    from app.services.team_service import get_team_workspace
    return get_team_workspace(db=db, team_id=team_id, current_user=current_user)
