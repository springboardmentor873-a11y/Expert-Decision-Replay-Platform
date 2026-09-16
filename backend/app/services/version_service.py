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

    s1 = v1.snapshot or {}
    s2 = v2.snapshot or {}

    differences = {}
    scalar_fields = [
        ("status", "Status / Lifecycle"),
        ("implementation_status", "Implementation Status"),
        ("title", "Decision Title"),
        ("problem_statement", "Problem Statement & Context"),
        ("category", "Decision Category"),
        ("outcome_summary", "Outcome Rationale"),
        ("selected_alternative_id", "Selected Alternative ID"),
    ]

    for field, label in scalar_fields:
        val1 = s1.get(field)
        val2 = s2.get(field)
        if val1 != val2:
            differences[field] = {
                "field_name": label,
                "old": val1 if val1 is not None else "None",
                "new": val2 if val2 is not None else "None",
            }

    # Compare alternatives deeply (titles, pros/cons/trade-offs description, selected state)
    alts1 = {a.get("id") or a.get("title"): a for a in s1.get("alternatives", [])}
    alts2 = {a.get("id") or a.get("title"): a for a in s2.get("alternatives", [])}

    added_alts = []
    for k, a2 in alts2.items():
        if k not in alts1:
            added_alts.append({
                "title": a2.get("title", "Untitled Option"),
                "description": a2.get("description", "No description provided"),
                "is_selected": a2.get("is_selected", False),
            })

    removed_alts = []
    for k, a1 in alts1.items():
        if k not in alts2:
            removed_alts.append({
                "title": a1.get("title", "Untitled Option"),
                "description": a1.get("description", "No description provided"),
                "is_selected": a1.get("is_selected", False),
            })

    modified_alts = []
    for k, a1 in alts1.items():
        if k in alts2:
            a2 = alts2[k]
            desc_changed = (a1.get("description") or "").strip() != (a2.get("description") or "").strip()
            sel_changed = a1.get("is_selected") != a2.get("is_selected")
            title_changed = a1.get("title") != a2.get("title")
            if desc_changed or sel_changed or title_changed:
                modified_alts.append({
                    "title": a2.get("title", a1.get("title")),
                    "old_title": a1.get("title"),
                    "new_title": a2.get("title"),
                    "old_description": a1.get("description") or "No description",
                    "new_description": a2.get("description") or "No description",
                    "old_selected": a1.get("is_selected", False),
                    "new_selected": a2.get("is_selected", False),
                    "description_changed": desc_changed,
                    "selection_changed": sel_changed,
                })

    if added_alts or removed_alts or modified_alts:
        differences["alternatives"] = {
            "field_name": "Alternative Options & Trade-offs (Pros/Cons)",
            "added": added_alts,
            "removed": removed_alts,
            "modified": modified_alts,
        }

    # Compare evaluation criteria and weights
    crit1 = {c.get("id") or c.get("name"): c for c in s1.get("criteria", [])}
    crit2 = {c.get("id") or c.get("name"): c for c in s2.get("criteria", [])}
    added_crit = [c for k, c in crit2.items() if k not in crit1]
    removed_crit = [c for k, c in crit1.items() if k not in crit2]
    modified_crit = []
    for k, c1 in crit1.items():
        if k in crit2:
            c2 = crit2[k]
            if c1.get("weight") != c2.get("weight") or c1.get("name") != c2.get("name"):
                modified_crit.append({
                    "name": c2.get("name"),
                    "old_weight": c1.get("weight"),
                    "new_weight": c2.get("weight"),
                })

    if added_crit or removed_crit or modified_crit:
        differences["criteria"] = {
            "field_name": "Evaluation Criteria & Weights",
            "added": added_crit,
            "removed": removed_crit,
            "modified": modified_crit,
        }

    # Compare evaluation matrix scores
    evals1 = {f"{e.get('alternative_id')}_{e.get('criterion_id')}": e for e in s1.get("evaluations", [])}
    evals2 = {f"{e.get('alternative_id')}_{e.get('criterion_id')}": e for e in s2.get("evaluations", [])}
    score_changes = []
    all_eval_keys = set(evals1.keys()).union(set(evals2.keys()))
    for ek in all_eval_keys:
        e1 = evals1.get(ek)
        e2 = evals2.get(ek)
        s1_val = e1.get("score") if e1 else None
        s2_val = e2.get("score") if e2 else None
        if s1_val != s2_val:
            score_changes.append({
                "key": ek,
                "old_score": s1_val,
                "new_score": s2_val,
            })
    if score_changes:
        differences["evaluations"] = {
            "field_name": "Evaluation Matrix Scores",
            "changed_count": len(score_changes),
            "changes": score_changes,
        }

    # Compare risks
    r1 = {r.get("id") or r.get("title"): r for r in s1.get("risks", [])}
    r2 = {r.get("id") or r.get("title"): r for r in s2.get("risks", [])}
    added_risks = [r for k, r in r2.items() if k not in r1]
    removed_risks = [r for k, r in r1.items() if k not in r2]
    modified_risks = []
    for k, r_old in r1.items():
        if k in r2:
            r_new = r2[k]
            if (
                r_old.get("severity") != r_new.get("severity")
                or r_old.get("likelihood") != r_new.get("likelihood")
                or r_old.get("mitigation") != r_new.get("mitigation")
            ):
                modified_risks.append({
                    "title": r_new.get("title"),
                    "old_severity": r_old.get("severity"),
                    "new_severity": r_new.get("severity"),
                    "old_mitigation": r_old.get("mitigation"),
                    "new_mitigation": r_new.get("mitigation"),
                })

    if added_risks or removed_risks or modified_risks:
        differences["risks"] = {
            "field_name": "Risks & Mitigation Strategies",
            "added": added_risks,
            "removed": removed_risks,
            "modified": modified_risks,
        }

    return {
        "decision_id": decision_id,
        "v1_no": v1_no,
        "v2_no": v2_no,
        "v1_reason": v1.reason,
        "v2_reason": v2.reason,
        "v1_snapshot": s1,
        "v2_snapshot": s2,
        "differences": differences,
    }

