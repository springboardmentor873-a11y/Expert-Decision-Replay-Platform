"""
Central audit logging.

`record_audit` is the single entry point that writes an `AuditLog` row.
Workflow services call the named helpers below (one line each) so the
mapping between a state change and what gets recorded lives in exactly
one place.

No function here commits — rows are added to the caller's active session
and persisted by the transaction that performs the state change, keeping
the workflow transition and its audit trail atomic.

This service intentionally has no update/delete helpers: audit logs are
immutable by design.
"""
import uuid

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.audit_log import AuditAction, AuditLog
from app.models.decision import Decision
from app.models.user import User


async def record_audit(
    db: AsyncSession,
    *,
    actor_id: uuid.UUID,
    decision_id: uuid.UUID,
    action: AuditAction,
    details: str | None = None,
) -> None:
    db.add(
        AuditLog(
            actor_id=actor_id,
            decision_id=decision_id,
            action=action,
            details=details,
        )
    )


async def record_decision_created(db: AsyncSession, decision: Decision, actor: User) -> None:
    await record_audit(
        db,
        actor_id=actor.id,
        decision_id=decision.id,
        action=AuditAction.DECISION_CREATED,
        details=f"Decision '{decision.title}' created by {actor.full_name}.",
    )


async def record_decision_updated(db: AsyncSession, decision: Decision, actor: User) -> None:
    await record_audit(
        db,
        actor_id=actor.id,
        decision_id=decision.id,
        action=AuditAction.DECISION_UPDATED,
        details=f"Decision '{decision.title}' updated by {actor.full_name}.",
    )


async def record_decision_submitted(db: AsyncSession, decision: Decision, actor: User) -> None:
    await record_audit(
        db,
        actor_id=actor.id,
        decision_id=decision.id,
        action=AuditAction.DECISION_SUBMITTED,
        details=f"Decision '{decision.title}' submitted for review by {actor.full_name}.",
    )


async def record_decision_archived(db: AsyncSession, decision: Decision, actor: User) -> None:
    await record_audit(
        db,
        actor_id=actor.id,
        decision_id=decision.id,
        action=AuditAction.DECISION_ARCHIVED,
        details=f"Decision '{decision.title}' archived by {actor.full_name}.",
    )


async def record_reviewer_approved(db: AsyncSession, decision: Decision, actor: User) -> None:
    await record_audit(
        db,
        actor_id=actor.id,
        decision_id=decision.id,
        action=AuditAction.REVIEWER_APPROVED,
        details=f"Decision '{decision.title}' approved by {actor.full_name} (Reviewer).",
    )


async def record_reviewer_rejected(
    db: AsyncSession, decision: Decision, actor: User, reason: str
) -> None:
    await record_audit(
        db,
        actor_id=actor.id,
        decision_id=decision.id,
        action=AuditAction.REVIEWER_REJECTED,
        details=(
            f"Decision '{decision.title}' returned to draft by {actor.full_name} (Reviewer)."
            f" Reason: {reason}"
        ),
    )


async def record_manager_approved(db: AsyncSession, decision: Decision, actor: User) -> None:
    await record_audit(
        db,
        actor_id=actor.id,
        decision_id=decision.id,
        action=AuditAction.MANAGER_APPROVED,
        details=f"Decision '{decision.title}' approved by {actor.full_name} (Manager).",
    )


async def record_manager_rejected(
    db: AsyncSession, decision: Decision, actor: User, reason: str
) -> None:
    await record_audit(
        db,
        actor_id=actor.id,
        decision_id=decision.id,
        action=AuditAction.MANAGER_REJECTED,
        details=(
            f"Decision '{decision.title}' rejected by {actor.full_name} (Manager)."
            f" Reason: {reason}"
        ),
    )


async def query_audit_logs(
    db: AsyncSession,
    *,
    decision_id: uuid.UUID | None = None,
    actor_id: uuid.UUID | None = None,
    action: AuditAction | None = None,
    limit: int = 50,
    offset: int = 0,
) -> tuple[list[AuditLog], int]:
    """Return (logs, total_count) for the given filters, newest first."""
    filters = []
    if decision_id is not None:
        filters.append(AuditLog.decision_id == decision_id)
    if actor_id is not None:
        filters.append(AuditLog.actor_id == actor_id)
    if action is not None:
        filters.append(AuditLog.action == action)

    logs = await db.execute(
        select(AuditLog)
        .where(*filters)
        .options(selectinload(AuditLog.actor), selectinload(AuditLog.decision))
        .order_by(AuditLog.created_at.desc(), AuditLog.id.desc())
        .limit(limit)
        .offset(offset)
    )
    total = await db.execute(select(func.count()).select_from(AuditLog).where(*filters))
    return logs.scalars().all(), total.scalar_one()