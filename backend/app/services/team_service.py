from typing import List, Optional
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.audit_log import AuditActionEnum
from app.models.role import RoleEnum
from app.models.team import Team, TeamMember
from app.models.user import User
from app.schemas.team import TeamCreateRequest, TeamMemberAddRequest, TeamResponse, TeamMemberResponse, TeamUpdateRequest
from app.services.audit_service import create_audit_log


def _check_team_management_permission(team: Team, current_user: User) -> bool:
    """Returns True if current_user is an Administrator, Manager, team creator, or team Lead."""
    user_role = current_user.role.name if current_user.role else ""
    if user_role in (RoleEnum.ADMINISTRATOR.value, RoleEnum.MANAGER.value):
        return True
    if team.created_by == current_user.id:
        return True
    for m in team.members:
        if m.user_id == current_user.id and m.role.lower() == "lead":
            return True
    return False


def _format_team_response(team: Team) -> TeamResponse:
    """Formats a Team model instance into TeamResponse with populated member information."""
    member_list: List[TeamMemberResponse] = []
    for m in team.members:
        member_user = m.user
        member_list.append(
            TeamMemberResponse(
                id=m.id,
                team_id=m.team_id,
                user_id=m.user_id,
                role=m.role,
                joined_at=m.joined_at,
                user_name=member_user.full_name if member_user else f"User #{m.user_id}",
                user_email=member_user.email if member_user else "",
                user_system_role=member_user.role.name if member_user and member_user.role else "Employee",
            )
        )

    creator_name = team.creator.full_name if team.creator else f"User #{team.created_by}"
    return TeamResponse(
        id=team.id,
        name=team.name,
        description=team.description,
        created_by=team.created_by,
        created_at=team.created_at,
        updated_at=team.updated_at,
        creator_name=creator_name,
        member_count=len(team.members),
        members=member_list,
    )


def create_team(db: Session, team_in: TeamCreateRequest, current_user: User) -> TeamResponse:
    """Creates a new team and adds the creator as the initial Lead member."""
    normalized_name = team_in.name.strip()
    existing = db.query(Team).filter(Team.name.ilike(normalized_name)).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"A team with the name '{normalized_name}' already exists."
        )

    desc_parts = []
    if team_in.purpose and team_in.purpose.strip():
        desc_parts.append(f"Purpose: {team_in.purpose.strip()}")
    if team_in.description and team_in.description.strip():
        desc_parts.append(team_in.description.strip())
    final_description = "\n\n".join(desc_parts) if desc_parts else None

    team = Team(
        name=normalized_name,
        description=final_description,
        created_by=current_user.id,
    )
    db.add(team)
    db.flush()

    # Add creator as initial Lead member
    initial_member = TeamMember(
        team_id=team.id,
        user_id=current_user.id,
        role="Lead",
    )
    db.add(initial_member)

    create_audit_log(
        db=db,
        action=AuditActionEnum.TEAM_CREATED,
        entity_type="Team",
        entity_id=team.id,
        user_id=current_user.id,
        description=f"Created team '{team.name}'",
        details={"team_id": team.id, "name": team.name, "created_by": current_user.id},
        skip_commit=True,
    )

    db.commit()
    db.refresh(team)
    return _format_team_response(team)


def get_teams(db: Session, current_user: User, skip: int = 0, limit: int = 100) -> List[TeamResponse]:
    """Retrieves all teams in the organization ordered by updated_at desc."""
    teams = db.query(Team).order_by(Team.updated_at.desc()).offset(skip).limit(limit).all()
    return [_format_team_response(t) for t in teams]


def get_team_by_id(db: Session, team_id: int, current_user: User) -> TeamResponse:
    """Retrieves a single team with full member roster."""
    team = db.query(Team).filter(Team.id == team_id).first()
    if not team:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Team with ID {team_id} not found."
        )
    return _format_team_response(team)


