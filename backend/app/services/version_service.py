from datetime import datetime, UTC
from uuid import UUID
from sqlalchemy import select, func
from sqlalchemy.orm import Session

from app.models.decision import (
    Alternative,
    AlternativeEvaluation,
    Decision,
    DecisionVersion,
    EvaluationCriterion,
    Risk,
    Stakeholder,
)
from app.models.taxonomy import DecisionCategory, DecisionTag, DecisionTagLink


def create_decision_snapshot(
    db: Session,
    decision_id: UUID,
    actor_id: UUID,
    reason: str = "Decision updated",
) -> DecisionVersion:
    """Create an immutable snapshot version of the complete decision case file."""
    decision = db.scalar(select(Decision).where(Decision.id == decision_id))
    if not decision:
        raise ValueError("Decision not found")

    # Fetch related items
    alternatives = db.scalars(
        select(Alternative)
        .where(Alternative.decision_id == decision_id, Alternative.deleted_at.is_(None))
        .order_by(Alternative.sort_order)
    ).all()

    criteria = db.scalars(
        select(EvaluationCriterion)
        .where(EvaluationCriterion.decision_id == decision_id, EvaluationCriterion.deleted_at.is_(None))
        .order_by(EvaluationCriterion.sort_order)
    ).all()

    evaluations = db.scalars(
        select(AlternativeEvaluation).where(AlternativeEvaluation.decision_id == decision_id)
    ).all()

    risks = db.scalars(
        select(Risk)
        .where(Risk.decision_id == decision_id, Risk.deleted_at.is_(None))
    ).all()

    stakeholders = db.scalars(
        select(Stakeholder)
        .where(Stakeholder.decision_id == decision_id, Stakeholder.deleted_at.is_(None))
    ).all()

    tag_links = db.scalars(
        select(DecisionTag.name)
        .join(DecisionTagLink, DecisionTagLink.tag_id == DecisionTag.id)
        .where(DecisionTagLink.decision_id == decision_id)
    ).all()

    category_name = None
    if decision.category_id:
        cat = db.scalar(select(DecisionCategory).where(DecisionCategory.id == decision.category_id))
        if cat:
            category_name = cat.name

    next_version_no = decision.current_version_no + 1
    decision.current_version_no = next_version_no

    snapshot = {
        "version_no": next_version_no,
        "title": decision.title,
        "problem_statement": decision.problem_statement,
        "status": decision.status,
        "implementation_status": decision.implementation_status,
        "category": category_name,
        "category_id": str(decision.category_id) if decision.category_id else None,
        "team_id": str(decision.team_id) if decision.team_id else None,
        "selected_alternative_id": str(decision.selected_alternative_id) if decision.selected_alternative_id else None,
        "outcome_summary": decision.outcome_summary,
        "outcome_recorded_at": decision.outcome_recorded_at.isoformat() if decision.outcome_recorded_at else None,
        "tags": list(tag_links),
        "alternatives": [
            {
                "id": str(a.id),
                "title": a.title,
                "description": a.description,
                "sort_order": a.sort_order,
                "is_selected": a.is_selected,
            }
            for a in alternatives
        ],
        "criteria": [
            {
                "id": str(c.id),
                "name": c.name,
                "description": c.description,
                "weight": float(c.weight),
                "sort_order": c.sort_order,
            }
            for c in criteria
        ],
        "evaluations": [
            {
                "id": str(e.id),
                "alternative_id": str(e.alternative_id),
                "criterion_id": str(e.criterion_id),
                "score": float(e.score),
                "notes": e.notes,
            }
            for e in evaluations
        ],
        "risks": [
            {
                "id": str(r.id),
                "title": r.title,
                "description": r.description,
                "severity": r.severity,
                "likelihood": r.likelihood,
                "mitigation": r.mitigation,
            }
            for r in risks
        ],
        "stakeholders": [
            {
                "id": str(s.id),
                "display_name": s.display_name,
                "stakeholder_role": s.stakeholder_role,
            }
            for s in stakeholders
        ],
        "snapshot_created_at": datetime.now(UTC).isoformat(),
    }

    version_record = DecisionVersion(
        decision_id=decision_id,
        version_no=next_version_no,
        reason=reason,
        snapshot=snapshot,
        created_by_id=actor_id,
    )
    db.add(version_record)
    db.flush()
    return version_record


def compare_decision_versions(
    db: Session,
    decision_id: UUID,
    v1_no: int,
    v2_no: int,
) -> dict:
    """Compare two version snapshots and generate a structured field diff."""
    v1 = db.scalar(
        select(DecisionVersion).where(
            DecisionVersion.decision_id == decision_id,
            DecisionVersion.version_no == v1_no,
        )
    )
    v2 = db.scalar(
        select(DecisionVersion).where(
            DecisionVersion.decision_id == decision_id,
            DecisionVersion.version_no == v2_no,
        )
    )
    if not v1 or not v2:
        raise ValueError("One or both version snapshots not found")

    s1 = v1.snapshot
    s2 = v2.snapshot

    differences = {}
    scalar_fields = [
        "title",
        "problem_statement",
        "status",
        "implementation_status",
        "category",
        "outcome_summary",
        "selected_alternative_id",
    ]

    for field in scalar_fields:
        val1 = s1.get(field)
        val2 = s2.get(field)
        if val1 != val2:
            differences[field] = {"old": val1, "new": val2}

    # Compare alternatives count & titles
    alts1 = {a["title"]: a for a in s1.get("alternatives", [])}
    alts2 = {a["title"]: a for a in s2.get("alternatives", [])}
    added_alts = [t for t in alts2 if t not in alts1]
    removed_alts = [t for t in alts1 if t not in alts2]
    if added_alts or removed_alts:
        differences["alternatives"] = {"added": added_alts, "removed": removed_alts}

    # Compare criteria
    crit1 = {c["name"]: c for c in s1.get("criteria", [])}
    crit2 = {c["name"]: c for c in s2.get("criteria", [])}
    added_crit = [c for c in crit2 if c not in crit1]
    removed_crit = [c for c in crit1 if c not in crit2]
    if added_crit or removed_crit:
        differences["criteria"] = {"added": added_crit, "removed": removed_crit}

    # Compare risks
    r1 = {r["title"]: r for r in s1.get("risks", [])}
    r2 = {r["title"]: r for r in s2.get("risks", [])}
    added_risks = [r for r in r2 if r not in r1]
    removed_risks = [r for r in r1 if r not in r2]
    if added_risks or removed_risks:
        differences["risks"] = {"added": added_risks, "removed": removed_risks}

    return {
        "decision_id": decision_id,
        "v1_no": v1_no,
        "v2_no": v2_no,
        "v1_reason": v1.reason,
        "v2_reason": v2.reason,
        "differences": differences,
    }
