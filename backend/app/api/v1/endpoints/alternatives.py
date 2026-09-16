from datetime import datetime, UTC
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db
from app.core.exceptions import NotFoundError, ForbiddenError
from app.models.decision import (
    Alternative,
    AlternativeEvaluation,
    Decision,
    EvaluationCriterion,
    Risk,
    Stakeholder,
)
from app.models.identity import Role, User, UserProfile
from app.schemas.alternative import (
    AlternativeCreate,
    AlternativeEvaluationOut,
    AlternativeOut,
    AlternativeUpdate,
    CriterionCreate,
    CriterionOut,
    CriterionUpdate,
    EvaluationBatchUpdate,
    EvaluationCreate,
    EvaluationMatrixOut,
    RiskCreate,
    RiskOut,
    RiskUpdate,
    StakeholderCreate,
    StakeholderOut,
    StakeholderUpdate,
)
from app.schemas.decision import DecisionSelectAlternative
from app.services.audit_service import log_audit
from app.services.decision_service import calculate_alternative_scores
from app.services.notification_service import notify_decision_stakeholders
from app.services.version_service import create_decision_snapshot

router = APIRouter(tags=["alternatives & criteria"])


def check_decision_matrix_permission(
    db: Session,
    decision: Decision,
    current_user: User,
    action_description: str = "modify decision criteria or evaluations",
) -> None:
    """Validate user permissions to alter criteria, alternatives, or evaluations based on lifecycle state and role."""
    user_role = db.scalar(select(Role).where(Role.id == current_user.role_id))
    role_code = user_role.code if user_role else "employee"
    is_admin = role_code == "administrator"
    is_manager = role_code == "manager"
    is_reviewer = role_code == "reviewer"
    is_owner = decision.owner_id == current_user.id

    if is_admin:
        return

    if decision.status in ("approved", "rejected", "superseded"):
        raise ForbiddenError(
            message=f"Decision is in '{decision.status}' status and is locked as an immutable record."
        )

    if decision.status == "in_approval":
        if not is_manager:
            raise ForbiddenError(
                message="Decision is in Management Approval. Only designated Managers or Administrators can evaluate or modify scores."
            )
        return

    if decision.status == "in_review":
        if not (is_reviewer or is_manager):
            raise ForbiddenError(
                message="Decision is currently in Peer Review. The author cannot alter scores or criteria while under formal review."
            )
        return

    if decision.status in ("draft", "changes_requested"):
        if not (is_owner or is_manager):
            raise ForbiddenError(
                message="You do not have permission to modify this draft decision."
            )
        return

    raise ForbiddenError(message=f"You do not have permission to {action_description}.")


# ---------------- ALTERNATIVES ----------------

