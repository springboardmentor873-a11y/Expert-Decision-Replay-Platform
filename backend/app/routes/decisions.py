from fastapi import APIRouter
from fastapi import Depends
from fastapi import HTTPException

from sqlalchemy.orm import Session
from sqlalchemy import func

import os

from typing import Optional

from datetime import datetime

from app.database import get_db
from app.models import Decision
from app.models import DecisionAlternative
from app.models import DecisionVersion
from app.models import DecisionDocument
from app.models import DecisionApproval
from app.models import User
from app.models import Team
from app.auth import get_current_user
from app.routes.notifications import create_workflow_notifications
from app.audit import record_audit
from app.audit import record_workflow_audit
from app.audit import record_decision_created_audit
from app.audit import record_decision_updated_audit
from app.schemas import DecisionCreate
from app.schemas import DecisionUpdate
from app.schemas import DecisionReviewRequest


# ==========================================
# ROUTER
# ==========================================

router = APIRouter(
    prefix="/decisions",
    tags=["Decision Management"]
)


# ==========================================
# VALID VALUES
# ==========================================

VALID_STATUSES = [
    "Draft",
    "Under Review",
    "Reviewer Approved",
    "Approved",
    "Rejected",
    "Archived"
]

VALID_IMPLEMENTATION_STATUSES = [
    "Not Started",
    "In Progress",
    "Completed"
]

VALID_ALTERNATIVE_LEVELS = [
    "Low",
    "Medium",
    "High"
]


# ==========================================
# HELPER: VALIDATE ALTERNATIVE LEVELS
# ==========================================

def validate_alternative_levels(alternatives):

    for alt in alternatives:

        if (
            alt.feasibility
            and alt.feasibility not in VALID_ALTERNATIVE_LEVELS
        ):

            raise HTTPException(
                status_code=422,
                detail=(
                    "Invalid feasibility value. "
                    "Allowed values: Low, Medium, High"
                )
            )

        if (
            alt.risk_level
            and alt.risk_level not in VALID_ALTERNATIVE_LEVELS
        ):

            raise HTTPException(
                status_code=422,
                detail=(
                    "Invalid risk level value. "
                    "Allowed values: Low, Medium, High"
                )
            )


# ==========================================
# HELPER: ALTERNATIVE FIELDS
# ==========================================

def alternative_field_values(alt, current_user):

    return {
        "decision_id": None,
        "title": alt.title.strip() if alt.title else "",
        "description": alt.description,
        "pros": alt.pros,
        "cons": alt.cons,
        "estimated_cost": alt.estimated_cost,
        "feasibility": alt.feasibility,
        "risk_level": alt.risk_level,
        "risk_explanation": alt.risk_explanation,
        "is_recommended": bool(alt.is_recommended),
        "created_by": current_user.user_id,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }


# ==========================================
# HELPER: RECORD HISTORY VERSION
# ==========================================

def record_version(
    db: Session,
    decision: Decision,
    user,
    summary: str
):

    last_number = (
        db.query(func.max(DecisionVersion.version_number))
        .filter(
            DecisionVersion.decision_id == decision.decision_id
        )
        .scalar()
    )

    version = DecisionVersion(
        decision_id=decision.decision_id,
        version_number=(last_number or 0) + 1,
        title=decision.title,
        description=decision.description,
        decision_context=decision.decision_context,
        problem_statement=decision.problem_statement,
        objective=decision.objective,
        evaluation_criteria=decision.evaluation_criteria,
        risks=decision.risks,
        stakeholders=decision.stakeholders,
        implementation_status=decision.implementation_status,
        rationale=decision.rationale,
        final_outcome=decision.final_outcome,
        status=decision.status,
        priority=decision.priority,
        category_id=decision.category_id,
        changed_by=user.user_id,
        changed_at=datetime.utcnow(),
        change_summary=summary
    )

    db.add(version)

    return version


# ==========================================
# HELPER: RECORD APPROVAL HISTORY
# ==========================================

def record_approval(
    db: Session,
    decision: Decision,
    action: str,
    user,
    reason: Optional[str] = None
):

    approval = DecisionApproval(
        decision_id=decision.decision_id,
        action=action,
        role_id=user.role_id,
        user_id=user.user_id,
        reason=reason
    )

    db.add(approval)

    return approval


# ==========================================
# HELPER: REPLACE ALTERNATIVES
# ==========================================

