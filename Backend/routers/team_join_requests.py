from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from database.database import get_db
from security.auth import get_current_user
from security.audit import log_action
from models.team import Team
from models.user import User
from models.notification import Notification
from models.team_join_request import TeamJoinRequest, JoinRequestStatus
from Schemas.team_join_request import TeamJoinRequestOut

router = APIRouter(prefix="/teams", tags=["Team Join Requests"])


@router.post("/{team_id}/join-requests", response_model=TeamJoinRequestOut, status_code=201)
def request_to_join_team(
    team_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    team = db.query(Team).filter(Team.id == team_id).first()
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")

    if current_user.team_id:
        if current_user.team_id == team_id:
            raise HTTPException(status_code=400, detail=f"You are already a member of team '{team.name}'.")
        current_team = db.query(Team).filter(Team.id == current_user.team_id).first()
        current_team_name = current_team.name if current_team else f"Team #{current_user.team_id}"
        raise HTTPException(
            status_code=400,
            detail=f"You are already a member of team '{current_team_name}'. You must leave your current team before requesting to join '{team.name}'."
        )

    # If the user already has a pending join request, prevent duplicate submissions
    existing_pending = (
        db.query(TeamJoinRequest)
        .filter(
            TeamJoinRequest.user_id == current_user.id,
            TeamJoinRequest.status == JoinRequestStatus.pending,
        )
        .first()
    )
    if existing_pending:
        pending_team = db.query(Team).filter(Team.id == existing_pending.team_id).first()
        pending_team_name = pending_team.name if pending_team else f"Team #{existing_pending.team_id}"
        raise HTTPException(
            status_code=400,
            detail=f"You already have a pending request to join team '{pending_team_name}'. Please wait for approval or cancel it before submitting another."
        )

    join_req = TeamJoinRequest(
        user_id=current_user.id,
        team_id=team_id,
        status=JoinRequestStatus.pending,
    )
    db.add(join_req)
    db.commit()
    db.refresh(join_req)

    log_action(
        db,
        actor=current_user,
        action="team.join_requested",
        entity_type="team",
        entity_id=team_id,
        details=f"User '{current_user.full_name}' requested to join team '{team.name}'",
    )

    # Notify the assigned team manager (if not the requester)
    if team.manager_id and team.manager_id != current_user.id:
        from security.websocket_manager import create_and_notify
        create_and_notify(
            db,
            user_id=team.manager_id,
            message=f"Team Join Request: {current_user.full_name} has requested to join your team '{team.name}'.",
            entity_type="team",
            entity_id=team_id,
        )

    # Also notify administrators (if not the requester or team manager)
    from models.role import Role
    admin_users = (
        db.query(User)
        .join(Role)
        .filter(Role.name == "administrator", User.id != current_user.id, User.id != team.manager_id)
        .all()
    )
    for admin_user in admin_users:
        from security.websocket_manager import create_and_notify
        create_and_notify(
            db,
            user_id=admin_user.id,
            message=f"Team Join Request: {current_user.full_name} requested to join '{team.name}'.",
            entity_type="team",
            entity_id=team_id,
        )

    return TeamJoinRequestOut(
        id=join_req.id,
        user_id=join_req.user_id,
        user_name=current_user.full_name,
        user_email=current_user.email,
        team_id=join_req.team_id,
        team_name=team.name,
        team_manager_id=team.manager_id,
        team_manager_name=team.manager.full_name if (team and team.manager) else None,
        status=join_req.status,
        created_at=join_req.created_at,
    )


@router.get("/join-requests", response_model=List[TeamJoinRequestOut])
def list_team_join_requests(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(TeamJoinRequest)

    is_admin = current_user.role and current_user.role.name == "administrator"
    is_manager = current_user.role and current_user.role.name == "manager"

    if is_admin:
        # Admins see all pending/historical join requests
        requests = query.order_by(TeamJoinRequest.created_at.desc()).all()
    elif is_manager:
        # Managers see requests for teams they manage, plus their own submitted requests
        managed_team_ids = [t.id for t in db.query(Team).filter(Team.manager_id == current_user.id).all()]
        requests = (
            query.filter(
                (TeamJoinRequest.team_id.in_(managed_team_ids)) | (TeamJoinRequest.user_id == current_user.id)
            )
            .order_by(TeamJoinRequest.created_at.desc())
            .all()
        )
    else:
        # Employees see their own submitted requests
        requests = (
            query.filter(TeamJoinRequest.user_id == current_user.id)
            .order_by(TeamJoinRequest.created_at.desc())
            .all()
        )

    res = []
    for req in requests:
        res.append(
            TeamJoinRequestOut(
                id=req.id,
                user_id=req.user_id,
                user_name=req.user.full_name if req.user else "Unknown User",
                user_email=req.user.email if req.user else "",
                team_id=req.team_id,
                team_name=req.team.name if req.team else "Unknown Team",
                team_manager_id=req.team.manager_id if req.team else None,
                team_manager_name=req.team.manager.full_name if (req.team and req.team.manager) else None,
                status=req.status,
                created_at=req.created_at,
            )
        )
    return res


@router.post("/join-requests/{request_id}/approve", response_model=TeamJoinRequestOut)
def approve_team_join_request(
    request_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    req = db.query(TeamJoinRequest).filter(TeamJoinRequest.id == request_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Join request not found")

    team = db.query(Team).filter(Team.id == req.team_id).first()
    if not team:
        raise HTTPException(status_code=404, detail="Associated team not found")

    is_admin = current_user.role and current_user.role.name == "administrator"
    is_team_manager = team.manager_id == current_user.id

    if not (is_admin or is_team_manager):
        raise HTTPException(
            status_code=403, detail="Only the team manager or an administrator can approve join requests."
        )

    # Prevent regular non-admin managers/employees from self-approving,
    # but allow Administrators to approve (essential for administration & testing):
    if req.user_id == current_user.id and not is_admin:
        raise HTTPException(
            status_code=400,
            detail="You cannot approve your own team join request. Only the assigned team manager or an administrator can approve it."
        )

    req.status = JoinRequestStatus.approved
    
    # Assign target user to team!
    target_user = db.query(User).filter(User.id == req.user_id).first()
    if target_user:
        target_user.team_id = req.team_id
        # Automatically cancel/reject any other pending requests for this user
        other_pending = (
            db.query(TeamJoinRequest)
            .filter(
                TeamJoinRequest.user_id == req.user_id,
                TeamJoinRequest.id != req.id,
                TeamJoinRequest.status == JoinRequestStatus.pending,
            )
            .all()
        )
        for other in other_pending:
            other.status = JoinRequestStatus.rejected

    db.commit()
    db.refresh(req)

    log_action(
        db,
        actor=current_user,
        action="team.join_approved",
        entity_type="team",
        entity_id=req.team_id,
        details=f"Approved join request #{req.id} for user '{target_user.full_name if target_user else req.user_id}' to join '{team.name}'",
    )

    # Send notification to target user
    from security.websocket_manager import create_and_notify
    create_and_notify(
        db,
        user_id=req.user_id,
        message=f"Team Request Approved 🎉: Your request to join team '{team.name}' has been approved by {current_user.full_name}!",
        entity_type="team",
        entity_id=team.id,
    )

    return TeamJoinRequestOut(
        id=req.id,
        user_id=req.user_id,
        user_name=target_user.full_name if target_user else "User",
        user_email=target_user.email if target_user else "",
        team_id=req.team_id,
        team_name=team.name,
        team_manager_id=team.manager_id,
        team_manager_name=team.manager.full_name if team.manager else None,
        status=req.status,
        created_at=req.created_at,
    )


@router.post("/join-requests/{request_id}/reject", response_model=TeamJoinRequestOut)
def reject_team_join_request(
    request_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    req = db.query(TeamJoinRequest).filter(TeamJoinRequest.id == request_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Join request not found")

    team = db.query(Team).filter(Team.id == req.team_id).first()
    if not team:
        raise HTTPException(status_code=404, detail="Associated team not found")

    is_admin = current_user.role and current_user.role.name == "administrator"
    is_team_manager = team.manager_id == current_user.id

    if not (is_admin or is_team_manager):
        raise HTTPException(
            status_code=403, detail="Only the team manager or an administrator can reject join requests."
        )

    if req.user_id == current_user.id and not is_admin:
        raise HTTPException(
            status_code=400,
            detail="You cannot reject your own team join request."
        )

    req.status = JoinRequestStatus.rejected
    db.commit()
    db.refresh(req)

    log_action(
        db,
        actor=current_user,
        action="team.join_rejected",
        entity_type="team",
        entity_id=req.team_id,
        details=f"Rejected join request #{req.id} for user id '{req.user_id}' to join '{team.name}'",
    )

    # Send notification to target user
    from security.websocket_manager import create_and_notify
    create_and_notify(
        db,
        user_id=req.user_id,
        message=f"Team Request Rejected: Your request to join team '{team.name}' was declined.",
        entity_type="team",
        entity_id=team.id,
    )

    return TeamJoinRequestOut(
        id=req.id,
        user_id=req.user_id,
        user_name=req.user.full_name if req.user else "User",
        user_email=req.user.email if req.user else "",
        team_id=req.team_id,
        team_name=team.name,
        team_manager_id=team.manager_id,
        team_manager_name=team.manager.full_name if team.manager else None,
        status=req.status,
        created_at=req.created_at,
    )


@router.post("/{team_id}/leave")
def leave_team(
    team_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.team_id != team_id:
        raise HTTPException(status_code=400, detail="You are not a member of this team.")

    team = db.query(Team).filter(Team.id == team_id).first()
    team_name = team.name if team else f"Team #{team_id}"
    current_user.team_id = None
    db.commit()
    db.refresh(current_user)

    log_action(
        db,
        actor=current_user,
        action="team.member_left",
        entity_type="team",
        entity_id=team_id,
        details=f"User '{current_user.full_name}' left team '{team_name}'",
    )

    return {"message": f"Successfully left team '{team_name}'"}


@router.delete("/join-requests/{request_id}")
def cancel_team_join_request(
    request_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    req = db.query(TeamJoinRequest).filter(TeamJoinRequest.id == request_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Join request not found")

    is_admin = current_user.role and current_user.role.name == "administrator"
    is_owner = req.user_id == current_user.id

    if not (is_admin or is_owner):
        raise HTTPException(
            status_code=403, detail="You can only cancel your own pending join request."
        )

    db.delete(req)
    db.commit()

    return {"message": "Join request cancelled successfully"}


