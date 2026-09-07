import json
from typing import List, Optional
from datetime import datetime, timezone
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models import Decision, Alternative, DecisionVersion, User, Role
from app.schemas import AlternativeCreate, AlternativeUpdate, AlternativeComparisonResponse, AlternativeMetrics, AlternativeResponse
from app.services.decision_service import get_decision, _create_snapshot_payload

def add_alternative(
    db: Session,
    decision_id: int,
    alt_in: AlternativeCreate,
    current_user: User
) -> Alternative:
    """Add a new alternative option to a decision and record version history."""
    decision = get_decision(db, decision_id)

    # Permission check: Author or Manager or Admin or Reviewer
    is_author = decision.created_by_id == current_user.id
    is_privileged = current_user.role in [Role.ADMINISTRATOR, Role.MANAGER, Role.REVIEWER]
    if not (is_author or is_privileged):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to add alternatives to this decision."
        )

    pros_json = json.dumps(alt_in.pros if isinstance(alt_in.pros, list) else [])
    cons_json = json.dumps(alt_in.cons if isinstance(alt_in.cons, list) else [])

    alternative = Alternative(
        decision_id=decision.id,
        title=alt_in.title,
        description=alt_in.description,
        pros=pros_json,
        cons=cons_json,
        estimated_cost=alt_in.estimated_cost or 0.0,
        feasibility_score=alt_in.feasibility_score or 5,
        risk_assessment=alt_in.risk_assessment
    )
    db.add(alternative)
    decision.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(alternative)
    db.refresh(decision)

    # Snapshot decision state with new alternative
    latest_version = db.query(DecisionVersion).filter(
        DecisionVersion.decision_id == decision.id
    ).order_by(DecisionVersion.version_number.desc()).first()
    next_ver = (latest_version.version_number + 1) if latest_version else 1

    new_version = DecisionVersion(
        decision_id=decision.id,
        version_number=next_ver,
        snapshot_data=_create_snapshot_payload(decision),
        changed_by_id=current_user.id,
        change_summary=f"Added alternative '{alternative.title}'."
    )
    db.add(new_version)
    db.commit()

    return alternative

def get_alternatives(db: Session, decision_id: int) -> List[Alternative]:
    """Retrieve all alternatives for a decision."""
    get_decision(db, decision_id)
    return db.query(Alternative).filter(Alternative.decision_id == decision_id).order_by(Alternative.id.asc()).all()

def get_alternative_by_id(db: Session, decision_id: int, alt_id: int) -> Alternative:
    """Retrieve single alternative by ID."""
    alt = db.query(Alternative).filter(
        Alternative.id == alt_id,
        Alternative.decision_id == decision_id
    ).first()
    if not alt:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Alternative with ID {alt_id} was not found for this decision."
        )
    return alt

def update_alternative(
    db: Session,
    decision_id: int,
    alt_id: int,
    update_in: AlternativeUpdate,
    current_user: User
) -> Alternative:
    """Update alternative and record version update."""
    decision = get_decision(db, decision_id)
    alt = get_alternative_by_id(db, decision_id, alt_id)

    is_author = decision.created_by_id == current_user.id
    is_privileged = current_user.role in [Role.ADMINISTRATOR, Role.MANAGER, Role.REVIEWER]
    if not (is_author or is_privileged):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to edit this alternative."
        )

    if update_in.title is not None:
        alt.title = update_in.title
    if update_in.description is not None:
        alt.description = update_in.description
    if update_in.pros is not None:
        alt.pros = json.dumps(update_in.pros)
    if update_in.cons is not None:
        alt.cons = json.dumps(update_in.cons)
    if update_in.estimated_cost is not None:
        alt.estimated_cost = update_in.estimated_cost
    if update_in.feasibility_score is not None:
        alt.feasibility_score = update_in.feasibility_score
    if update_in.risk_assessment is not None:
        alt.risk_assessment = update_in.risk_assessment

    decision.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(alt)
    db.refresh(decision)

    # Snapshot decision
    latest_version = db.query(DecisionVersion).filter(
        DecisionVersion.decision_id == decision.id
    ).order_by(DecisionVersion.version_number.desc()).first()
    next_ver = (latest_version.version_number + 1) if latest_version else 1

    new_version = DecisionVersion(
        decision_id=decision.id,
        version_number=next_ver,
        snapshot_data=_create_snapshot_payload(decision),
        changed_by_id=current_user.id,
        change_summary=f"Updated alternative '{alt.title}'."
    )
    db.add(new_version)
    db.commit()

    return alt

def delete_alternative(db: Session, decision_id: int, alt_id: int, current_user: User) -> None:
    """Delete an alternative and record version change."""
    decision = get_decision(db, decision_id)
    alt = get_alternative_by_id(db, decision_id, alt_id)

    is_author = decision.created_by_id == current_user.id
    is_admin_or_mgr = current_user.role in [Role.ADMINISTRATOR, Role.MANAGER]
    if not (is_author or is_admin_or_mgr):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to delete this alternative."
        )

    alt_title = alt.title
    db.delete(alt)
    decision.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(decision)

    # Snapshot decision
    latest_version = db.query(DecisionVersion).filter(
        DecisionVersion.decision_id == decision.id
    ).order_by(DecisionVersion.version_number.desc()).first()
    next_ver = (latest_version.version_number + 1) if latest_version else 1

    new_version = DecisionVersion(
        decision_id=decision.id,
        version_number=next_ver,
        snapshot_data=_create_snapshot_payload(decision),
        changed_by_id=current_user.id,
        change_summary=f"Deleted alternative '{alt_title}'."
    )
    db.add(new_version)
    db.commit()

def get_alternative_comparison(db: Session, decision_id: int) -> AlternativeComparisonResponse:
    """
    Computes side-by-side comparison structure and metrics across all alternatives for a decision.
    """
    decision = get_decision(db, decision_id)
    alternatives = get_alternatives(db, decision_id)

    alt_responses = [
        AlternativeResponse(
            id=a.id,
            decision_id=a.decision_id,
            title=a.title,
            description=a.description,
            pros=a.parsed_pros,
            cons=a.parsed_cons,
            estimated_cost=a.estimated_cost or 0.0,
            feasibility_score=a.feasibility_score or 5,
            risk_assessment=a.risk_assessment,
            created_at=a.created_at
        )
        for a in alternatives
    ]

    total_alts = len(alt_responses)
    if total_alts > 0:
        highest_feas = max(alt_responses, key=lambda a: a.feasibility_score or 0)
        lowest_cost = min(alt_responses, key=lambda a: a.estimated_cost if a.estimated_cost is not None else float("inf"))
        avg_feas = sum((a.feasibility_score or 0) for a in alt_responses) / total_alts
        total_cost = sum((a.estimated_cost or 0.0) for a in alt_responses)

        metrics = AlternativeMetrics(
            total_alternatives=total_alts,
            highest_feasibility_alternative=f"{highest_feas.title} ({highest_feas.feasibility_score}/10)",
            lowest_cost_alternative=f"{lowest_cost.title} (${lowest_cost.estimated_cost:,.2f})",
            average_feasibility=round(avg_feas, 2),
            total_estimated_cost=round(total_cost, 2)
        )
    else:
        metrics = AlternativeMetrics(
            total_alternatives=0,
            highest_feasibility_alternative=None,
            lowest_cost_alternative=None,
            average_feasibility=0.0,
            total_estimated_cost=0.0
        )

    return AlternativeComparisonResponse(
        decision_id=decision.id,
        decision_title=decision.title,
        alternatives=alt_responses,
        metrics=metrics
    )