def update_team(db: Session, team_id: int, team_in: TeamUpdateRequest, current_user: User) -> TeamResponse:
    """Updates team metadata. Requires Administrator, Manager, creator, or team Lead."""
    team = db.query(Team).filter(Team.id == team_id).first()
    if not team:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Team with ID {team_id} not found."
        )

    if not _check_team_management_permission(team, current_user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden: You do not have permission to manage this team."
        )

    if team_in.name is not None:
        normalized_name = team_in.name.strip()
        existing = db.query(Team).filter(Team.name.ilike(normalized_name), Team.id != team_id).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"A team with the name '{normalized_name}' already exists."
            )
        team.name = normalized_name

    if team_in.description is not None:
        team.description = team_in.description.strip() if team_in.description else None

    create_audit_log(
        db=db,
        action=AuditActionEnum.TEAM_UPDATED,
        entity_type="Team",
        entity_id=team.id,
        user_id=current_user.id,
        description=f"Updated team '{team.name}'",
        details={"team_id": team.id, "name": team.name},
        skip_commit=True,
    )

    db.commit()
    db.refresh(team)
    return _format_team_response(team)


def delete_team(db: Session, team_id: int, current_user: User) -> None:
    """Deletes a team. Requires Administrator, Manager, or team creator."""
    team = db.query(Team).filter(Team.id == team_id).first()
    if not team:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Team with ID {team_id} not found."
        )

    if not _check_team_management_permission(team, current_user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden: You do not have permission to delete this team."
        )

    team_name = team.name
    create_audit_log(
        db=db,
        action=AuditActionEnum.TEAM_DELETED,
        entity_type="Team",
        entity_id=team.id,
        user_id=current_user.id,
        description=f"Deleted team '{team_name}'",
        details={"team_id": team_id, "name": team_name},
        skip_commit=True,
    )

    db.delete(team)
    db.commit()


def add_team_member(db: Session, team_id: int, member_in: TeamMemberAddRequest, current_user: User) -> TeamMemberResponse:
    """Adds a user to a team. Requires team management permissions."""
    team = db.query(Team).filter(Team.id == team_id).first()
    if not team:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Team with ID {team_id} not found."
        )

    if not _check_team_management_permission(team, current_user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden: You do not have permission to add members to this team."
        )

    target_user = db.query(User).filter(User.id == member_in.user_id).first()
    if not target_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User with ID {member_in.user_id} not found."
        )

    existing_member = db.query(TeamMember).filter(
        TeamMember.team_id == team_id,
        TeamMember.user_id == member_in.user_id
    ).first()
    if existing_member:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"User '{target_user.full_name}' is already a member of this team."
        )

    member = TeamMember(
        team_id=team_id,
        user_id=member_in.user_id,
        role=member_in.role or "Member",
    )
    db.add(member)

    create_audit_log(
        db=db,
        action=AuditActionEnum.TEAM_MEMBER_ADDED,
        entity_type="Team",
        entity_id=team.id,
        user_id=current_user.id,
        description=f"Added '{target_user.full_name}' to team '{team.name}' as {member.role}",
        details={"team_id": team_id, "user_id": target_user.id, "role": member.role},
        skip_commit=True,
    )

    db.commit()
    db.refresh(member)

    return TeamMemberResponse(
        id=member.id,
        team_id=member.team_id,
        user_id=member.user_id,
        role=member.role,
        joined_at=member.joined_at,
        user_name=target_user.full_name,
        user_email=target_user.email,
        user_system_role=target_user.role.name if target_user.role else "Employee",
    )


def remove_team_member(db: Session, team_id: int, user_id: int, current_user: User) -> None:
    """Removes a user from a team. Requires team management permission or self-removal."""
    team = db.query(Team).filter(Team.id == team_id).first()
    if not team:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Team with ID {team_id} not found."
        )

    is_self = current_user.id == user_id
    if not (is_self or _check_team_management_permission(team, current_user)):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden: You do not have permission to remove this member."
        )

    member = db.query(TeamMember).filter(
        TeamMember.team_id == team_id,
        TeamMember.user_id == user_id
    ).first()
    if not member:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Member with User ID {user_id} is not in team {team_id}."
        )

    target_user = member.user
    user_name = target_user.full_name if target_user else f"User #{user_id}"

    create_audit_log(
        db=db,
        action=AuditActionEnum.TEAM_MEMBER_REMOVED,
        entity_type="Team",
        entity_id=team.id,
        user_id=current_user.id,
        description=f"Removed '{user_name}' from team '{team.name}'",
        details={"team_id": team_id, "user_id": user_id},
        skip_commit=True,
    )

    db.delete(member)
    db.commit()


