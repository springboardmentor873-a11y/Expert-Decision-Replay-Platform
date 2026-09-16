from datetime import datetime, UTC
from uuid import UUID
from typing import Any
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.collaboration import Notification
from app.models.decision import Decision, Stakeholder
from app.models.identity import Role, TeamMember, User


def create_notification(
    db: Session,
    user_id: UUID,
    type: str,
    title: str,
    body: str | None = None,
    decision_id: UUID | None = None,
    payload: dict[str, Any] | None = None,
) -> Notification:
    """Create an in-app notification for a user."""
    notif = Notification(
        user_id=user_id,
        decision_id=decision_id,
        type=type,
        title=title,
        body=body,
        payload=payload or {},
        created_at=datetime.now(UTC),
    )
    db.add(notif)
    db.flush()
    return notif



def notify_users_with_role(
    db: Session,
    role_codes: list[str],
    type: str,
    title: str,
    body: str | None = None,
    decision_id: UUID | None = None,
    payload: dict[str, Any] | None = None,
    exclude_user_id: UUID | None = None,
) -> list[Notification]:
    """Send notification to all active users having any of the specified roles."""
    query = (
        select(User)
        .join(Role, User.role_id == Role.id)
        .where(
            Role.code.in_(role_codes),
            User.is_active == True,
            User.deleted_at.is_(None),
        )
    )
    if exclude_user_id:
        query = query.where(User.id != exclude_user_id)

    users = db.scalars(query).all()
    created = []
    for u in users:
        n = create_notification(
            db=db,
            user_id=u.id,
            type=type,
            title=title,
            body=body,
            decision_id=decision_id,
            payload=payload,
        )
        created.append(n)
    return created


def notify_decision_stakeholders(
    db: Session,
    decision_id: UUID,
    type: str,
    title: str,
    body: str | None = None,
    payload: dict[str, Any] | None = None,
    exclude_user_id: UUID | None = None,
) -> list[Notification]:
    """
    Notify all relevant personnel regarding a decision change, score update, or file upload:
    1. Decision Owner / Author
    2. Assigned Stakeholders
    3. Team members (if assigned to a team)
    4. System Administrators, Managers, Reviewers
    Excluding the actor performing the action.
    """
    recipient_ids: set[UUID] = set()

    decision = db.scalar(select(Decision).where(Decision.id == decision_id, Decision.deleted_at.is_(None)))
    if decision and decision.owner_id:
        recipient_ids.add(decision.owner_id)

    # Add assigned stakeholders
    stakeholders = db.scalars(
        select(Stakeholder).where(Stakeholder.decision_id == decision_id, Stakeholder.deleted_at.is_(None))
    ).all()
    for s in stakeholders:
        if s.user_id:
            recipient_ids.add(s.user_id)
        elif s.email:
            u = db.scalar(select(User).where(User.email.ilike(s.email.strip()), User.deleted_at.is_(None)))
            if u:
                recipient_ids.add(u.id)

    # Add team members if decision belongs to a team
    if decision and decision.team_id:
        team_members = db.scalars(
            select(TeamMember.user_id).where(TeamMember.team_id == decision.team_id)
        ).all()
        for t_uid in team_members:
            recipient_ids.add(t_uid)

    # Add governance members (Admins, Managers, Reviewers)
    gov_users = db.scalars(
        select(User.id)
        .join(Role, User.role_id == Role.id)
        .where(
            Role.code.in_(["administrator", "manager", "reviewer"]),
            User.is_active == True,
            User.deleted_at.is_(None),
        )
    ).all()
    for g_uid in gov_users:
        recipient_ids.add(g_uid)

    # Exclude the actor
    if exclude_user_id:
        recipient_ids.discard(exclude_user_id)

    created = []
    for uid in recipient_ids:
        n = create_notification(
            db=db,
            user_id=uid,
            type=type,
            title=title,
            body=body,
            decision_id=decision_id,
            payload=payload or {},
        )
        created.append(n)
    return created

