from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user
from app.db.database import get_db
from app.models.alternative import Alternative
from app.models.approval import Approval
from app.models.comment import Comment
from app.models.decision import Decision
from app.models.decision_rationale import DecisionRationale
from app.models.decision_version import DecisionVersion
from app.models.discussion_thread import DiscussionThread
from app.models.document import Document
from app.models.meeting_note import MeetingNote
from app.models.user import User
from app.schemas.audit_log import AuditAction, AuditEntityType
from app.schemas.decision import (
    DecisionCreate,
    DecisionResponse,
    DecisionStatusUpdate,
    DecisionUpdate,
)
from app.services.audit_service import log_audit
from app.services.activity_service import log_activity
from app.services.authorization import (
    assert_can_access_decision,
    visible_decision_ids_filter,
)

VALID_STATUSES = [
    "Draft",
    "Under Review",
    "Approved",
    "Rejected",
    "Archived",
]

# Statuses that must only ever be reached through the approval workflow
# (see app/routers/approvals.py), never through a direct PATCH.
APPROVAL_MANAGED_STATUSES = {"Approved", "Rejected"}


router = APIRouter(
    prefix="/decisions",
    tags=["Decisions"]
)


def _get_decision_or_404(db: Session, decision_id: int) -> Decision:
    decision = db.query(Decision).filter(Decision.id == decision_id).first()
    if not decision:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Decision not found"
        )
    return decision