def get_team_workspace(db: Session, team_id: int, current_user: User) -> dict:
    """Retrieves consolidated data for the 7 tabs of the Team Workspace."""
    from sqlalchemy import or_, and_
    from sqlalchemy.orm import joinedload
    from app.models.decision import Decision
    from app.models.discussion import Discussion
    from app.models.document import Document
    from app.models.audit_log import AuditLog

    team = db.query(Team).filter(Team.id == team_id).first()
    if not team:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Team #{team_id} not found.")

    formatted_team = _format_team_response(team)

    team_decisions = db.query(Decision).options(
        joinedload(Decision.creator),
        joinedload(Decision.category)
    ).filter(Decision.team_id == team_id).order_by(Decision.created_at.desc()).all()

    decision_ids = [d.id for d in team_decisions]

    decisions_list = []
    status_counts = {"Draft": 0, "Submitted": 0, "Under Review": 0, "Approved": 0, "Rejected": 0, "Archived": 0}
    for d in team_decisions:
        status_counts[d.status] = status_counts.get(d.status, 0) + 1
        decisions_list.append({
            "id": d.id,
            "title": d.title,
            "problem_statement": d.problem_statement,
            "status": d.status,
            "category_id": d.category_id,
            "category_name": d.category.name if d.category else None,
            "created_by": d.created_by,
            "creator_name": d.creator.full_name if d.creator else None,
            "created_at": d.created_at,
            "updated_at": d.updated_at,
        })

    discussions_list = []
    if decision_ids:
        discussions = db.query(Discussion).options(
            joinedload(Discussion.user),
            joinedload(Discussion.decision)
        ).filter(Discussion.decision_id.in_(decision_ids)).order_by(Discussion.created_at.desc()).limit(50).all()
        for disc in discussions:
            discussions_list.append({
                "id": disc.id,
                "decision_id": disc.decision_id,
                "decision_title": disc.decision.title if disc.decision else None,
                "user_name": disc.user.full_name if disc.user else None,
                "comment": disc.comment,
                "created_at": disc.created_at,
            })

    documents_list = []
    if decision_ids:
        docs = db.query(Document).options(
            joinedload(Document.uploader),
            joinedload(Document.decision)
        ).filter(Document.decision_id.in_(decision_ids)).order_by(Document.created_at.desc()).all()
        for doc in docs:
            documents_list.append({
                "id": doc.id,
                "decision_id": doc.decision_id,
                "decision_title": doc.decision.title if doc.decision else None,
                "original_filename": doc.original_filename,
                "file_type": doc.file_type,
                "file_size": doc.file_size,
                "uploader_name": doc.uploader.full_name if doc.uploader else None,
                "download_url": f"/api/v1/decisions/{doc.decision_id}/documents/{doc.id}/download",
                "created_at": doc.created_at,
            })

    if decision_ids:
        activity_query = db.query(AuditLog).options(joinedload(AuditLog.user)).filter(
            or_(
                and_(AuditLog.entity_type == "Team", AuditLog.entity_id == team_id),
                and_(AuditLog.entity_type == "Decision", AuditLog.entity_id.in_(decision_ids))
            )
        ).order_by(AuditLog.created_at.desc()).limit(50).all()
    else:
        activity_query = db.query(AuditLog).options(joinedload(AuditLog.user)).filter(
            AuditLog.entity_type == "Team",
            AuditLog.entity_id == team_id
        ).order_by(AuditLog.created_at.desc()).limit(50).all()

    activity_list = []
    for act in activity_query:
        activity_list.append({
            "id": act.id,
            "action": act.action,
            "description": act.description,
            "actor_name": act.user.full_name if act.user else "System",
            "entity_type": act.entity_type,
            "entity_id": act.entity_id,
            "timestamp": act.created_at,
        })

    member_metrics = []
    for m in team.members:
        u = m.user
        dec_count = sum(1 for d in team_decisions if d.created_by == m.user_id)
        member_metrics.append({
            "user_id": m.user_id,
            "name": u.full_name if u else f"User #{m.user_id}",
            "role": m.role,
            "decisions_created": dec_count,
            "joined_at": m.joined_at,
        })

    return {
        "team": formatted_team,
        "overview": {
            "total_decisions": len(team_decisions),
            "status_counts": status_counts,
            "member_count": len(team.members),
            "recent_decisions": decisions_list[:5],
            "recent_activity": activity_list[:5],
        },
        "decisions": decisions_list,
        "members": formatted_team.members,
        "discussions": discussions_list,
        "documents": documents_list,
        "activity": activity_list,
        "reports": {
            "total_decisions": len(team_decisions),
            "status_distribution": status_counts,
            "member_metrics": member_metrics,
        }
    }