def replace_alternatives(
    db: Session,
    decision: Decision,
    alternatives,
    current_user
):

    if alternatives:

        validate_alternative_levels(alternatives)

        recommended_seen = False

        for alt in alternatives:

            if getattr(alt, "is_recommended", False):

                if recommended_seen:

                    raise HTTPException(
                        status_code=422,
                        detail=(
                            "Only one alternative can be "
                            "marked as recommended"
                        )
                    )

                recommended_seen = True

    db.query(DecisionAlternative).filter(
        DecisionAlternative.decision_id == decision.decision_id
    ).delete()

    if not alternatives:
        return

    for alt in alternatives:

        values = alternative_field_values(
            alt,
            current_user
        )

        values["decision_id"] = decision.decision_id

        db.add(
            DecisionAlternative(**values)
        )


# ==========================================
# HELPER: DECISION DICT
# ==========================================

def decision_dict(
    decision: Decision,
    include_details: bool = False
):

    data = {
        "decision_id": decision.decision_id,
        "expert_id": decision.expert_id,
        "expert_name": (
            decision.expert.name
            if decision.expert
            else None
        ),
        "team_id": (
            decision.expert.team_id
            if decision.expert and decision.expert.team_id
            else None
        ),
        "team_name": (
            decision.expert.team.team_name
            if decision.expert
            and decision.expert.team
            else None
        ),
        "title": decision.title,
        "description": decision.description,
        "decision_context": decision.decision_context,
        "decision_date": decision.decision_date,
        "status": decision.status,
        "problem_statement": decision.problem_statement,
        "objective": decision.objective,
        "evaluation_criteria": decision.evaluation_criteria,
        "risks": decision.risks,
        "stakeholders": decision.stakeholders,
        "rationale": decision.rationale,
        "final_outcome": decision.final_outcome,
        "implementation_status": decision.implementation_status,
        "priority": decision.priority,
        "assigned_to": decision.assigned_to,
        "assigned_name": (
            decision.assigned.name
            if decision.assigned
            else None
        ),
        "category_id": (
            decision.category_id
            if decision.category_id
            else None
        ),
        "category_name": (
            decision.category.category_name
            if decision.category
            else None
        ),
        "created_at": decision.created_at,
        "updated_at": decision.updated_at
    }

    if include_details:

        data["alternatives"] = [
            {
                "alternative_id": a.alternative_id,
                "decision_id": a.decision_id,
                "title": a.title,
                "description": a.description,
                "pros": a.pros,
                "cons": a.cons,
                "estimated_cost": (
                    float(a.estimated_cost)
                    if a.estimated_cost is not None
                    else None
                ),
                "feasibility": a.feasibility,
                "risk_level": a.risk_level,
                "risk_explanation": a.risk_explanation,
                "is_recommended": bool(a.is_recommended),
                "created_by": a.created_by,
                "created_by_name": (
                    a.creator.name
                    if a.creator
                    else None
                ),
                "created_at": a.created_at,
                "updated_at": a.updated_at
            }
            for a in sorted(
                decision.alternatives,
                key=lambda x: x.alternative_id
            )
        ]

        data["history"] = [
            {
                "version_id": v.version_id,
                "version_number": v.version_number,
                "change_summary": v.change_summary,
                "changed_by": v.changed_by,
                "changed_by_name": (
                    v.changer.name
                    if v.changer
                    else None
                ),
                "changed_at": v.changed_at,
                "status": v.status,
                "implementation_status": v.implementation_status
            }
            for v in sorted(
                decision.versions,
                key=lambda x: x.version_number
            )
        ]

        data["comments"] = [
            {
                "comment_id": c.comment_id,
                "decision_id": c.decision_id,
                "user_id": c.user_id,
                "author_name": (
                    c.author.name
                    if c.author
                    else None
                ),
                "content": c.content,
                "created_at": c.created_at,
                "updated_at": c.updated_at
            }
            for c in sorted(
                decision.comments,
                key=lambda x: x.comment_id
            )
        ]

        data["approvals"] = [
            {
                "approval_id": a.approval_id,
                "decision_id": a.decision_id,
                "action": a.action,
                "role_id": a.role_id,
                "role_name": (
                    a.role.role_name
                    if a.role
                    else None
                ),
                "user_id": a.user_id,
                "user_name": (
                    a.user.name
                    if a.user
                    else None
                ),
                "reason": a.reason,
                "created_at": a.created_at
            }
            for a in sorted(
                decision.approvals,
                key=lambda x: x.approval_id
            )
        ]

    return data


# ==========================================
# CREATE DECISION
# ==========================================

