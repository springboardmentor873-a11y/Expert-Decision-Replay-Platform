from fastapi import APIRouter
from fastapi import Depends
from fastapi import HTTPException

from sqlalchemy.orm import Session
from sqlalchemy import func
from sqlalchemy import or_

from typing import Optional

from datetime import datetime

from app.database import get_db
from app.models import Team
from app.models import User
from app.models import Role
from app.models import Decision
from app.models import TeamRequest
from app.auth import get_current_user
from app.schemas import TeamCreate
from app.schemas import TeamUpdate
from app.schemas import TeamAddMember
from app.schemas import TeamJoinRequestCreate
from app.routes.decisions import decision_dict

router = APIRouter(
    prefix="/teams",
    tags=["Teams"]
)

MANAGER_ROLES = (3, 4)


# ==========================================
# HELPER: TEAM DICT
# ==========================================

def team_dict(
    team: Team,
    include_members: bool = False
):

    member_names = [
        u.name
        for u in team.users
    ]

    manager_name = None

    if team.manager_user_id:

        manager = (
            team.manager
            or next(
                (u for u in team.users if u.user_id == team.manager_user_id),
                None
            )
        )

        if manager:
            manager_name = manager.name

    if not manager_name:

        managers = [
            u for u in team.users if u.role_id in MANAGER_ROLES
        ]

        managers.sort(
            key=lambda u: (
                0 if u.role_id == 4 else 1,
                u.user_id
            )
        )

        if managers:
            manager_name = managers[0].name

    all_decisions = []

    for u in team.users:
        all_decisions.extend(u.decisions or [])

    all_decisions.sort(
        key=lambda x: x.decision_date or datetime.min,
        reverse=True
    )

    data = {
        "team_id": team.team_id,
        "team_name": team.team_name,
        "description": team.description,
        "is_archived": bool(team.is_archived),
        "manager_user_id": team.manager_user_id,
        "manager_name": manager_name,
        "created_at": team.created_at,
        "member_count": len(member_names),
        "decision_count": len(all_decisions),
        "recent_decisions": [
            {
                "decision_id": d.decision_id,
                "title": d.title,
                "status": d.status,
                "category_name": (
                    d.category.category_name
                    if d.category
                    else None
                ),
                "expert_name": (
                    d.expert.name
                    if d.expert
                    else None
                ),
                "decision_date": d.decision_date,
                "created_at": d.created_at,
                "priority": d.priority
            }
            for d in all_decisions[:3]
        ]
    }

    if include_members:

        data["members"] = [
            {
                "user_id": u.user_id,
                "name": u.name,
                "email": u.email,
                "role_id": u.role_id,
                "role_name": (
                    u.role.role_name
                    if u.role
                    else None
                ),
                "team_id": u.team_id,
                "team_name": (
                    u.team.team_name
                    if u.team
                    else None
                )
            }
            for u in sorted(
                team.users,
                key=lambda x: (x.role_id, x.name.lower())
            )
        ]

        activity = []

        for d in all_decisions:

            activity.append(
                {
                    "action": "Decision Created",
                    "user_name": (
                        d.expert.name
                        if d.expert
                        else None
                    ),
                    "decision_id": d.decision_id,
                    "decision_title": d.title,
                    "created_at": d.created_at
                }
            )

            for approval in d.approvals:

                activity.append(
                    {
                        "action": approval.action,
                        "user_name": (
                            approval.user.name
                            if approval.user
                            else None
                        ),
                        "decision_id": d.decision_id,
                        "decision_title": d.title,
                        "created_at": approval.created_at
                    }
                )

        activity.sort(
            key=lambda e: e["created_at"] or datetime.min,
            reverse=True
        )

        data["recent_activity"] = activity[:10]

    return data


# ==========================================
# HELPER: ROLE GATE
# ==========================================

def require_management_role(current_user):

    if current_user.role_id not in MANAGER_ROLES:

        raise HTTPException(
            status_code=403,
            detail=(
                "Only a Manager or an Administrator "
                "can perform this action"
            )
        )


# ==========================================
# GET ALL TEAMS
# ==========================================

@router.get("/")
def get_teams(
    search: Optional[str] = None,
    include_archived: Optional[bool] = False,
    mine: Optional[bool] = False,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):

    query = db.query(Team)

    if mine:

        query = query.filter(
            or_(
                Team.team_id == current_user.team_id,
                Team.manager_user_id == current_user.user_id
            )
        )

    if not include_archived:
        query = query.filter(Team.is_archived == False)  # noqa: E712

    if search:

        query = query.filter(
            or_(
                Team.team_name.ilike(f"%{search.strip()}%"),
                Team.description.ilike(f"%{search.strip()}%")
            )
        )

    teams = (
        query.order_by(
            Team.team_name.asc()
        )
        .all()
    )

    return [
        team_dict(t)
        for t in teams
    ]


