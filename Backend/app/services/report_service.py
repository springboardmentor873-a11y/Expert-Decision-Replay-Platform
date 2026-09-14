"""
Management report queries.

All metrics are computed from existing tables (`decisions`, `approvals`,
`users`, `teams`) — no extra tables are needed. Every query restricts the
rows it counts using the requested date range:

- decision-based metrics filter on `decisions.created_at`
- approval-based metrics filter on `approvals.created_at`

Aggregations are done in SQL (`func.count` + `group_by`) so we only pull
back small rollups, never full result sets.
"""
from datetime import date, timedelta

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.approval import Approval, ApprovalAction, ApprovalStage
from app.models.decision import Decision, DecisionStatus
from app.models.team import Team
from app.models.user import User, UserRole


def _decision_filters(start: date | None, end: date | None) -> list:
    filters = []
    if start is not None:
        filters.append(Decision.created_at >= start)
    if end is not None:
        # end is inclusive: created_at is a timestamp, so cover the whole day
        filters.append(Decision.created_at < end + timedelta(days=1))
    return filters


def _approval_filters(start: date | None, end: date | None) -> list:
    filters = []
    if start is not None:
        filters.append(Approval.created_at >= start)
    if end is not None:
        filters.append(Approval.created_at < end + timedelta(days=1))
    return filters


async def _action_counts_by_stage(
    db: AsyncSession,
    start: date | None,
    end: date | None,
    stage: ApprovalStage,
) -> tuple[int, int]:
    """Return (approvals, rejections) for a single approval stage."""
    filters = [Approval.approval_stage == stage] + _approval_filters(start, end)
    result = await db.execute(
        select(Approval.action, func.count()).where(*filters).group_by(Approval.action)
    )
    counts = {action: n for action, n in result.all()}
    return counts.get(ApprovalAction.APPROVE, 0), counts.get(ApprovalAction.REJECT, 0)


async def build_summary(db: AsyncSession, start: date | None, end: date | None) -> dict:
    d_filters = _decision_filters(start, end)
    a_filters = _approval_filters(start, end)

    total_decisions = (
        await db.execute(select(func.count()).select_from(Decision).where(*d_filters))
    ).scalar_one()

    total_approvals = (
        await db.execute(
            select(func.count())
            .select_from(Approval)
            .where(*a_filters, Approval.action == ApprovalAction.APPROVE)
        )
    ).scalar_one()

    total_rejections = (
        await db.execute(
            select(func.count())
            .select_from(Approval)
            .where(*a_filters, Approval.action == ApprovalAction.REJECT)
        )
    ).scalar_one()

    pending_review = (
        await db.execute(
            select(func.count())
            .select_from(Decision)
            .where(
                *d_filters,
                Decision.status.in_(
                    (DecisionStatus.UNDER_REVIEW, DecisionStatus.PENDING_MANAGER_REVIEW)
                ),
            )
        )
    ).scalar_one()

    # Decisions per status (full set so zero-count statuses still appear).
    status_result = await db.execute(
        select(Decision.status, func.count()).where(*d_filters).group_by(Decision.status)
    )
    status_totals = {status: n for status, n in status_result.all()}
    by_status = [{"status": s.value, "count": status_totals.get(s, 0)} for s in DecisionStatus]

    reviewer_approvals, reviewer_rejections = await _action_counts_by_stage(
        db, start, end, ApprovalStage.REVIEWER
    )
    manager_approvals, manager_rejections = await _action_counts_by_stage(
        db, start, end, ApprovalStage.MANAGER
    )

    users_total = (
        await db.execute(select(func.count()).select_from(User))
    ).scalar_one()
    users_active = (
        await db.execute(select(func.count()).select_from(User).where(User.is_active.is_(True)))
    ).scalar_one()

    role_result = await db.execute(select(User.role, func.count()).group_by(User.role))
    role_totals = {role: n for role, n in role_result.all()}
    by_role = [{"role": r.value, "count": role_totals.get(r, 0)} for r in UserRole]

    teams = (await db.execute(select(Team).order_by(Team.name))).scalars().all()

    team_decision_counts = {
        team_id: n
        for team_id, n in (
            await db.execute(
                select(Decision.team_id, func.count())
                .where(*d_filters, Decision.team_id.is_not(None))
                .group_by(Decision.team_id)
            )
        ).all()
    }
    team_user_counts = {
        team_id: n
        for team_id, n in (
            await db.execute(
                select(User.team_id, func.count())
                .where(User.team_id.is_not(None))
                .group_by(User.team_id)
            )
        ).all()
    }

    by_team = [
        {
            "team_id": team.id,
            "team_name": team.name,
            "users": team_user_counts.get(team.id, 0),
            "decisions": team_decision_counts.get(team.id, 0),
        }
        for team in teams
    ]

    return {
        "start_date": start,
        "end_date": end,
        "total_decisions": total_decisions,
        "total_approvals": total_approvals,
        "total_rejections": total_rejections,
        "pending_review": pending_review,
        "by_status": by_status,
        "by_reviewer": {"approvals": reviewer_approvals, "rejections": reviewer_rejections},
        "by_manager": {"approvals": manager_approvals, "rejections": manager_rejections},
        "users": {
            "total_users": users_total,
            "active_users": users_active,
            "by_role": by_role,
        },
        "teams": {"total_teams": len(teams), "by_team": by_team},
    }