@router.post("/")
def create_decision(
    decision_data: DecisionCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):

    if not decision_data.title or not decision_data.title.strip():

        raise HTTPException(
            status_code=422,
            detail="Title is required"
        )

    if (
        not decision_data.problem_statement
        or not decision_data.problem_statement.strip()
    ):

        raise HTTPException(
            status_code=422,
            detail="Problem statement is required"
        )

    decision_date = (
        decision_data.decision_date
        if decision_data.decision_date
        else datetime.utcnow()
    )

    new_decision = Decision(
        expert_id=current_user.user_id,
        title=decision_data.title.strip(),
        description=decision_data.description,
        decision_context=decision_data.decision_context,
        decision_date=decision_date,
        status="Draft",
        problem_statement=decision_data.problem_statement.strip(),
        objective=decision_data.objective,
        evaluation_criteria=decision_data.evaluation_criteria,
        risks=decision_data.risks,
        stakeholders=decision_data.stakeholders,
        implementation_status=(
            decision_data.implementation_status
            or "Not Started"
        ),
        rationale=decision_data.rationale,
        final_outcome=decision_data.final_outcome,
        priority=decision_data.priority or "Medium",
        assigned_to=decision_data.assigned_to,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )

    db.add(new_decision)

    db.flush()

    if decision_data.alternatives:

        validate_alternative_levels(
            decision_data.alternatives
        )

        recommended_seen = False

        for alt in decision_data.alternatives:

            if not alt.title or not alt.title.strip():
                continue

            if getattr(alt, "is_recommended", False):

                if recommended_seen:

                    raise HTTPException(
                        status_code=422,
                        detail=(
                            "Only one alternative can be "
                            "marked as recommended"
                        )
                    )

                recommended_seen = True

            values = alternative_field_values(
                alt,
                current_user
            )

            values["decision_id"] = new_decision.decision_id

            db.add(
                DecisionAlternative(**values)
            )

    record_version(
        db,
        new_decision,
        current_user,
        "Decision created"
    )

    record_approval(
        db,
        new_decision,
        "Created",
        current_user
    )

    record_decision_created_audit(
        db,
        current_user.user_id,
        new_decision
    )

    db.commit()

    db.refresh(new_decision)

    return decision_dict(new_decision, include_details=True)


# ==========================================
# GET ALL DECISIONS
# ==========================================

@router.get("/")
def get_all_decisions(
    search: Optional[str] = None,
    status: Optional[str] = None,
    team: Optional[int] = None,
    mine: Optional[bool] = False,
    assigned_to_user: Optional[bool] = False,
    priority: Optional[str] = None,
    exclude_archived: Optional[bool] = False,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):

    if status and status not in VALID_STATUSES:

        raise HTTPException(
            status_code=422,
            detail="Invalid status filter value"
        )

    query = (
        db.query(Decision)
        .outerjoin(User, User.user_id == Decision.expert_id)
        .outerjoin(Team, Team.team_id == User.team_id)
    )

    if search:

        query = query.filter(
            Decision.title.ilike(f"%{search.strip()}%")
        )

    if status:

        query = query.filter(
            Decision.status == status
        )

    if priority:

        query = query.filter(
            Decision.priority == priority
        )

    if team:

        query = query.filter(
            User.team_id == team
        )

    if mine:

        query = query.filter(
            Decision.expert_id == current_user.user_id
        )

    if assigned_to_user:

        query = query.filter(
            Decision.assigned_to == current_user.user_id
        )

    if exclude_archived:

        query = query.filter(
            Decision.status != "Archived"
        )

    decisions = (
        query.order_by(
            Decision.decision_date.desc()
        )
        .all()
    )

    return [
        decision_dict(d)
        for d in decisions
    ]


# ==========================================
# GET SINGLE DECISION
# ==========================================

@router.get("/{decision_id}")
def get_single_decision(
    decision_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):

    decision = (
        db.query(Decision)
        .filter(
            Decision.decision_id == decision_id
        )
        .first()
    )

    if not decision:

        raise HTTPException(
            status_code=404,
            detail="Decision not found"
        )

    return decision_dict(decision, include_details=True)


# ==========================================
# VALIDATE STATUS TRANSITIONS
# ==========================================

