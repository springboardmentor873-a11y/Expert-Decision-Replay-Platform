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
from app.models import User
from app.models import Team
from app.auth import get_current_user
from app.schemas import DecisionCreate
from app.schemas import DecisionUpdate
from app.schemas import DecisionStatusUpdate


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
    "Active",
    "Under Review",
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

    if decision_data.status not in VALID_STATUSES:

        raise HTTPException(
            status_code=422,
            detail="Invalid decision status"
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
        status=decision_data.status or "Active",
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

    if team:

        query = query.filter(
            User.team_id == team
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

    def apply_text(field_name, value):

        nonlocal changed

        if value is None:
            return

        setattr(decision, field_name, value)

        changed.append(field_name)

    if decision_data.title is not None:

        if not decision_data.title.strip():

            raise HTTPException(
                status_code=422,
                detail="Title cannot be empty"
            )

        if decision_data.title.strip() != decision.title:

            decision.title = decision_data.title.strip()

            changed.append("title")

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

        decision.implementation_status = (
            decision_data.implementation_status
        )

        changed.append("implementation_status")

    if decision_data.priority is not None:

        decision.priority = decision_data.priority

        changed.append("priority")

    if decision_data.status is not None:

        if decision_data.status not in VALID_STATUSES:

            raise HTTPException(
                status_code=422,
                detail="Invalid status"
            )

        if decision_data.status != decision.status:

            changed.append(
                f"status -> {decision_data.status}"
            )

        decision.status = decision_data.status

    if decision_data.decision_date is not None:

        decision.decision_date = decision_data.decision_date

        changed.append("decision_date")

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

    if decision_data.alternatives is not None:

        replace_alternatives(
            db,
            decision,
            decision_data.alternatives,
            current_user
        )

        changed.append("alternatives")

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

    db.commit()

    db.refresh(decision)

    return decision_dict(decision, include_details=True)


# ==========================================
# UPDATE STATUS
# ==========================================

@router.patch("/{decision_id}/status")
def update_decision_status(
    decision_id: int,
    status_data: DecisionStatusUpdate,
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

    if status_data.status not in VALID_STATUSES:

        raise HTTPException(
            status_code=422,
            detail=(
                f"Invalid status. "
                f"Allowed values: {', '.join(VALID_STATUSES)}"
            )
        )

    # Only Managers (role_id=3) and Reviewers (role_id=2) may
    # approve or reject a decision. All other roles are denied.
    APPROVAL_ROLES = [2, 3]

    if (
        status_data.status in ("Approved", "Rejected")
        and current_user.role_id not in APPROVAL_ROLES
    ):

        raise HTTPException(
            status_code=403,
            detail=(
                "Only a Manager or Reviewer can approve "
                "or reject a decision"
            )
        )

    old_status = decision.status

    decision.status = status_data.status

    decision.updated_at = datetime.utcnow()

    status_summary = {
        "Approved": "Decision approved",
        "Rejected": "Decision rejected",
        "Active": "Decision activated",
        "Archived": "Decision archived"
    }.get(
        status_data.status,
        f"Status changed from {old_status} to {status_data.status}"
    )

    from_suffix = (
        f" (from {old_status})"
        if old_status != status_data.status
        else ""
    )

    record_version(
        db,
        decision,
        current_user,
        status_summary + from_suffix
    )

    db.commit()

    db.refresh(decision)

    return decision_dict(decision, include_details=True)


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
    # been approved or activated (Under Review / Rejected).
    if decision.status in ("Under Review", "Rejected"):

        _remove_documents_for_decision(db, decision_id)

        db.delete(decision)

        db.commit()

        return {
            "message": "Decision deleted successfully",
            "decision_id": decision_id
        }


    # Approved / Active decisions can only be archived, never
    # permanently deleted.
    if decision.status in ("Approved", "Active"):

        old_status = decision.status

        decision.status = "Archived"

        decision.updated_at = datetime.utcnow()

        record_version(
            db,
            decision,
            current_user,
            (
                "Decision archived "
                f"(previous status: {old_status})"
            )
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