@router.post("/decisions/{decision_id}/alternatives", response_model=AlternativeOut, status_code=status.HTTP_201_CREATED)
def add_alternative(
    decision_id: UUID,
    data: AlternativeCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> AlternativeOut:
    """Add a proposed alternative to a decision."""
    decision = db.scalar(select(Decision).where(Decision.id == decision_id, Decision.deleted_at.is_(None)))
    if not decision:
        raise NotFoundError(message="Decision not found.")
    check_decision_matrix_permission(db, decision, current_user, "add alternative options")

    alt = Alternative(
        decision_id=decision_id,
        title=data.title.strip(),
        description=data.description.strip() if data.description else None,
        sort_order=data.sort_order,
    )
    db.add(alt)
    db.flush()

    create_decision_snapshot(db, decision_id, current_user.id, reason=f"Alternative '{alt.title}' added")
    log_audit(
        db=db,
        action="alternative_create",
        entity_type="alternative",
        entity_id=alt.id,
        actor_id=current_user.id,
        decision_id=decision_id,
    )
    notify_decision_stakeholders(
        db=db,
        decision_id=decision_id,
        type="alternative_added",
        title=f"New Alternative Added: {alt.title}",
        body=f"A new candidate solution '{alt.title}' was added to '{decision.title}'.",
        payload={"decision_id": str(decision_id), "alternative_id": str(alt.id)},
        exclude_user_id=current_user.id,
    )
    db.commit()
    db.refresh(alt)

    ao = AlternativeOut.model_validate(alt)
    ao.total_score = None
    return ao



@router.put("/alternatives/{alt_id}", response_model=AlternativeOut)
def update_alternative(
    alt_id: UUID,
    data: AlternativeUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> AlternativeOut:
    """Update an alternative."""
    alt = db.scalar(select(Alternative).where(Alternative.id == alt_id, Alternative.deleted_at.is_(None)))
    if not alt:
        raise NotFoundError(message="Alternative not found.")
    decision = db.scalar(select(Decision).where(Decision.id == alt.decision_id, Decision.deleted_at.is_(None)))
    if not decision:
        raise NotFoundError(message="Decision not found.")
    check_decision_matrix_permission(db, decision, current_user, "update alternative options")

    if data.title is not None:
        alt.title = data.title.strip()
    if data.description is not None:
        alt.description = data.description.strip()
    if data.sort_order is not None:
        alt.sort_order = data.sort_order
    if data.is_selected is not None:
        alt.is_selected = data.is_selected

    create_decision_snapshot(db, alt.decision_id, current_user.id, reason=f"Alternative '{alt.title}' updated")
    log_audit(
        db=db,
        action="alternative_update",
        entity_type="alternative",
        entity_id=alt.id,
        actor_id=current_user.id,
        decision_id=alt.decision_id,
    )
    db.commit()
    db.refresh(alt)

    scores = calculate_alternative_scores(db, alt.decision_id)
    ao = AlternativeOut.model_validate(alt)
    ao.total_score = scores.get(alt.id)
    return ao


@router.delete("/alternatives/{alt_id}")
def delete_alternative(
    alt_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict:
    """Soft delete an alternative."""
    alt = db.scalar(select(Alternative).where(Alternative.id == alt_id, Alternative.deleted_at.is_(None)))
    if not alt:
        raise NotFoundError(message="Alternative not found.")
    decision = db.scalar(select(Decision).where(Decision.id == alt.decision_id, Decision.deleted_at.is_(None)))
    if not decision:
        raise NotFoundError(message="Decision not found.")
    check_decision_matrix_permission(db, decision, current_user, "delete alternative options")

    alt.deleted_at = datetime.now(UTC)
    create_decision_snapshot(db, alt.decision_id, current_user.id, reason=f"Alternative '{alt.title}' deleted")
    log_audit(
        db=db,
        action="alternative_delete",
        entity_type="alternative",
        entity_id=alt.id,
        actor_id=current_user.id,
        decision_id=alt.decision_id,
    )
    db.commit()
    return {"status": "ok", "message": "Alternative deleted."}


@router.post("/decisions/{decision_id}/select-alternative", response_model=AlternativeOut)
def select_decision_alternative(
    decision_id: UUID,
    data: DecisionSelectAlternative,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> AlternativeOut:
    """Set the chosen alternative for the decision."""
    decision = db.scalar(select(Decision).where(Decision.id == decision_id, Decision.deleted_at.is_(None)))
    if not decision:
        raise NotFoundError(message="Decision not found.")
    check_decision_matrix_permission(db, decision, current_user, "select designated alternative")

    target_alt = db.scalar(
        select(Alternative).where(Alternative.id == data.alternative_id, Alternative.decision_id == decision_id)
    )
    if not target_alt:
        raise NotFoundError(message="Selected alternative not found.")

    # Unmark others
    all_alts = db.scalars(select(Alternative).where(Alternative.decision_id == decision_id)).all()
    for a in all_alts:
        a.is_selected = (a.id == data.alternative_id)

    decision.selected_alternative_id = data.alternative_id

    create_decision_snapshot(db, decision_id, current_user.id, reason=f"Alternative '{target_alt.title}' selected")
    log_audit(
        db=db,
        action="alternative_select",
        entity_type="decision",
        entity_id=decision_id,
        actor_id=current_user.id,
        decision_id=decision_id,
        extra={"selected_alternative_id": str(data.alternative_id)},
    )
    notify_decision_stakeholders(
        db=db,
        decision_id=decision_id,
        type="alternative_selected",
        title=f"Option Selected: {target_alt.title}",
        body=f"'{target_alt.title}' was selected as the designated decision choice for '{decision.title}'.",
        payload={"decision_id": str(decision_id), "alternative_id": str(target_alt.id)},
        exclude_user_id=current_user.id,
    )
    db.commit()
    db.refresh(target_alt)


    scores = calculate_alternative_scores(db, decision_id)
    ao = AlternativeOut.model_validate(target_alt)
    ao.total_score = scores.get(target_alt.id)
    return ao


# ---------------- EVALUATION CRITERIA ----------------

@router.post("/decisions/{decision_id}/criteria", response_model=CriterionOut, status_code=status.HTTP_201_CREATED)
def add_criterion(
    decision_id: UUID,
    data: CriterionCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> CriterionOut:
    """Add an evaluation criterion."""
    decision = db.scalar(select(Decision).where(Decision.id == decision_id, Decision.deleted_at.is_(None)))
    if not decision:
        raise NotFoundError(message="Decision not found.")
    check_decision_matrix_permission(db, decision, current_user, "add evaluation criteria")

    crit = EvaluationCriterion(
        decision_id=decision_id,
        name=data.name.strip(),
        description=data.description.strip() if data.description else None,
        weight=data.weight,
        sort_order=data.sort_order,
    )
    db.add(crit)
    db.flush()

    create_decision_snapshot(db, decision_id, current_user.id, reason=f"Criterion '{crit.name}' added")
    log_audit(
        db=db,
        action="criterion_create",
        entity_type="criterion",
        entity_id=crit.id,
        actor_id=current_user.id,
        decision_id=decision_id,
    )
    db.commit()
    db.refresh(crit)
    return CriterionOut.model_validate(crit)


@router.put("/criteria/{crit_id}", response_model=CriterionOut)
def update_criterion(
    crit_id: UUID,
    data: CriterionUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> CriterionOut:
    """Update criterion name, weight, or sort order."""
    crit = db.scalar(select(EvaluationCriterion).where(EvaluationCriterion.id == crit_id, EvaluationCriterion.deleted_at.is_(None)))
    if not crit:
        raise NotFoundError(message="Criterion not found.")
    decision = db.scalar(select(Decision).where(Decision.id == crit.decision_id, Decision.deleted_at.is_(None)))
    if not decision:
        raise NotFoundError(message="Decision not found.")
    check_decision_matrix_permission(db, decision, current_user, "update evaluation criteria")

    if data.name is not None:
        crit.name = data.name.strip()
    if data.description is not None:
        crit.description = data.description.strip()
    if data.weight is not None:
        crit.weight = data.weight
    if data.sort_order is not None:
        crit.sort_order = data.sort_order

    create_decision_snapshot(db, crit.decision_id, current_user.id, reason=f"Criterion '{crit.name}' updated")
    log_audit(
        db=db,
        action="criterion_update",
        entity_type="criterion",
        entity_id=crit.id,
        actor_id=current_user.id,
        decision_id=crit.decision_id,
    )
    db.commit()
    db.refresh(crit)
    return CriterionOut.model_validate(crit)


@router.delete("/criteria/{crit_id}")
def delete_criterion(
    crit_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict:
    """Soft delete an evaluation criterion."""
    crit = db.scalar(select(EvaluationCriterion).where(EvaluationCriterion.id == crit_id, EvaluationCriterion.deleted_at.is_(None)))
    if not crit:
        raise NotFoundError(message="Criterion not found.")
    decision = db.scalar(select(Decision).where(Decision.id == crit.decision_id, Decision.deleted_at.is_(None)))
    if not decision:
        raise NotFoundError(message="Decision not found.")
    check_decision_matrix_permission(db, decision, current_user, "delete evaluation criteria")

    crit.deleted_at = datetime.now(UTC)
    create_decision_snapshot(db, crit.decision_id, current_user.id, reason=f"Criterion '{crit.name}' deleted")
    log_audit(
        db=db,
        action="criterion_delete",
        entity_type="criterion",
        entity_id=crit.id,
        actor_id=current_user.id,
        decision_id=crit.decision_id,
    )
    db.commit()
    return {"status": "ok", "message": "Criterion deleted."}


# ---------------- EVALUATIONS MATRIX ----------------

@router.post("/decisions/{decision_id}/evaluations", response_model=AlternativeEvaluationOut)
def record_evaluation(
    decision_id: UUID,
    data: EvaluationCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> AlternativeEvaluationOut:
    """Record or update a score for an alternative under a criterion."""
    decision = db.scalar(select(Decision).where(Decision.id == decision_id, Decision.deleted_at.is_(None)))
    if not decision:
        raise NotFoundError(message="Decision not found.")
    check_decision_matrix_permission(db, decision, current_user, "record evaluation score")

    eval_record = db.scalar(
        select(AlternativeEvaluation).where(
            AlternativeEvaluation.decision_id == decision_id,
            AlternativeEvaluation.alternative_id == data.alternative_id,
            AlternativeEvaluation.criterion_id == data.criterion_id,
        )
    )
    if not eval_record:
        eval_record = AlternativeEvaluation(
            decision_id=decision_id,
            alternative_id=data.alternative_id,
            criterion_id=data.criterion_id,
            score=data.score,
            notes=data.notes,
            evaluated_by_id=current_user.id,
        )
        db.add(eval_record)
    else:
        eval_record.score = data.score
        eval_record.notes = data.notes
        eval_record.evaluated_by_id = current_user.id

    db.commit()
    db.refresh(eval_record)
    return AlternativeEvaluationOut.model_validate(eval_record)


@router.post("/decisions/{decision_id}/evaluations/batch", response_model=list[AlternativeEvaluationOut])
def batch_record_evaluations(
    decision_id: UUID,
    data: EvaluationBatchUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[AlternativeEvaluationOut]:
    """Batch update alternative evaluation matrix scores."""
    decision = db.scalar(select(Decision).where(Decision.id == decision_id, Decision.deleted_at.is_(None)))
    if not decision:
        raise NotFoundError(message="Decision not found.")
    check_decision_matrix_permission(db, decision, current_user, "save evaluation matrix scores")

    results = []
    for item in data.evaluations:
        eval_record = db.scalar(
            select(AlternativeEvaluation).where(
                AlternativeEvaluation.decision_id == decision_id,
                AlternativeEvaluation.alternative_id == item.alternative_id,
                AlternativeEvaluation.criterion_id == item.criterion_id,
            )
        )
        if not eval_record:
            eval_record = AlternativeEvaluation(
                decision_id=decision_id,
                alternative_id=item.alternative_id,
                criterion_id=item.criterion_id,
                score=item.score,
                notes=item.notes,
                evaluated_by_id=current_user.id,
            )
            db.add(eval_record)
        else:
            eval_record.score = item.score
            eval_record.notes = item.notes
            eval_record.evaluated_by_id = current_user.id
        db.flush()
        results.append(AlternativeEvaluationOut.model_validate(eval_record))

    create_decision_snapshot(db, decision_id, current_user.id, reason="Evaluation scores updated")
    log_audit(
        db=db,
        action="evaluations_batch_update",
        entity_type="decision",
        entity_id=decision_id,
        actor_id=current_user.id,
        decision_id=decision_id,
    )
    dec_title = decision.title if decision else "Decision"
    notify_decision_stakeholders(
        db=db,
        decision_id=decision_id,
        type="evaluations_updated",
        title=f"Evaluation Scores Saved: {dec_title}",
        body=f"Comparative matrix evaluation scores and weighted rankings were updated for '{dec_title}'.",
        payload={"decision_id": str(decision_id)},
        exclude_user_id=current_user.id,
    )
    db.commit()
    return results




@router.get("/decisions/{decision_id}/evaluation-matrix", response_model=EvaluationMatrixOut)
def get_evaluation_matrix(
    decision_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> EvaluationMatrixOut:
    """Get the full comparative evaluation matrix (criteria, alternatives with total scores, and cell scores with evaluator info)."""
    scores = calculate_alternative_scores(db, decision_id)

    alts = db.scalars(
        select(Alternative)
        .where(Alternative.decision_id == decision_id, Alternative.deleted_at.is_(None))
        .order_by(Alternative.sort_order)
    ).all()
    alt_outs = []
    for a in alts:
        ao = AlternativeOut.model_validate(a)
        ao.total_score = scores.get(a.id)
        alt_outs.append(ao)

    crits = db.scalars(
        select(EvaluationCriterion)
        .where(EvaluationCriterion.decision_id == decision_id, EvaluationCriterion.deleted_at.is_(None))
        .order_by(EvaluationCriterion.sort_order)
    ).all()
    crit_outs = [CriterionOut.model_validate(c) for c in crits]

    evals = db.scalars(
        select(AlternativeEvaluation).where(AlternativeEvaluation.decision_id == decision_id)
    ).all()
    eval_outs = []
    for e in evals:
        eo = AlternativeEvaluationOut.model_validate(e)
        if e.evaluated_by_id:
            eval_user = db.scalar(select(User).where(User.id == e.evaluated_by_id))
            if eval_user:
                profile = db.scalar(select(UserProfile).where(UserProfile.user_id == eval_user.id))
                role = db.scalar(select(Role).where(Role.id == eval_user.role_id))
                eo.evaluated_by_name = profile.full_name if profile and profile.full_name else eval_user.email
                eo.evaluated_by_role = role.name if role else None
        eval_outs.append(eo)

    return EvaluationMatrixOut(criteria=crit_outs, alternatives=alt_outs, evaluations=eval_outs)


# ---------------- RISKS ----------------

@router.post("/decisions/{decision_id}/risks", response_model=RiskOut, status_code=status.HTTP_201_CREATED)
def add_risk(
    decision_id: UUID,
    data: RiskCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> RiskOut:
    """Add a risk and mitigation strategy to a decision."""
    decision = db.scalar(select(Decision).where(Decision.id == decision_id, Decision.deleted_at.is_(None)))
    if not decision:
        raise NotFoundError(message="Decision not found.")
    check_decision_matrix_permission(db, decision, current_user, "add risk assessments")

    risk = Risk(
        decision_id=decision_id,
        title=data.title.strip(),
        description=data.description.strip() if data.description else None,
        severity=data.severity,
        likelihood=data.likelihood,
        mitigation=data.mitigation.strip() if data.mitigation else None,
    )
    db.add(risk)
    db.flush()

    create_decision_snapshot(db, decision_id, current_user.id, reason=f"Risk '{risk.title}' added")
    log_audit(
        db=db,
        action="risk_create",
        entity_type="risk",
        entity_id=risk.id,
        actor_id=current_user.id,
        decision_id=decision_id,
    )
    db.commit()
    db.refresh(risk)
    return RiskOut.model_validate(risk)


@router.put("/risks/{risk_id}", response_model=RiskOut)
def update_risk(
    risk_id: UUID,
    data: RiskUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> RiskOut:
    """Update risk details."""
    risk = db.scalar(select(Risk).where(Risk.id == risk_id, Risk.deleted_at.is_(None)))
    if not risk:
        raise NotFoundError(message="Risk not found.")
    decision = db.scalar(select(Decision).where(Decision.id == risk.decision_id, Decision.deleted_at.is_(None)))
    if not decision:
        raise NotFoundError(message="Decision not found.")
    check_decision_matrix_permission(db, decision, current_user, "update risk assessments")

    if data.title is not None:
        risk.title = data.title.strip()
    if data.description is not None:
        risk.description = data.description.strip()
    if data.severity is not None:
        risk.severity = data.severity
    if data.likelihood is not None:
        risk.likelihood = data.likelihood
    if data.mitigation is not None:
        risk.mitigation = data.mitigation.strip()

    create_decision_snapshot(db, risk.decision_id, current_user.id, reason=f"Risk '{risk.title}' updated")
    log_audit(
        db=db,
        action="risk_update",
        entity_type="risk",
        entity_id=risk.id,
        actor_id=current_user.id,
        decision_id=risk.decision_id,
    )
    db.commit()
    db.refresh(risk)
    return RiskOut.model_validate(risk)


@router.delete("/risks/{risk_id}")
def delete_risk(
    risk_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict:
    """Soft delete a risk."""
    risk = db.scalar(select(Risk).where(Risk.id == risk_id, Risk.deleted_at.is_(None)))
    if not risk:
        raise NotFoundError(message="Risk not found.")
    decision = db.scalar(select(Decision).where(Decision.id == risk.decision_id, Decision.deleted_at.is_(None)))
    if not decision:
        raise NotFoundError(message="Decision not found.")
    check_decision_matrix_permission(db, decision, current_user, "delete risk assessments")

    risk.deleted_at = datetime.now(UTC)
    create_decision_snapshot(db, risk.decision_id, current_user.id, reason=f"Risk '{risk.title}' deleted")
    log_audit(
        db=db,
        action="risk_delete",
        entity_type="risk",
        entity_id=risk.id,
        actor_id=current_user.id,
        decision_id=risk.decision_id,
    )
    db.commit()
    return {"status": "ok", "message": "Risk deleted."}


# ---------------- STAKEHOLDERS ----------------

@router.post("/decisions/{decision_id}/stakeholders", response_model=StakeholderOut, status_code=status.HTTP_201_CREATED)
def add_stakeholder(
    decision_id: UUID,
    data: StakeholderCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> StakeholderOut:
    """Add a stakeholder to the decision."""
    decision = db.scalar(select(Decision).where(Decision.id == decision_id, Decision.deleted_at.is_(None)))
    if not decision:
        raise NotFoundError(message="Decision not found.")
    check_decision_matrix_permission(db, decision, current_user, "add stakeholders")

    st = Stakeholder(
        decision_id=decision_id,
        user_id=data.user_id,
        display_name=data.display_name.strip(),
        stakeholder_role=data.stakeholder_role.strip() if data.stakeholder_role else None,
    )
    db.add(st)
    db.flush()

    create_decision_snapshot(db, decision_id, current_user.id, reason=f"Stakeholder '{st.display_name}' added")
    log_audit(
        db=db,
        action="stakeholder_add",
        entity_type="stakeholder",
        entity_id=st.id,
        actor_id=current_user.id,
        decision_id=decision_id,
    )
    db.commit()
    db.refresh(st)
    return StakeholderOut.model_validate(st)


@router.delete("/stakeholders/{stakeholder_id}")
def delete_stakeholder(
    stakeholder_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict:
    """Soft delete a stakeholder."""
    st = db.scalar(select(Stakeholder).where(Stakeholder.id == stakeholder_id, Stakeholder.deleted_at.is_(None)))
    if not st:
        raise NotFoundError(message="Stakeholder not found.")
    decision = db.scalar(select(Decision).where(Decision.id == st.decision_id, Decision.deleted_at.is_(None)))
    if not decision:
        raise NotFoundError(message="Decision not found.")
    check_decision_matrix_permission(db, decision, current_user, "delete stakeholders")

    st.deleted_at = datetime.now(UTC)
    create_decision_snapshot(db, st.decision_id, current_user.id, reason=f"Stakeholder '{st.display_name}' deleted")
    log_audit(
        db=db,
        action="stakeholder_remove",
        entity_type="stakeholder",
        entity_id=st.id,
        actor_id=current_user.id,
        decision_id=st.decision_id,
    )
    db.commit()
    return {"status": "ok", "message": "Stakeholder removed."}