_TRANSITION_ROLES = {
    ("Draft", "Under Review"): lambda user, dec: (
        user.user_id == dec.expert_id
        or user.role_id in (3, 4)
    ),
    ("Under Review", "Rejected"): lambda user, dec: (
        user.role_id in (2, 3)
    ),
    ("Under Review", "Reviewer Approved"): lambda user, dec: (
        user.role_id == 2
    ),
    ("Reviewer Approved", "Approved"): lambda user, dec: (
        user.role_id in (3, 4)
    ),
    ("Reviewer Approved", "Rejected"): lambda user, dec: (
        user.role_id in (3, 4)
    ),
    ("Approved", "Archived"): lambda user, dec: (
        user.role_id in (3, 4)
    ),
}


def _validate_transition(old_status, new_status, user, decision):

    if old_status == new_status:
        return

    key = (old_status, new_status)

    if key not in _TRANSITION_ROLES:

        raise HTTPException(
            status_code=422,
            detail=(
                f"Cannot change status from "
                f"'{old_status}' to '{new_status}'. "
                f"Invalid transition."
            )
        )

    if not _TRANSITION_ROLES[key](user, decision):

        raise HTTPException(
            status_code=403,
            detail=(
                f"You do not have permission to "
                f"change status from '{old_status}' "
                f"to '{new_status}'."
            )
        )


# ==========================================
# UPDATE DECISION
# ==========================================

@router.put("/{decision_id}")
def update_decision(
    decision_id: int,
    decision_data: DecisionUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):

    decision = (
        db.query(Decision)
        .filter(
            Decision.decision_id == decision_id
        )
        .first()
    )

    if not decision:

        raise HTTPException(
            status_code=404,
            detail="Decision not found"
        )

    changed = []

    audit_changes = []

    def apply_text(field_name, value):

        nonlocal changed

        nonlocal audit_changes

        if value is None:
            return

        old_value = getattr(decision, field_name)

        setattr(decision, field_name, value)

        changed.append(field_name)

        if str(old_value) != str(value):

            audit_changes.append({
                "field": field_name,
                "old": old_value,
                "new": value
            })

    if decision_data.title is not None:

        if not decision_data.title.strip():

            raise HTTPException(
                status_code=422,
                detail="Title cannot be empty"
            )

        if decision_data.title.strip() != decision.title:

            old_title = decision.title

            decision.title = decision_data.title.strip()

            changed.append("title")

            audit_changes.append({
                "field": "title",
                "old": old_title,
                "new": decision.title
            })

    apply_text("description", decision_data.description)
    apply_text("decision_context", decision_data.decision_context)
    apply_text("problem_statement", decision_data.problem_statement)
    apply_text("objective", decision_data.objective)
    apply_text("evaluation_criteria", decision_data.evaluation_criteria)
    apply_text("risks", decision_data.risks)
    apply_text("stakeholders", decision_data.stakeholders)
    apply_text("rationale", decision_data.rationale)
    apply_text("final_outcome", decision_data.final_outcome)

    if decision_data.implementation_status is not None:

        if (
            decision_data.implementation_status
            not in VALID_IMPLEMENTATION_STATUSES
        ):

            raise HTTPException(
                status_code=422,
                detail="Invalid implementation status"
            )

        old_impl_status = decision.implementation_status

        decision.implementation_status = (
            decision_data.implementation_status
        )

        changed.append("implementation_status")

        if old_impl_status != decision.implementation_status:

            audit_changes.append({
                "field": "implementation_status",
                "old": old_impl_status,
                "new": decision.implementation_status
            })

    if decision_data.priority is not None:

        old_priority = decision.priority

        decision.priority = decision_data.priority

        changed.append("priority")

        if old_priority != decision.priority:

            audit_changes.append({
                "field": "priority",
                "old": old_priority,
                "new": decision.priority
            })

    if decision_data.decision_date is not None:

        old_decision_date = decision.decision_date

        decision.decision_date = decision_data.decision_date

        changed.append("decision_date")

        if old_decision_date != decision.decision_date:

            audit_changes.append({
                "field": "decision_date",
                "old": old_decision_date,
                "new": decision.decision_date
            })

    if "assigned_to" in decision_data.model_fields_set:

        old_name = (
            decision.assigned.name
            if decision.assigned
            else None
        )

        decision.assigned_to = decision_data.assigned_to

        new_name = None

        if decision_data.assigned_to is not None:

            assigned_user = (
                db.query(User)
                .filter(
                    User.user_id == decision_data.assigned_to
                )
                .first()
            )

            new_name = (
                assigned_user.name
                if assigned_user
                else None
            )

        if old_name != new_name:

            if new_name:

                changed.append(f"assigned to {new_name}")

            else:

                changed.append("unassigned")

            audit_changes.append({
                "field": "assigned_to",
                "old": old_name,
                "new": new_name
            })

    if decision_data.alternatives is not None:

        replace_alternatives(
            db,
            decision,
            decision_data.alternatives,
            current_user
        )

        changed.append("alternatives")

    status_changed = False

    if decision_data.status is not None:

        new_status = decision_data.status.strip()

        if new_status not in VALID_STATUSES:

            raise HTTPException(
                status_code=422,
                detail="Invalid status value"
            )

        if new_status != decision.status:

            _validate_transition(
                decision.status,
                new_status,
                current_user,
                decision
            )

            old_status = decision.status

            decision.status = new_status

            changed.append(
                f"status from '{old_status}' to '{new_status}'"
            )

            status_changed = True

    decision.updated_at = datetime.utcnow()

    if changed:

        if len(changed) == 1:

            summary = f"Decision edited: {changed[0]} updated"

        else:

            summary = (
                "Decision edited: "
                + ", ".join(field.replace("_", " ")
                    for field in changed)
                + " updated"
            )

    else:

        summary = "Decision edited (no field changes)"

    record_version(db, decision, current_user, summary)

    if status_changed:

        record_approval(
            db,
            decision,
            f"Status changed to {decision.status}",
            current_user,
            summary
        )

        create_workflow_notifications(
            db,
            decision,
            old_status,
            decision.status,
            None
        )

        record_workflow_audit(
            db,
            current_user.user_id,
            decision,
            old_status,
            decision.status,
            None
        )

    record_decision_updated_audit(
        db,
        current_user.user_id,
        decision,
        audit_changes
    )

    db.commit()

    db.refresh(decision)

    return decision_dict(decision, include_details=True)