# CREATE DECISION
@router.post(
    "",
    response_model=DecisionResponse,
    status_code=status.HTTP_201_CREATED
)
def create_decision(
    decision_data: DecisionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    decision = Decision(
        title=decision_data.title,
        problem_statement=decision_data.problem_statement,
        category=decision_data.category,
        tags=decision_data.tags,
        status="Draft",
        created_by=current_user.id
    )

    db.add(decision)
    db.flush()

    log_audit(
        db=db,
        user_id=current_user.id,
        action=AuditAction.CREATE,
        entity_type=AuditEntityType.DECISION,
        entity_id=decision.id,
        description=f"Decision '{decision.title}' created",
        request_method="POST",
        endpoint="/decisions"
    )

    log_activity(
        db=db,
        user_id=current_user.id,
        action="Decision Created",
        entity_type="Decision",
        entity_id=decision.id,
        description=f"{current_user.full_name} created decision '{decision.title}'"
    )

    db.commit()
    db.refresh(decision)

    return decision


# GET ALL / FILTER DECISIONS (row-level scoped by role)
@router.get(
    "",
    response_model=List[DecisionResponse]
)
def get_decisions(
    status_filter: Optional[str] = Query(
        default=None,
        alias="status"
    ),
    category: Optional[str] = None,
    search: Optional[str] = Query(default=None, description="Search in title"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Decision)
    query = visible_decision_ids_filter(query, current_user, db)

    if status_filter:
        query = query.filter(
            Decision.status == status_filter
        )

    if category:
        query = query.filter(
            Decision.category == category
        )

    if search:
        query = query.filter(Decision.title.ilike(f"%{search}%"))

    return query.order_by(Decision.created_at.desc()).all()


# GET DECISION BY ID
@router.get(
    "/{decision_id}",
    response_model=DecisionResponse
)
def get_decision(
    decision_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    decision = _get_decision_or_404(db, decision_id)
    assert_can_access_decision(current_user, decision, db)
    return decision


# UPDATE DECISION
@router.put(
    "/{decision_id}",
    response_model=DecisionResponse
)
def update_decision(
    decision_id: int,
    decision_data: DecisionUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    decision = _get_decision_or_404(db, decision_id)
    assert_can_access_decision(current_user, decision, db)

    if decision.created_by != current_user.id and current_user.role not in (
        "Manager",
        "Administrator",
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the decision owner, a Manager or an Administrator can edit this decision",
        )

    if decision.status in APPROVAL_MANAGED_STATUSES:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Decision is already {decision.status} and can no longer be edited",
        )

    old_values = {
        "title": decision.title,
        "problem_statement": decision.problem_statement,
        "category": decision.category,
        "status": decision.status
    }

    latest_version = (
        db.query(DecisionVersion)
        .filter(
            DecisionVersion.decision_id == decision.id
        )
        .order_by(
            DecisionVersion.version_number.desc()
        )
        .first()
    )

    next_version_number = (
        latest_version.version_number + 1
        if latest_version
        else 1
    )

    version = DecisionVersion(
        decision_id=decision.id,
        version_number=next_version_number,
        title=decision.title,
        problem_statement=decision.problem_statement,
        category=decision.category,
        status=decision.status,
        changed_by=current_user.id,
        change_summary="Decision updated"
    )

    db.add(version)

    decision.title = decision_data.title
    decision.problem_statement = decision_data.problem_statement
    decision.category = decision_data.category
    decision.tags = decision_data.tags

    new_values = {
        "title": decision.title,
        "problem_statement": decision.problem_statement,
        "category": decision.category,
        "status": decision.status
    }

    log_audit(
        db=db,
        user_id=current_user.id,
        action=AuditAction.UPDATE,
        entity_type=AuditEntityType.DECISION,
        entity_id=decision.id,
        description=f"Decision '{decision.title}' updated",
        old_value=old_values,
        new_value=new_values,
        request_method="PUT",
        endpoint=f"/decisions/{decision.id}"
    )

    log_activity(
        db=db,
        user_id=current_user.id,
        action="Decision Updated",
        entity_type="Decision",
        entity_id=decision.id,
        description=f"{current_user.full_name} updated decision '{decision.title}'"
    )

    db.commit()
    db.refresh(decision)

    return decision


# UPDATE DECISION STATUS (workflow transitions NOT managed by approvals)
@router.patch(
    "/{decision_id}/status",
    response_model=DecisionResponse
)
def update_decision_status(
    decision_id: int,
    status_data: DecisionStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    decision = _get_decision_or_404(db, decision_id)
    assert_can_access_decision(current_user, decision, db)

    if decision.created_by != current_user.id and current_user.role not in (
        "Manager",
        "Administrator",
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not authorized to change this decision's status",
        )

    new_status = status_data.status

    if new_status not in VALID_STATUSES:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Invalid status. Allowed values: {', '.join(VALID_STATUSES)}",
        )

    if new_status in APPROVAL_MANAGED_STATUSES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "'Approved' and 'Rejected' can only be set through the "
                "approval workflow (POST /approvals, PATCH /approvals/{id})."
            ),
        )

    old_status = decision.status
    decision.status = new_status

    log_audit(
        db=db,
        user_id=current_user.id,
        action=AuditAction.UPDATE,
        entity_type=AuditEntityType.DECISION,
        entity_id=decision.id,
        description=(
            f"Decision status changed from "
            f"'{old_status}' to '{decision.status}'"
        ),
        old_value={
            "status": old_status
        },
        new_value={
            "status": decision.status
        },
        request_method="PATCH",
        endpoint=f"/decisions/{decision.id}/status"
    )

    log_activity(
        db=db,
        user_id=current_user.id,
        action="Decision Status Changed",
        entity_type="Decision",
        entity_id=decision.id,
        description=(
            f"{current_user.full_name} moved decision '{decision.title}' "
            f"from {old_status} to {decision.status}"
        )
    )

    db.commit()
    db.refresh(decision)

    return decision


# GET DECISION VERSION HISTORY
@router.get(
    "/{decision_id}/history"
)
def get_decision_history(
    decision_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    decision = _get_decision_or_404(db, decision_id)
    assert_can_access_decision(current_user, decision, db)

    versions = (
        db.query(DecisionVersion)
        .filter(
            DecisionVersion.decision_id == decision_id
        )
        .order_by(
            DecisionVersion.version_number.asc()
        )
        .all()
    )

    return [
        {
            "id": version.id,
            "decision_id": version.decision_id,
            "version_number": version.version_number,
            "title": version.title,
            "problem_statement": version.problem_statement,
            "category": version.category,
            "status": version.status,
            "changed_by": version.changed_by,
            "change_summary": version.change_summary,
            "created_at": version.created_at
        }
        for version in versions
    ]


# COMPARE DECISION VERSIONS
@router.get(
    "/{decision_id}/versions/compare"
)
def compare_decision_versions(
    decision_id: int,
    version_a: int,
    version_b: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    decision = _get_decision_or_404(db, decision_id)
    assert_can_access_decision(current_user, decision, db)

    first_version = db.query(DecisionVersion).filter(
        DecisionVersion.decision_id == decision_id,
        DecisionVersion.version_number == version_a
    ).first()

    second_version = db.query(DecisionVersion).filter(
        DecisionVersion.decision_id == decision_id,
        DecisionVersion.version_number == version_b
    ).first()

    if not first_version:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Version {version_a} not found"
        )

    if not second_version:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Version {version_b} not found"
        )

    differences = {}

    if first_version.title != second_version.title:
        differences["title"] = {
            "version_a": first_version.title,
            "version_b": second_version.title
        }

    if first_version.problem_statement != second_version.problem_statement:
        differences["problem_statement"] = {
            "version_a": first_version.problem_statement,
            "version_b": second_version.problem_statement
        }

    if first_version.category != second_version.category:
        differences["category"] = {
            "version_a": first_version.category,
            "version_b": second_version.category
        }

    if first_version.status != second_version.status:
        differences["status"] = {
            "version_a": first_version.status,
            "version_b": second_version.status
        }

    return {
        "decision_id": decision_id,
        "version_a": version_a,
        "version_b": version_b,
        "differences": differences
    }


# GET SPECIFIC DECISION VERSION
@router.get(
    "/{decision_id}/versions/{version_number}"
)
def get_decision_version(
    decision_id: int,
    version_number: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    decision = _get_decision_or_404(db, decision_id)
    assert_can_access_decision(current_user, decision, db)

    version = db.query(DecisionVersion).filter(
        DecisionVersion.decision_id == decision_id,
        DecisionVersion.version_number == version_number
    ).first()

    if not version:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Decision version not found"
        )

    return {
        "id": version.id,
        "decision_id": version.decision_id,
        "version_number": version.version_number,
        "title": version.title,
        "problem_statement": version.problem_statement,
        "category": version.category,
        "status": version.status,
        "changed_by": version.changed_by,
        "change_summary": version.change_summary,
        "created_at": version.created_at
    }


# ============================================================
# DECISION REPLAY - full chronological reconstruction
# ============================================================
@router.get(
    "/{decision_id}/replay"
)
def replay_decision(
    decision_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Reconstructs how a decision evolved over time by merging every
    related event (creation, edits, alternatives, discussion, comments,
    meeting notes, rationale changes, approvals) into one chronological
    timeline.
    """
    decision = _get_decision_or_404(db, decision_id)
    assert_can_access_decision(current_user, decision, db)

    users_by_id = {u.id: u for u in db.query(User).all()}

    def actor_name(user_id):
        user = users_by_id.get(user_id)
        return user.full_name if user else "Unknown user"

    events = []

    events.append({
        "type": "DECISION_CREATED",
        "timestamp": decision.created_at,
        "actor": actor_name(decision.created_by),
        "summary": f"Decision '{decision.title}' was created",
        "details": {"category": decision.category, "status": "Draft"},
    })

    alternatives = (
        db.query(Alternative)
        .filter(Alternative.decision_id == decision_id)
        .order_by(Alternative.created_at.asc())
        .all()
    )
    for alt in alternatives:
        events.append({
            "type": "ALTERNATIVE_ADDED",
            "timestamp": alt.created_at,
            "actor": None,
            "summary": f"Alternative '{alt.name}' was proposed",
            "details": {
                "risk_level": alt.risk_level,
                "estimated_cost": alt.estimated_cost,
                "feasibility_score": alt.feasibility_score,
            },
        })

    threads = (
        db.query(DiscussionThread)
        .filter(DiscussionThread.decision_id == decision_id)
        .order_by(DiscussionThread.created_at.asc())
        .all()
    )
    for thread in threads:
        events.append({
            "type": "DISCUSSION_STARTED",
            "timestamp": thread.created_at,
            "actor": actor_name(thread.user_id),
            "summary": f"Discussion thread '{thread.title}' was started",
            "details": {"thread_id": thread.id},
        })
        for reply in sorted(thread.replies, key=lambda r: r.created_at):
            events.append({
                "type": "DISCUSSION_REPLY",
                "timestamp": reply.created_at,
                "actor": actor_name(reply.user_id),
                "summary": f"Replied in thread '{thread.title}'",
                "details": {"thread_id": thread.id},
            })

    comments = (
        db.query(Comment)
        .filter(Comment.decision_id == decision_id)
        .order_by(Comment.created_at.asc())
        .all()
    )
    for comment in comments:
        events.append({
            "type": "COMMENT_ADDED",
            "timestamp": comment.created_at,
            "actor": actor_name(comment.user_id),
            "summary": "Added a comment",
            "details": {"comment_id": comment.id},
        })

    notes = (
        db.query(MeetingNote)
        .filter(MeetingNote.decision_id == decision_id)
        .order_by(MeetingNote.created_at.asc())
        .all()
    )
    for note in notes:
        events.append({
            "type": "MEETING_NOTE_ADDED",
            "timestamp": note.created_at,
            "actor": actor_name(note.user_id),
            "summary": "Added meeting notes",
            "details": {"note_id": note.id},
        })

    rationale = (
        db.query(DecisionRationale)
        .filter(DecisionRationale.decision_id == decision_id)
        .first()
    )
    if rationale:
        events.append({
            "type": "RATIONALE_RECORDED",
            "timestamp": rationale.created_at,
            "actor": actor_name(rationale.user_id),
            "summary": "Recorded the decision rationale",
            "details": {},
        })
        if rationale.updated_at != rationale.created_at:
            events.append({
                "type": "RATIONALE_UPDATED",
                "timestamp": rationale.updated_at,
                "actor": actor_name(rationale.user_id),
                "summary": "Updated the decision rationale",
                "details": {},
            })

    approvals = (
        db.query(Approval)
        .filter(Approval.decision_id == decision_id)
        .order_by(Approval.assigned_at.asc())
        .all()
    )
    for approval in approvals:
        events.append({
            "type": "APPROVAL_REQUESTED",
            "timestamp": approval.assigned_at,
            "actor": actor_name(decision.created_by),
            "summary": f"Approval requested from {actor_name(approval.reviewer_id)}",
            "details": {"approval_level": approval.approval_level},
        })
        if approval.completed_at:
            events.append({
                "type": (
                    "DECISION_APPROVED"
                    if approval.status == "Approved"
                    else "DECISION_REJECTED"
                    if approval.status == "Rejected"
                    else "APPROVAL_UPDATED"
                ),
                "timestamp": approval.completed_at,
                "actor": actor_name(approval.reviewer_id),
                "summary": f"{actor_name(approval.reviewer_id)} marked approval as {approval.status}",
                "details": {"approval_level": approval.approval_level},
            })

    versions = (
        db.query(DecisionVersion)
        .filter(DecisionVersion.decision_id == decision_id)
        .order_by(DecisionVersion.version_number.asc())
        .all()
    )
    for version in versions:
        events.append({
            "type": "DECISION_EDITED",
            "timestamp": version.created_at,
            "actor": actor_name(version.changed_by),
            "summary": f"Decision edited (version {version.version_number})",
            "details": {"version_number": version.version_number},
        })

    # Documents
    docs = (
        db.query(Document)
        .filter(Document.decision_id == decision_id)
        .order_by(Document.created_at.asc())
        .all()
    )
    for doc in docs:
        events.append({
            "type": "DOCUMENT_UPLOADED",
            "timestamp": doc.created_at,
            "actor": actor_name(doc.uploaded_by),
            "summary": f"Document '{doc.filename}' uploaded",
            "details": {"document_id": doc.id, "filename": doc.filename, "file_size": doc.file_size},
        })

    events.sort(key=lambda e: e["timestamp"])

    return {
        "decision_id": decision.id,
        "title": decision.title,
        "current_status": decision.status,
        "timeline": events,
    }