async def query_status_breakdown(
    db: AsyncSession, start: date | None, end: date | None
) -> dict:
    filters = _decision_filters(start, end)
    result = await db.execute(
        select(Decision.status, func.count()).where(*filters).group_by(Decision.status)
    )
    totals = {status: n for status, n in result.all()}
    return {
        "start_date": start,
        "end_date": end,
        "total": sum(totals.values()),
        "by_status": [{"status": s.value, "count": totals.get(s, 0)} for s in DecisionStatus],
    }


async def query_activity(
    db: AsyncSession,
    start: date | None,
    end: date | None,
    limit: int = 90,
) -> dict:
    """Daily counts (newest first) of decisions created and approvals actioned."""
    decisions_by_day = await db.execute(
        select(func.date(Decision.created_at).label("day"), func.count())
        .where(*_decision_filters(start, end))
        .group_by(func.date(Decision.created_at))
        .order_by(func.date(Decision.created_at).desc())
        .limit(limit)
    )
    approvals_by_day = await db.execute(
        select(func.date(Approval.created_at).label("day"), func.count())
        .where(*_approval_filters(start, end))
        .group_by(func.date(Approval.created_at))
        .order_by(func.date(Approval.created_at).desc())
        .limit(limit)
    )
    decision_counts = {str(day): n for day, n in decisions_by_day.all()}
    approval_counts = {str(day): n for day, n in approvals_by_day.all()}

    all_days = sorted(set(decision_counts) | set(approval_counts), reverse=True)
    return {
        "start_date": start,
        "end_date": end,
        "total_decisions_created": sum(decision_counts.values()),
        "total_approvals_actioned": sum(approval_counts.values()),
        "points": [
            {
                "date": day,
                "decisions_created": decision_counts.get(day, 0),
                "approvals_actioned": approval_counts.get(day, 0),
            }
            for day in all_days
        ],
    }


async def query_user_stats(
    db: AsyncSession,
    start: date | None,
    end: date | None,
    limit: int = 50,
    offset: int = 0,
) -> tuple[list[dict], int]:
    """Per-user aggregates (decisions created, approvals given, rejections given)."""
    created_counts = {
        user_id: n
        for user_id, n in (
            await db.execute(
                select(Decision.created_by, func.count())
                .where(*_decision_filters(start, end))
                .group_by(Decision.created_by)
            )
        ).all()
    }
    approved_counts = {
        user_id: n
        for user_id, n in (
            await db.execute(
                select(Approval.user_id, func.count())
                .where(*_approval_filters(start, end), Approval.action == ApprovalAction.APPROVE)
                .group_by(Approval.user_id)
            )
        ).all()
    }
    rejected_counts = {
        user_id: n
        for user_id, n in (
            await db.execute(
                select(Approval.user_id, func.count())
                .where(*_approval_filters(start, end), Approval.action == ApprovalAction.REJECT)
                .group_by(Approval.user_id)
            )
        ).all()
    }

    total_users = (await db.execute(select(func.count()).select_from(User))).scalar_one()
    users = (await db.execute(select(User).order_by(User.full_name))).scalars().all()

    rows = [
        {
            "user_id": user.id,
            "full_name": user.full_name,
            "role": user.role.value,
            "decisions_created": created_counts.get(user.id, 0),
            "approvals": approved_counts.get(user.id, 0),
            "rejections": rejected_counts.get(user.id, 0),
        }
        for user in users
    ]
    rows.sort(
        key=lambda r: (-r["decisions_created"], -r["approvals"], r["full_name"])
    )
    return rows[offset : offset + limit], total_users