# ==========================================
# APPROVAL WORKFLOW
# ==========================================

def _get_decision_or_404(db: Session, decision_id: int):

    decision = (
        db.query(Decision)
        .filter(
            Decision.decision_id == decision_id
        )
        .first()
    )

    if not decision:

        raise HTTPException(
            status_code=404,
            detail="Decision not found"
        )

    return decision


def _change_status(
    db: Session,
    decision: Decision,
    new_status: str,
    current_user,
    action: str,
    summary: str,
    reason: Optional[str] = None
):

    old_status = decision.status

    if old_status == new_status:

        raise HTTPException(
            status_code=422,
            detail=(
                f"Decision is already "
                f"'{old_status}'"
            )
        )

    decision.status = new_status

    decision.updated_at = datetime.utcnow()

    record_version(
        db,
        decision,
        current_user,
        summary
    )

    record_approval(
        db,
        decision,
        action,
        current_user,
        reason
    )

    create_workflow_notifications(
        db,
        decision,
        old_status,
        new_status,
        reason
    )

    record_workflow_audit(
        db,
        current_user.user_id,
        decision,
        old_status,
        new_status,
        reason
    )

    db.commit()

    db.refresh(decision)

    return decision_dict(decision, include_details=True)


@router.post("/{decision_id}/submit")
def submit_decision_for_review(
    decision_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):

    decision = _get_decision_or_404(db, decision_id)

    if decision.status != "Draft":

        raise HTTPException(
            status_code=422,
            detail=(
                "Only draft decisions can be "
                "submitted for review"
            )
        )

    if (
        current_user.user_id != decision.expert_id
        and current_user.role_id not in (3, 4)
    ):

        raise HTTPException(
            status_code=403,
            detail=(
                "Only the decision owner, a Manager, "
                "or an Administrator can submit "
                "a decision for review"
            )
        )

    return _change_status(
        db,
        decision,
        "Under Review",
        current_user,
        "Submitted for Review",
        "Decision submitted for review"
    )


@router.post("/{decision_id}/review")
def reviewer_review_decision(
    decision_id: int,
    review_data: DecisionReviewRequest,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):

    if current_user.role_id != 2:

        raise HTTPException(
            status_code=403,
            detail=(
                "Only a Reviewer can perform "
                "the reviewer review"
            )
        )

    action = (review_data.action or "").lower()

    if action not in ("approve", "reject"):

        raise HTTPException(
            status_code=422,
            detail="Action must be 'approve' or 'reject'"
        )

    if action == "reject" and (
        not review_data.reason
        or not review_data.reason.strip()
    ):

        raise HTTPException(
            status_code=422,
            detail="A rejection reason is required"
        )

    decision = _get_decision_or_404(db, decision_id)

    if decision.status != "Under Review":

        raise HTTPException(
            status_code=422,
            detail=(
                "Reviewer review is only allowed for "
                "decisions in 'Under Review' status"
            )
        )

    if action == "approve":

        return _change_status(
            db,
            decision,
            "Reviewer Approved",
            current_user,
            "Reviewer Approved",
            "Decision approved by reviewer"
        )

    return _change_status(
        db,
        decision,
        "Rejected",
        current_user,
        "Reviewer Rejected",
        "Decision rejected by reviewer",
        review_data.reason.strip()
    )