# ==========================================
# GET TEAM BY ID
# ==========================================

@router.get("/{team_id}")
def get_team(
    team_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):

    team = (
        db.query(Team)
        .filter(Team.team_id == team_id)
        .first()
    )

    if not team:

        raise HTTPException(
            status_code=404,
            detail="Team not found"
        )

    return team_dict(team, include_members=True)


# ==========================================
# CREATE TEAM
# ==========================================

@router.post("/")
def create_team(
    team_data: TeamCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):

    require_management_role(current_user)

    if not team_data.team_name or not team_data.team_name.strip():

        raise HTTPException(
            status_code=422,
            detail="Team name is required"
        )

    existing = (
        db.query(Team)
        .filter(Team.team_name == team_data.team_name.strip())
        .first()
    )

    if existing:

        raise HTTPException(
            status_code=409,
            detail="A team with this name already exists"
        )

    manager_user_id = team_data.manager_user_id

    if manager_user_id:

        manager = (
            db.query(User)
            .filter(User.user_id == manager_user_id)
            .first()
        )

        if not manager:

            raise HTTPException(
                status_code=422,
                detail="Selected team lead does not exist"
            )

    team = Team(
        team_name=team_data.team_name.strip(),
        description=team_data.description,
        manager_user_id=manager_user_id
    )

    db.add(team)
    db.commit()
    db.refresh(team)

    return team_dict(team, include_members=True)


# ==========================================
# UPDATE TEAM
# ==========================================

@router.put("/{team_id}")
def update_team(
    team_id: int,
    team_data: TeamUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):

    team = (
        db.query(Team)
        .filter(Team.team_id == team_id)
        .first()
    )

    if not team:

        raise HTTPException(
            status_code=404,
            detail="Team not found"
        )

    require_management_role(current_user)

    if team_data.team_name is not None:

        if not team_data.team_name.strip():

            raise HTTPException(
                status_code=422,
                detail="Team name cannot be empty"
            )

        duplicate = (
            db.query(Team)
            .filter(
                Team.team_name == team_data.team_name.strip(),
                Team.team_id != team_id
            )
            .first()
        )

        if duplicate:

            raise HTTPException(
                status_code=409,
                detail="A team with this name already exists"
            )

        team.team_name = team_data.team_name.strip()

    if team_data.description is not None:

        team.description = team_data.description

    if team_data.manager_user_id is not None:

        manager = (
            db.query(User)
            .filter(User.user_id == team_data.manager_user_id)
            .first()
        )

        if not manager:

            raise HTTPException(
                status_code=422,
                detail="Selected team lead does not exist"
            )

        team.manager_user_id = team_data.manager_user_id

    if team_data.is_archived is not None:

        team.is_archived = bool(team_data.is_archived)

    db.commit()
    db.refresh(team)

    return team_dict(team, include_members=True)


# ==========================================
# ARCHIVE TEAM
# ==========================================

@router.put("/{team_id}/archive")
def archive_team(
    team_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):

    team = (
        db.query(Team)
        .filter(Team.team_id == team_id)
        .first()
    )

    if not team:

        raise HTTPException(
            status_code=404,
            detail="Team not found"
        )

    require_management_role(current_user)

    team.is_archived = True

    db.commit()
    db.refresh(team)

    return team_dict(team, include_members=True)


# ==========================================
# UNARCHIVE TEAM
# ==========================================

@router.put("/{team_id}/unarchive")
def unarchive_team(
    team_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):

    team = (
        db.query(Team)
        .filter(Team.team_id == team_id)
        .first()
    )

    if not team:

        raise HTTPException(
            status_code=404,
            detail="Team not found"
        )

    require_management_role(current_user)

    team.is_archived = False

    db.commit()
    db.refresh(team)

    return team_dict(team, include_members=True)


# ==========================================
# GET TEAM DECISIONS
# ==========================================

@router.get("/{team_id}/decisions")
def get_team_decisions(
    team_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):

    team = (
        db.query(Team)
        .filter(Team.team_id == team_id)
        .first()
    )

    if not team:

        raise HTTPException(
            status_code=404,
            detail="Team not found"
        )

    decision_dict_fn = __import__(
        "app.routes.decisions",
        fromlist=["decision_dict"]
    ).decision_dict

    member_user_ids = [u.user_id for u in team.users]

    decisions = (
        db.query(Decision)
        .filter(Decision.expert_id.in_(member_user_ids))
        .order_by(Decision.created_at.desc())
        .all()
    )

    return [
        decision_dict_fn(d) for d in decisions
    ]


# ==========================================
# ADD MEMBER
# ==========================================

