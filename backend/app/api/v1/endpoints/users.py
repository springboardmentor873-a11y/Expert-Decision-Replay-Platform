from datetime import datetime, UTC
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select, or_
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db, require_role
from app.core.exceptions import NotFoundError, ForbiddenError
from app.models.identity import Role, Team, TeamMember, User, UserProfile
from app.schemas.auth import RoleOut, UserOut, UserProfileOut, UserProfileUpdate
from app.schemas.identity import (
    RoleAssignRequest,
    TeamCreate,
    TeamMemberAdd,
    TeamMemberOut,
    TeamOut,
    TeamUpdate,
    UserStatusUpdate,
)
from app.services.audit_service import log_audit

router = APIRouter(tags=["users & teams"])


@router.get("/users", response_model=list[UserOut])
def list_users(
    search: str | None = None,
    role_id: UUID | None = None,
    is_active: bool | None = None,
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=100, ge=1, le=200),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[UserOut]:
    """List users with optional search and filtering."""
    query = select(User).where(User.deleted_at.is_(None))

    if is_active is not None:
        query = query.where(User.is_active == is_active)
    if role_id:
        query = query.where(User.role_id == role_id)
    if search:
        s = f"%{search.strip()}%"
        query = query.join(UserProfile, UserProfile.user_id == User.id, isouter=True).where(
            or_(User.email.ilike(s), UserProfile.full_name.ilike(s))
        )

    users = db.scalars(query.order_by(User.created_at.desc()).offset(skip).limit(limit)).all()
    results = []
    for u in users:
        role = db.scalar(select(Role).where(Role.id == u.role_id))
        profile = db.scalar(select(UserProfile).where(UserProfile.user_id == u.id))
        results.append(
            UserOut(
                id=u.id,
                email=u.email,
                role_id=u.role_id,
                role=RoleOut.model_validate(role) if role else None,
                is_active=u.is_active,
                profile=UserProfileOut.model_validate(profile) if profile else None,
                created_at=u.created_at,
                updated_at=u.updated_at,
            )
        )
    return results