@router.post("/{decision_id}/manager-review")
def manager_review_decision(
    decision_id: int,
    review_data: DecisionReviewRequest,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):

    if current_user.role_id != 3:

        raise HTTPException(
            status_code=403,
            detail=(
                "Only a Manager can perform "
                "the final approval"
            )
        )

    action = (review_data.action or "").lower()

    if action not in ("approve", "reject"):

        raise HTTPException(
            status_code=422,
            detail="Action must be 'approve' or 'reject'"
        )

    if action == "reject" and (
        not review_data.reason
        or not review_data.reason.strip()
    ):

        raise HTTPException(
            status_code=422,
            detail="A rejection reason is required"
        )

    decision = _get_decision_or_404(db, decision_id)

    if decision.status != "Reviewer Approved":

        raise HTTPException(
            status_code=422,
            detail=(
                "Final approval is only allowed for "
                "decisions in 'Reviewer Approved' status"
            )
        )

    if action == "approve":

        return _change_status(
            db,
            decision,
            "Approved",
            current_user,
            "Manager Approved",
            "Decision finally approved by manager"
        )

    return _change_status(
        db,
        decision,
        "Rejected",
        current_user,
        "Manager Rejected",
        "Decision rejected by manager",
        review_data.reason.strip()
    )


@router.post("/{decision_id}/archive")
def archive_decision(
    decision_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):

    decision = _get_decision_or_404(db, decision_id)

    if current_user.role_id not in (3, 4):

        raise HTTPException(
            status_code=403,
            detail=(
                "Only a Manager or an Administrator "
                "can archive decisions"
            )
        )

    if decision.status != "Approved":

        raise HTTPException(
            status_code=422,
            detail=(
                "Only approved decisions can be archived"
            )
        )

    return _change_status(
        db,
        decision,
        "Archived",
        current_user,
        "Archived",
        "Decision archived"
    )


# ==========================================
# DELETE DECISION
# ==========================================

def _remove_documents_for_decision(db, decision_id):
    docs = (
        db.query(DecisionDocument)
        .filter(
            DecisionDocument.decision_id == decision_id
        )
        .all()
    )

    for doc in docs:
        if doc.file_path and os.path.exists(doc.file_path):
            try:
                os.remove(doc.file_path)
            except OSError:
                pass

        db.delete(doc)

    return docs


@router.delete("/{decision_id}")
def delete_or_archive_decision(
    decision_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):

    decision = (
        db.query(Decision)
        .filter(
            Decision.decision_id == decision_id
        )
        .first()
    )

    if not decision:

        raise HTTPException(
            status_code=404,
            detail="Decision not found"
        )

    # Permanent delete is only allowed for decisions that have not
    # been finally approved (Draft / Under Review / Reviewer
    # Approved / Rejected).
    if decision.status in (
        "Draft",
        "Under Review",
        "Reviewer Approved",
        "Rejected"
    ):

        _remove_documents_for_decision(db, decision_id)

        db.delete(decision)

        db.commit()

        return {
            "message": "Decision deleted successfully",
            "decision_id": decision_id
        }


    # Approved decisions can only be archived, never permanently
    # deleted.
    if decision.status == "Approved":

        decision.status = "Archived"

        decision.updated_at = datetime.utcnow()

        record_version(
            db,
            decision,
            current_user,
            "Decision archived (previous status: Approved)"
        )

        record_approval(
            db,
            decision,
            "Archived",
            current_user,
            "Approved decision archived"
        )

        create_workflow_notifications(
            db,
            decision,
            "Approved",
            "Archived",
            None
        )

        record_workflow_audit(
            db,
            current_user.user_id,
            decision,
            "Approved",
            "Archived",
            None
        )

        db.commit()

        db.refresh(decision)

        return {
            "message": "Decision archived successfully",
            "decision": decision_dict(
                decision,
                include_details=True
            )
        }

    # Archived decisions cannot be deleted.
    raise HTTPException(
        status_code=400,
        detail="Archived decisions cannot be deleted"
    )