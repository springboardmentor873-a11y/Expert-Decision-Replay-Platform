from datetime import datetime, UTC
from uuid import UUID
from sqlalchemy import select, func, or_
from sqlalchemy.orm import Session

from app.models.decision import (
    Alternative,
    AlternativeEvaluation,
    Decision,
    EvaluationCriterion,
    Risk,
    Stakeholder,
)
from app.models.identity import Team, User, UserProfile
from app.models.taxonomy import DecisionCategory, DecisionTag, DecisionTagLink
from app.schemas.alternative import (
    AlternativeOut,
    CriterionOut,
    RiskOut,
    StakeholderOut,
)
from app.schemas.decision import DecisionDetailOut, DecisionOut
from app.schemas.taxonomy import CategoryOut, TagOut


def calculate_alternative_scores(
    db: Session,
    decision_id: UUID,
) -> dict[UUID, float]:
    """Calculate weighted composite score (0-100) for all alternatives of a decision."""
    criteria = db.scalars(
        select(EvaluationCriterion)
        .where(EvaluationCriterion.decision_id == decision_id, EvaluationCriterion.deleted_at.is_(None))
    ).all()

    if not criteria:
        return {}

    total_weight = sum(float(c.weight) for c in criteria)
    if total_weight <= 0:
        return {}

    criteria_map = {c.id: float(c.weight) for c in criteria}

    evaluations = db.scalars(
        select(AlternativeEvaluation).where(AlternativeEvaluation.decision_id == decision_id)
    ).all()

    # Group scores by alternative
    alt_scores: dict[UUID, float] = {}
    alt_weights: dict[UUID, float] = {}

    for ev in evaluations:
        if ev.criterion_id in criteria_map:
            weight = criteria_map[ev.criterion_id]
            score = float(ev.score)
            alt_scores[ev.alternative_id] = alt_scores.get(ev.alternative_id, 0.0) + (score * weight)
            alt_weights[ev.alternative_id] = alt_weights.get(ev.alternative_id, 0.0) + weight

    result = {}
    for alt_id, weighted_sum in alt_scores.items():
        w = alt_weights.get(alt_id, 0.0)
        if w > 0:
            result[alt_id] = round(weighted_sum / w, 2)

    return result


def build_decision_out(db: Session, d: Decision) -> DecisionOut:
    """Build a rich DecisionOut schema object from a Decision model."""
    owner = db.scalar(select(User).where(User.id == d.owner_id))
    owner_profile = db.scalar(select(UserProfile).where(UserProfile.user_id == d.owner_id)) if owner else None
    owner_name = owner_profile.full_name if owner_profile else (owner.email if owner else "Unknown")

    category = None
    if d.category_id:
        c = db.scalar(select(DecisionCategory).where(DecisionCategory.id == d.category_id))
        if c:
            category = CategoryOut.model_validate(c)

    team_name = None
    if d.team_id:
        t = db.scalar(select(Team).where(Team.id == d.team_id))
        if t:
            team_name = t.name

    selected_alt_title = None
    if d.selected_alternative_id:
        sa = db.scalar(select(Alternative).where(Alternative.id == d.selected_alternative_id))
        if sa:
            selected_alt_title = sa.title

    tags = db.scalars(
        select(DecisionTag)
        .join(DecisionTagLink, DecisionTagLink.tag_id == DecisionTag.id)
        .where(DecisionTagLink.decision_id == d.id)
    ).all()
    tag_outs = [TagOut.model_validate(t) for t in tags]

    alt_count = db.scalar(
        select(func.count(Alternative.id))
        .where(Alternative.decision_id == d.id, Alternative.deleted_at.is_(None))
    ) or 0

    return DecisionOut(
        id=d.id,
        title=d.title,
        problem_statement=d.problem_statement,
        status=d.status,
        implementation_status=d.implementation_status,
        current_version_no=d.current_version_no,
        owner_id=d.owner_id,
        owner_name=owner_name,
        owner_email=owner.email if owner else None,
        category_id=d.category_id,
        category=category,
        team_id=d.team_id,
        team_name=team_name,
        selected_alternative_id=d.selected_alternative_id,
        selected_alternative_title=selected_alt_title,
        outcome_summary=d.outcome_summary,
        outcome_recorded_at=d.outcome_recorded_at,
        tags=tag_outs,
        alternatives_count=alt_count,
        created_at=d.created_at,
        updated_at=d.updated_at,
    )


def build_decision_detail_out(db: Session, d: Decision) -> DecisionDetailOut:
    """Build full DecisionDetailOut with alternatives, calculated scores, criteria, risks, and stakeholders."""
    base_out = build_decision_out(db, d)
    scores = calculate_alternative_scores(db, d.id)

    alts = db.scalars(
        select(Alternative)
        .where(Alternative.decision_id == d.id, Alternative.deleted_at.is_(None))
        .order_by(Alternative.sort_order)
    ).all()
    alt_outs = []
    for a in alts:
        ao = AlternativeOut.model_validate(a)
        ao.total_score = scores.get(a.id)
        alt_outs.append(ao)

    crits = db.scalars(
        select(EvaluationCriterion)
        .where(EvaluationCriterion.decision_id == d.id, EvaluationCriterion.deleted_at.is_(None))
        .order_by(EvaluationCriterion.sort_order)
    ).all()
    crit_outs = [CriterionOut.model_validate(c) for c in crits]

    risks = db.scalars(
        select(Risk).where(Risk.decision_id == d.id, Risk.deleted_at.is_(None))
    ).all()
    risk_outs = [RiskOut.model_validate(r) for r in risks]

    stakeholders = db.scalars(
        select(Stakeholder).where(Stakeholder.decision_id == d.id, Stakeholder.deleted_at.is_(None))
    ).all()
    stakeholder_outs = [StakeholderOut.model_validate(s) for s in stakeholders]

    return DecisionDetailOut(
        **base_out.model_dump(),
        alternatives=alt_outs,
        criteria=crit_outs,
        risks=risk_outs,
        stakeholders=stakeholder_outs,
    )