@router.get("/users/roles", response_model=list[RoleOut])
def list_roles(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[RoleOut]:
    """List all available system roles."""
    roles = db.scalars(select(Role).order_by(Role.name)).all()
    return [RoleOut.model_validate(r) for r in roles]


@router.get("/users/{user_id}", response_model=UserOut)
def get_user_by_id(
    user_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> UserOut:
    """Retrieve details for a specific user."""
    u = db.scalar(select(User).where(User.id == user_id, User.deleted_at.is_(None)))
    if not u:
        raise NotFoundError(message="User not found.")

    role = db.scalar(select(Role).where(Role.id == u.role_id))
    profile = db.scalar(select(UserProfile).where(UserProfile.user_id == u.id))
    return UserOut(
        id=u.id,
        email=u.email,
        role_id=u.role_id,
        role=RoleOut.model_validate(role) if role else None,
        is_active=u.is_active,
        profile=UserProfileOut.model_validate(profile) if profile else None,
        created_at=u.created_at,
        updated_at=u.updated_at,
    )


@router.patch("/users/{user_id}/role", response_model=UserOut)
def assign_user_role(
    user_id: UUID,
    data: RoleAssignRequest,
    current_user: User = Depends(require_role("administrator")),
    db: Session = Depends(get_db),
) -> UserOut:
    """Assign a role to a user (Administrator only)."""
    u = db.scalar(select(User).where(User.id == user_id, User.deleted_at.is_(None)))
    if not u:
        raise NotFoundError(message="User not found.")

    target_role = db.scalar(select(Role).where(Role.code == data.role_code.lower()))
    if not target_role:
        raise NotFoundError(message=f"Role '{data.role_code}' does not exist.")

    old_role_id = u.role_id
    u.role_id = target_role.id

    log_audit(
        db=db,
        action="user_role_change",
        entity_type="user",
        entity_id=u.id,
        actor_id=current_user.id,
        extra={"old_role_id": str(old_role_id), "new_role": target_role.code},
    )
    db.commit()
    db.refresh(u)

    profile = db.scalar(select(UserProfile).where(UserProfile.user_id == u.id))
    return UserOut(
        id=u.id,
        email=u.email,
        role_id=u.role_id,
        role=RoleOut.model_validate(target_role),
        is_active=u.is_active,
        profile=UserProfileOut.model_validate(profile) if profile else None,
        created_at=u.created_at,
        updated_at=u.updated_at,
    )


@router.patch("/users/{user_id}/status", response_model=UserOut)
def toggle_user_active_status(
    user_id: UUID,
    data: UserStatusUpdate,
    current_user: User = Depends(require_role("administrator")),
    db: Session = Depends(get_db),
) -> UserOut:
    """Activate or deactivate a user account (Administrator only)."""
    u = db.scalar(select(User).where(User.id == user_id, User.deleted_at.is_(None)))
    if not u:
        raise NotFoundError(message="User not found.")

    if u.id == current_user.id and not data.is_active:
        raise ForbiddenError(message="Administrators cannot deactivate their own account.")

    u.is_active = data.is_active
    log_audit(
        db=db,
        action="user_status_toggle",
        entity_type="user",
        entity_id=u.id,
        actor_id=current_user.id,
        extra={"is_active": data.is_active},
    )
    db.commit()
    db.refresh(u)

    role = db.scalar(select(Role).where(Role.id == u.role_id))
    profile = db.scalar(select(UserProfile).where(UserProfile.user_id == u.id))
    return UserOut(
        id=u.id,
        email=u.email,
        role_id=u.role_id,
        role=RoleOut.model_validate(role) if role else None,
        is_active=u.is_active,
        profile=UserProfileOut.model_validate(profile) if profile else None,
        created_at=u.created_at,
        updated_at=u.updated_at,
    )


@router.put("/users/profile/me", response_model=UserProfileOut)
def update_own_profile(
    data: UserProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> UserProfileOut:
    """Update profile information for the authenticated user."""
    profile = db.scalar(select(UserProfile).where(UserProfile.user_id == current_user.id))
    if not profile:
        profile = UserProfile(
            user_id=current_user.id,
            full_name=data.full_name or current_user.email,
        )
        db.add(profile)
        db.flush()

    if data.full_name is not None:
        profile.full_name = data.full_name
    if data.job_title is not None:
        profile.job_title = data.job_title
    if data.department is not None:
        profile.department = data.department
    if data.phone is not None:
        profile.phone = data.phone

    db.commit()
    db.refresh(profile)
    return UserProfileOut.model_validate(profile)


# ---------------- TEAM ENDPOINTS ----------------

@router.get("/teams", response_model=list[TeamOut])
def list_teams(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[TeamOut]:
    """List all active teams with their members."""
    teams = db.scalars(select(Team).where(Team.deleted_at.is_(None)).order_by(Team.name)).all()
    results = []
    for t in teams:
        members_query = (
            select(TeamMember, User, UserProfile, Role)
            .join(User, TeamMember.user_id == User.id)
            .join(UserProfile, UserProfile.user_id == User.id, isouter=True)
            .join(Role, User.role_id == Role.id)
            .where(TeamMember.team_id == t.id, User.deleted_at.is_(None))
        )
        members_data = db.execute(members_query).all()
        m_outs = [
            TeamMemberOut(
                team_id=t.id,
                user_id=row[1].id,
                full_name=row[2].full_name if row[2] else row[1].email,
                email=row[1].email,
                role_code=row[3].code,
                created_at=row[0].created_at,
            )
            for row in members_data
        ]
        results.append(
            TeamOut(
                id=t.id,
                name=t.name,
                description=t.description,
                created_by_id=t.created_by_id,
                members=m_outs,
                created_at=t.created_at,
                updated_at=t.updated_at,
            )
        )
    return results


@router.post("/teams", response_model=TeamOut, status_code=status.HTTP_201_CREATED)
def create_team(
    data: TeamCreate,
    current_user: User = Depends(require_role("administrator", "manager")),
    db: Session = Depends(get_db),
) -> TeamOut:
    """Create a new team (Administrator or Manager)."""
    team = Team(
        name=data.name.strip(),
        description=data.description.strip() if data.description else None,
        created_by_id=current_user.id,
    )
    db.add(team)
    db.flush()

    # Automatically add creator as team member
    member = TeamMember(team_id=team.id, user_id=current_user.id)
    db.add(member)
    db.flush()

    log_audit(
        db=db,
        action="team_create",
        entity_type="team",
        entity_id=team.id,
        actor_id=current_user.id,
        extra={"name": team.name},
    )
    db.commit()
    db.refresh(team)

    role = db.scalar(select(Role).where(Role.id == current_user.role_id))
    profile = db.scalar(select(UserProfile).where(UserProfile.user_id == current_user.id))
    m_out = TeamMemberOut(
        team_id=team.id,
        user_id=current_user.id,
        full_name=profile.full_name if profile else current_user.email,
        email=current_user.email,
        role_code=role.code if role else "employee",
        created_at=member.created_at,
    )
    return TeamOut(
        id=team.id,
        name=team.name,
        description=team.description,
        created_by_id=team.created_by_id,
        members=[m_out],
        created_at=team.created_at,
        updated_at=team.updated_at,
    )


@router.post("/teams/{team_id}/members", status_code=status.HTTP_201_CREATED)
def add_team_member(
    team_id: UUID,
    data: TeamMemberAdd,
    current_user: User = Depends(require_role("administrator", "manager")),
    db: Session = Depends(get_db),
) -> dict:
    """Add a user as member of a team."""
    team = db.scalar(select(Team).where(Team.id == team_id, Team.deleted_at.is_(None)))
    if not team:
        raise NotFoundError(message="Team not found.")

    user = db.scalar(select(User).where(User.id == data.user_id, User.deleted_at.is_(None)))
    if not user:
        raise NotFoundError(message="User not found.")

    existing = db.scalar(
        select(TeamMember).where(TeamMember.team_id == team_id, TeamMember.user_id == data.user_id)
    )
    if existing:
        return {"status": "ok", "message": "User is already a member of this team."}

    tm = TeamMember(team_id=team_id, user_id=data.user_id)
    db.add(tm)
    log_audit(
        db=db,
        action="team_member_add",
        entity_type="team",
        entity_id=team_id,
        actor_id=current_user.id,
        extra={"member_id": str(data.user_id)},
    )
    db.commit()
    return {"status": "ok", "message": "Team member added successfully."}


@router.delete("/teams/{team_id}/members/{user_id}")
def remove_team_member(
    team_id: UUID,
    user_id: UUID,
    current_user: User = Depends(require_role("administrator", "manager")),
    db: Session = Depends(get_db),
) -> dict:
    """Remove a user from a team."""
    tm = db.scalar(
        select(TeamMember).where(TeamMember.team_id == team_id, TeamMember.user_id == user_id)
    )
    if not tm:
        raise NotFoundError(message="Member not found in team.")

    db.delete(tm)
    log_audit(
        db=db,
        action="team_member_remove",
        entity_type="team",
        entity_id=team_id,
        actor_id=current_user.id,
        extra={"member_id": str(user_id)},
    )
    db.commit()
    return {"status": "ok", "message": "Team member removed."}
