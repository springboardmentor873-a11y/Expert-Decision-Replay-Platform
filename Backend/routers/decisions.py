from typing import List, Optional
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import or_
from sqlalchemy.orm import Session

from database.database import get_db
from security.auth import get_current_user
from security.audit import log_action
from models.decision import Decision, DecisionCategory, DecisionStatus
from models.alternative import Alternative
from models.version import DecisionVersion
from models.user import User
from Schemas.decision import DecisionCreate, DecisionUpdate, DecisionOut

router = APIRouter(prefix="/decisions", tags=["Decisions"])


def _role_name(user: User) -> Optional[str]:
    return user.role.name if user.role else None


@router.post("", response_model=DecisionOut, status_code=201)
def create_decision(
    payload: DecisionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if _role_name(current_user) not in ("manager", "administrator"):
        raise HTTPException(
            status_code=403,
            detail="Only a manager or administrator can create decisions",
        )
    decision = Decision(
        title=payload.title,
        problem_statement=payload.problem_statement,
        category=payload.category,
        rationale=payload.rationale,
        created_by_id=current_user.id,
        team_id=payload.team_id or current_user.team_id,
    )
    db.add(decision)
    db.commit()
    db.refresh(decision)

    # Save the initial version snapshot
    snapshot = DecisionVersion(
        decision_id=decision.id,
        version=decision.version,
        title=decision.title,
        problem_statement=decision.problem_statement,
        category=decision.category.value,
        status=decision.status.value,
        rationale=decision.rationale,
        change_summary="Initial creation",
        created_by_id=current_user.id,
    )
    db.add(snapshot)
    db.commit()

    log_action(
        db,
        actor=current_user,
        action="decision.created",
        entity_type="decision",
        entity_id=decision.id,
        details=f"Decision '{decision.title}' created ({decision.category.value})",
    )

    return decision


@router.get("", response_model=List[DecisionOut])
def list_decisions(
    category: Optional[DecisionCategory] = None,
    status: Optional[DecisionStatus] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(Decision)
    if category:
        query = query.filter(Decision.category == category)
    if status:
        query = query.filter(Decision.status == status)
    return query.order_by(Decision.created_at.desc()).all()


@router.get("/team", response_model=List[DecisionOut])
def list_team_decisions(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Decisions created by people on the current user's team(s) — for a
    manager, everyone on any team they manage; for anyone else, their own
    teammates (people sharing their team_id). This route must stay registered
    before /{decision_id} or FastAPI will try to parse "team" as an int id."""
    from models.team import Team

    member_ids = {current_user.id}

    managed_teams = db.query(Team).filter(Team.manager_id == current_user.id).all()
    for team in managed_teams:
        member_ids.update(m.id for m in team.members)

    if not managed_teams and current_user.team_id:
        teammates = db.query(User).filter(User.team_id == current_user.team_id).all()
        member_ids.update(u.id for u in teammates)

    return (
        db.query(Decision)
        .filter(Decision.created_by_id.in_(member_ids))
        .order_by(Decision.created_at.desc())
        .all()
    )


@router.get("/search", response_model=List[DecisionOut])
def search_decisions(
    q: Optional[str] = None,
    category: Optional[DecisionCategory] = None,
    status: Optional[DecisionStatus] = None,
    from_date: Optional[str] = None,
    to_date: Optional[str] = None,
    sort_by: Optional[str] = "created_at_desc",
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Full-text keyword search and multi-criterion filtering for decisions."""
    query = db.query(Decision)

    if q and q.strip():
        term = f"%{q.strip()}%"
        query = query.outerjoin(Alternative, Decision.id == Alternative.decision_id)
        query = query.filter(
            or_(
                Decision.title.ilike(term),
                Decision.problem_statement.ilike(term),
                Decision.rationale.ilike(term),
                Alternative.title.ilike(term),
                Alternative.pros.ilike(term),
                Alternative.cons.ilike(term),
            )
        ).distinct()

    if category:
        query = query.filter(Decision.category == category)
    if status:
        query = query.filter(Decision.status == status)

    if from_date:
        try:
            dt_from = datetime.fromisoformat(from_date)
            query = query.filter(Decision.created_at >= dt_from)
        except ValueError:
            pass

    if to_date:
        try:
            dt_to = datetime.fromisoformat(to_date)
            if "T" not in to_date:
                dt_to = dt_to + timedelta(days=1)
            query = query.filter(Decision.created_at <= dt_to)
        except ValueError:
            pass

    if sort_by == "created_at_asc":
        query = query.order_by(Decision.created_at.asc())
    elif sort_by == "title_asc":
        query = query.order_by(Decision.title.asc())
    elif sort_by == "title_desc":
        query = query.order_by(Decision.title.desc())
    else:
        query = query.order_by(Decision.created_at.desc())

    return query.all()


@router.get("/{decision_id}/ai-summary")
def get_decision_ai_summary(
    decision_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Milestone 4 Phase 5: AI Insights & Automated Decision Recommendations"""
    decision = db.query(Decision).filter(Decision.id == decision_id).first()
    if not decision:
        raise HTTPException(status_code=404, detail="Decision not found")

    alts = decision.alternatives or []
    best_alt = max(alts, key=lambda a: a.composite_score) if alts else None

    avg_risk = sum(a.risk_score for a in alts) / len(alts) if alts else 3.0
    risk_level = "Low" if avg_risk <= 3.5 else "Medium" if avg_risk <= 6.5 else "High"

    executive_summary = (
        f"This decision addresses '{decision.title}' within the {decision.category.value} domain. "
        f"The primary goal is: {decision.problem_statement or 'to optimize system architecture and operational efficiency'}. "
        + (f"Based on quantitative cost-risk analysis of {len(alts)} candidate alternative(s), '{best_alt.title}' is auto-recommended with a composite score of {best_alt.composite_score}." if best_alt else "No alternative options evaluated yet.")
    )

    insights = [
        f"Category Alignment: {decision.category.value} standards enforced.",
        f"Evaluated Options: {len(alts)} architectural alternative(s).",
        f"Overall Risk Level: {risk_level} (Avg risk score: {round(avg_risk, 1)}/10).",
    ]
    if best_alt:
        insights.append(f"Recommended Selection: '{best_alt.title}' (Feasibility: {best_alt.feasibility_score}/10, Cost: ${best_alt.estimated_cost or 0:,.2f}).")

    return {
        "decision_id": decision.id,
        "title": decision.title,
        "category": decision.category.value,
        "status": decision.status.value,
        "executive_summary": executive_summary,
        "risk_assessment": {
            "risk_level": risk_level,
            "average_risk_score": round(avg_risk, 1),
        },
        "recommended_alternative": best_alt.title if best_alt else None,
        "key_insights": insights,
    }


@router.get("/{decision_id}", response_model=DecisionOut)
def get_decision(
    decision_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    decision = db.query(Decision).filter(Decision.id == decision_id).first()
    if not decision:
        raise HTTPException(status_code=404, detail="Decision not found")
    return decision


@router.put("/{decision_id}", response_model=DecisionOut)
def update_decision(
    decision_id: int,
    payload: DecisionUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    decision = db.query(Decision).filter(Decision.id == decision_id).first()
    if not decision:
        raise HTTPException(status_code=404, detail="Decision not found")

    # Only the decision's creator, or a reviewer/manager/administrator, may
    # edit it or change its status. A plain employee cannot alter a decision
    # they didn't create.
    is_creator = decision.created_by_id == current_user.id
    is_privileged = _role_name(current_user) in ("reviewer", "manager", "administrator")
    if not (is_creator or is_privileged):
        raise HTTPException(
            status_code=403,
            detail="Only the creator, a reviewer, a manager, or an administrator can update this decision",
        )

    update_data = payload.model_dump(exclude_unset=True, exclude={"change_summary"})
    old_status = decision.status
    for field, value in update_data.items():
        setattr(decision, field, value)

    # Every update bumps the version and stores an immutable snapshot
    decision.version += 1
    db.add(decision)
    db.commit()
    db.refresh(decision)

    snapshot = DecisionVersion(
        decision_id=decision.id,
        version=decision.version,
        title=decision.title,
        problem_statement=decision.problem_statement,
        category=decision.category.value,
        status=decision.status.value,
        rationale=decision.rationale,
        change_summary=payload.change_summary or "Updated",
        created_by_id=current_user.id,
    )
    db.add(snapshot)
    db.commit()

    if decision.status != old_status:
        log_action(
            db,
            actor=current_user,
            action="decision.status_changed",
            entity_type="decision",
            entity_id=decision.id,
            details=f"Status changed from '{old_status.value}' to '{decision.status.value}'",
        )
    else:
        log_action(
            db,
            actor=current_user,
            action="decision.updated",
            entity_type="decision",
            entity_id=decision.id,
            details=payload.change_summary or f"Decision '{decision.title}' updated (v{decision.version})",
        )

    return decision


@router.delete("/{decision_id}", status_code=204)
def delete_decision(
    decision_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    decision = db.query(Decision).filter(Decision.id == decision_id).first()
    if not decision:
        raise HTTPException(status_code=404, detail="Decision not found")

    # Deleting a decision permanently erases institutional history, so only
    # an administrator can do it. Everyone else should archive it instead
    # (PUT status=Archived) rather than delete.
    if _role_name(current_user) != "administrator":
        raise HTTPException(
            status_code=403,
            detail="Only an administrator can delete a decision. Consider archiving it instead.",
        )

    decision_title = decision.title
    db.delete(decision)
    db.commit()

    log_action(
        db,
        actor=current_user,
        action="decision.deleted",
        entity_type="decision",
        entity_id=decision_id,
        details=f"Decision '{decision_title}' permanently deleted",
    )

    return None
