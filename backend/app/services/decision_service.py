import json
from typing import List, Optional
from datetime import datetime, timezone
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.models import Decision, DecisionVersion, User, Role, DecisionStatus
from app.schemas import DecisionCreate, DecisionUpdate

def _create_snapshot_payload(decision: Decision) -> str:
    """Helper to serialize full decision state for version snapshotting."""
    alts = []
    if decision.alternatives:
        for alt in decision.alternatives:
            alts.append({
                "id": alt.id,
                "title": alt.title,
                "description": alt.description,
                "pros": alt.parsed_pros,
                "cons": alt.parsed_cons,
                "estimated_cost": alt.estimated_cost,
                "feasibility_score": alt.feasibility_score,
                "risk_assessment": alt.risk_assessment
            })
    
    snapshot = {
        "id": decision.id,
        "title": decision.title,
        "problem_statement": decision.problem_statement,
        "category": decision.category,
        "status": decision.status.value if hasattr(decision.status, "value") else str(decision.status),
        "created_by_id": decision.created_by_id,
        "created_at": decision.created_at.isoformat() if decision.created_at else None,
        "updated_at": decision.updated_at.isoformat() if decision.updated_at else None,
        "alternatives": alts
    }
    return json.dumps(snapshot)

def create_decision(db: Session, decision_in: DecisionCreate, current_user: User) -> Decision:
    """
    Creates a new Decision record and automatically snapshots version 1.
    """
    decision = Decision(
        title=decision_in.title,
        problem_statement=decision_in.problem_statement,
        category=decision_in.category,
        status=decision_in.status or DecisionStatus.DRAFT,
        created_by_id=current_user.id
    )
    db.add(decision)
    db.commit()
    db.refresh(decision)

    # Automatically persist Version 1 snapshot
    initial_snapshot = _create_snapshot_payload(decision)
    v1 = DecisionVersion(
        decision_id=decision.id,
        version_number=1,
        snapshot_data=initial_snapshot,
        changed_by_id=current_user.id,
        change_summary="Initial decision created."
    )
    db.add(v1)
    db.commit()
    db.refresh(decision)
    return decision

def get_decision(db: Session, decision_id: int) -> Decision:
    """Fetch single decision by ID with 404 validation."""
    decision = db.query(Decision).filter(Decision.id == decision_id).first()
    if not decision:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Decision with ID {decision_id} was not found"
        )
    return decision

def list_decisions(
    db: Session,
    status_filter: Optional[DecisionStatus] = None,
    category_filter: Optional[str] = None,
    search: Optional[str] = None,
    skip: int = 0,
    limit: int = 100
) -> List[Decision]:
    """List decisions with optional status, category, and search query filters."""
    query = db.query(Decision)
    if status_filter:
        query = query.filter(Decision.status == status_filter)
    if category_filter:
        query = query.filter(Decision.category.ilike(f"%{category_filter}%"))
    if search:
        query = query.filter(
            or_(
                Decision.title.ilike(f"%{search}%"),
                Decision.problem_statement.ilike(f"%{search}%"),
                Decision.category.ilike(f"%{search}%")
            )
        )
    return query.order_by(Decision.updated_at.desc(), Decision.id.desc()).offset(skip).limit(limit).all()

def update_decision(
    db: Session,
    decision_id: int,
    update_in: DecisionUpdate,
    current_user: User
) -> Decision:
    """
    Updates decision fields and automatically creates a new version snapshot.
    """
    decision = get_decision(db, decision_id)

    # Permission check: Author or Manager or Administrator can update content.
    # Reviewers can update status during review workflows.
    is_author = decision.created_by_id == current_user.id
    is_admin_or_mgr = current_user.role in [Role.ADMINISTRATOR, Role.MANAGER]
    is_reviewer = current_user.role == Role.REVIEWER

    if not (is_author or is_admin_or_mgr or is_reviewer):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to modify this decision."
        )

    # Determine changes
    changes = []
    if update_in.title is not None and update_in.title != decision.title:
        changes.append(f"Title changed from '{decision.title}' to '{update_in.title}'")
        decision.title = update_in.title
    if update_in.problem_statement is not None and update_in.problem_statement != decision.problem_statement:
        changes.append("Problem statement updated")
        decision.problem_statement = update_in.problem_statement
    if update_in.category is not None and update_in.category != decision.category:
        changes.append(f"Category changed from '{decision.category}' to '{update_in.category}'")
        decision.category = update_in.category
    if update_in.status is not None and update_in.status != decision.status:
        changes.append(f"Status changed from '{decision.status.value}' to '{update_in.status.value}'")
        decision.status = update_in.status

    summary = update_in.change_summary or ("; ".join(changes) if changes else "Decision metadata updated.")

    decision.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(decision)

    # Determine next version number
    latest_version = db.query(DecisionVersion).filter(
        DecisionVersion.decision_id == decision.id
    ).order_by(DecisionVersion.version_number.desc()).first()

    next_version_num = (latest_version.version_number + 1) if latest_version else 1

    # Snapshot current state
    new_version = DecisionVersion(
        decision_id=decision.id,
        version_number=next_version_num,
        snapshot_data=_create_snapshot_payload(decision),
        changed_by_id=current_user.id,
        change_summary=summary
    )
    db.add(new_version)
    db.commit()
    db.refresh(decision)
    return decision

def delete_decision(db: Session, decision_id: int, current_user: User) -> None:
    """Deletes decision if user is creator, manager, or administrator."""
    decision = get_decision(db, decision_id)
    is_author = decision.created_by_id == current_user.id
    is_admin_or_mgr = current_user.role in [Role.ADMINISTRATOR, Role.MANAGER]

    if not (is_author or is_admin_or_mgr):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the creator, manager, or administrator can delete this decision."
        )

    db.delete(decision)
    db.commit()

def get_decision_versions(db: Session, decision_id: int) -> List[DecisionVersion]:
    """Retrieve full version history for a decision."""
    # Ensure decision exists
    get_decision(db, decision_id)
    return db.query(DecisionVersion).filter(
        DecisionVersion.decision_id == decision_id
    ).order_by(DecisionVersion.version_number.desc()).all()

def get_decision_version_by_number(db: Session, decision_id: int, version_number: int) -> DecisionVersion:
    """Retrieve specific version snapshot by version number."""
    # Ensure decision exists
    get_decision(db, decision_id)
    version = db.query(DecisionVersion).filter(
        DecisionVersion.decision_id == decision_id,
        DecisionVersion.version_number == version_number
    ).first()
    if not version:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Version {version_number} for decision {decision_id} not found."
        )
    return version
