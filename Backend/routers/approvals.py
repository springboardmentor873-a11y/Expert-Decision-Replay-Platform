from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database.database import get_db
from models.decision import Decision, DecisionStatus
from models.role import Role
from models.user import User
from security.auth import get_current_user, require_role
from services.milestone3 import add_audit, add_notification, add_version_snapshot

router = APIRouter(prefix="/decisions", tags=["Approval Workflow"])


def _get_decision(decision_id: int, db: Session) -> Decision:
    decision = db.query(Decision).filter(Decision.id == decision_id).first()
    if not decision:
        raise HTTPException(status_code=404, detail="Decision not found")
    return decision


@router.post("/{decision_id}/submit")
def submit_for_review(
    decision_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    decision = _get_decision(decision_id, db)
    if decision.created_by_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only the decision creator can submit it")
    if decision.status != DecisionStatus.draft:
        raise HTTPException(status_code=400, detail="Only Draft decisions can be submitted")

    decision.status = DecisionStatus.under_review
    add_version_snapshot(db, decision, current_user, "Submitted for review")
    add_audit(db, current_user, "decision_submitted", decision, "Decision submitted for manager review")
    approvers = (
        db.query(User)
        .join(User.role)
        .filter(Role.name.in_(("reviewer", "manager", "administrator")))
        .all()
    )
    for approver in approvers:
        add_notification(
            db,
            approver.id,
            f'Decision "{decision.title}" was submitted for review.',
            decision,
        )
    db.commit()
    db.refresh(decision)
    return decision


@router.post("/{decision_id}/approve")
def approve_decision(
    decision_id: int,
    db: Session = Depends(get_db),
    manager: User = Depends(require_role("reviewer", "manager", "administrator")),
):
    decision = _get_decision(decision_id, db)
    if decision.status != DecisionStatus.under_review:
        raise HTTPException(status_code=400, detail="Only Under Review decisions can be approved")

    decision.status = DecisionStatus.approved
    add_version_snapshot(db, decision, manager, "Approved")
    add_audit(db, manager, "decision_approved", decision, "Decision approved")
    add_notification(db, decision.created_by_id, f'Decision "{decision.title}" was approved.', decision)
    db.commit()
    db.refresh(decision)
    return decision


@router.post("/{decision_id}/reject")
def reject_decision(
    decision_id: int,
    db: Session = Depends(get_db),
    manager: User = Depends(require_role("reviewer", "manager", "administrator")),
):
    decision = _get_decision(decision_id, db)
    if decision.status != DecisionStatus.under_review:
        raise HTTPException(status_code=400, detail="Only Under Review decisions can be rejected")

    decision.status = DecisionStatus.rejected
    add_version_snapshot(db, decision, manager, "Rejected")
    add_audit(db, manager, "decision_rejected", decision, "Decision rejected")
    add_notification(db, decision.created_by_id, f'Decision "{decision.title}" was rejected.', decision)
    db.commit()
    db.refresh(decision)
    return decision