@router.post("/{team_id}/members")
def add_member(
    team_id: int,
    member_data: TeamAddMember,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):

    team = (
        db.query(Team)
        .filter(Team.team_id == team_id)
        .first()
    )

    if not team:

        raise HTTPException(
            status_code=404,
            detail="Team not found"
        )

    require_management_role(current_user)

    user = (
        db.query(User)
        .filter(User.user_id == member_data.user_id)
        .first()
    )

    if not user:

        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    if user.team_id == team_id:

        raise HTTPException(
            status_code=409,
            detail="User is already a member of this team"
        )

    user.team_id = team_id

    db.commit()

    return team_dict(team, include_members=True)


# ==========================================
# REMOVE MEMBER
# ==========================================

@router.delete("/{team_id}/members/{user_id}")
def remove_member(
    team_id: int,
    user_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):

    team = (
        db.query(Team)
        .filter(Team.team_id == team_id)
        .first()
    )

    if not team:

        raise HTTPException(
            status_code=404,
            detail="Team not found"
        )

    require_management_role(current_user)

    user = (
        db.query(User)
        .filter(User.user_id == user_id)
        .first()
    )

    if not user:

        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    if int(user.team_id or 0) != int(team_id):

        raise HTTPException(
            status_code=409,
            detail="User is not a member of this team"
        )

    user.team_id = None

    db.commit()

    return team_dict(team, include_members=True)


# ==========================================
# JOIN REQUEST
# ==========================================

@router.post("/{team_id}/join-request")
def create_join_request(
    team_id: int,
    request_data: TeamJoinRequestCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):

    team = (
        db.query(Team)
        .filter(Team.team_id == team_id)
        .first()
    )

    if not team:

        raise HTTPException(
            status_code=404,
            detail="Team not found"
        )

    if team.is_archived:

        raise HTTPException(
            status_code=422,
            detail="This team is archived and cannot accept join requests"
        )

    if int(current_user.team_id or 0) == int(team_id):

        raise HTTPException(
            status_code=409,
            detail="You are already a member of this team"
        )

    existing = (
        db.query(TeamRequest)
        .filter(
            TeamRequest.team_id == team_id,
            TeamRequest.user_id == current_user.user_id,
            TeamRequest.status.in_(["Pending", "Approved"])
        )
        .first()
    )

    if existing:

        raise HTTPException(
            status_code=409,
            detail="You have already requested to join this team"
        )

    request = TeamRequest(
        team_id=team_id,
        user_id=current_user.user_id,
        status="Pending"
    )

    db.add(request)
    db.commit()
    db.refresh(request)

    return {
        "message": "Join request submitted",
        "request_id": request.request_id,
        "status": request.status
    }


# ==========================================
# LIST JOIN REQUESTS
# ==========================================

@router.get("/{team_id}/join-requests")
def list_join_requests(
    team_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):

    team = (
        db.query(Team)
        .filter(Team.team_id == team_id)
        .first()
    )

    if not team:

        raise HTTPException(
            status_code=404,
            detail="Team not found"
        )

    require_management_role(current_user)

    requests = (
        db.query(TeamRequest)
        .filter(TeamRequest.team_id == team_id)
        .order_by(TeamRequest.created_at.desc())
        .all()
    )

    return [
        {
            "request_id": r.request_id,
            "team_id": r.team_id,
            "user_id": r.user_id,
            "user_name": (
                r.user.name
                if r.user
                else None
            ),
            "user_email": (
                r.user.email
                if r.user
                else None
            ),
            "status": r.status,
            "created_at": r.created_at
        }
        for r in requests
    ]


# ==========================================
# DECIDE JOIN REQUEST
# ==========================================

@router.put("/{team_id}/join-requests/{request_id}")
def decide_join_request(
    team_id: int,
    request_id: int,
    decision: dict,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):

    team = (
        db.query(Team)
        .filter(Team.team_id == team_id)
        .first()
    )

    if not team:

        raise HTTPException(
            status_code=404,
            detail="Team not found"
        )

    require_management_role(current_user)

    request = (
        db.query(TeamRequest)
        .filter(
            TeamRequest.request_id == request_id,
            TeamRequest.team_id == team_id
        )
        .first()
    )

    if not request:

        raise HTTPException(
            status_code=404,
            detail="Join request not found"
        )

    if request.status != "Pending":

        raise HTTPException(
            status_code=409,
            detail="This request has already been processed"
        )

    action = (decision.get("decision") or "approve").lower()

    if action == "approve":

        user = (
            db.query(User)
            .filter(User.user_id == request.user_id)
            .first()
        )

        if user:

            user.team_id = team_id

        request.status = "Approved"

    elif action == "reject":

        request.status = "Rejected"

    else:

        raise HTTPException(
            status_code=422,
            detail="Invalid decision. Use 'approve' or 'reject'"
        )

    db.commit()
    db.refresh(request)

    return {
        "message": (
            "Join request approved"
            if request.status == "Approved"
            else "Join request rejected"
        ),
        "request_id": request.request_id,
        "status": request.status
    }