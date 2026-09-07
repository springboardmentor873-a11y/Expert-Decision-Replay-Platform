from fastapi import APIRouter
from fastapi import Depends
from fastapi import HTTPException

from sqlalchemy.orm import Session

from datetime import datetime

from app.database import get_db
from app.models import Decision
from app.models import DecisionAlternative
from app.models import User
from app.auth import get_current_user
from app.schemas import AlternativeCreate
from app.schemas import AlternativeUpdate
from app.schemas import AlternativeRecommendUpdate
from app.routes.decisions import record_version
from app.routes.decisions import VALID_ALTERNATIVE_LEVELS


# ==========================================
# ROUTER
# ==========================================

router = APIRouter(
    prefix="/decisions",
    tags=["Decision Alternatives"]
)


# ==========================================
# HELPER: GET DECISION OR 404
# ==========================================

def get_decision_or_404(
    db: Session,
    decision_id: int
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

    return decision


# ==========================================
# HELPER: GET ALTERNATIVE OR 404
# ==========================================

def get_alternative_or_404(
    db: Session,
    decision_id: int,
    alternative_id: int
):

    alternative = (
        db.query(DecisionAlternative)
        .filter(
            DecisionAlternative.alternative_id == alternative_id,
            DecisionAlternative.decision_id == decision_id
        )
        .first()
    )

    if not alternative:

        raise HTTPException(
            status_code=404,
            detail="Alternative not found"
        )

    return alternative


# ==========================================
# HELPER: ALTERNATIVE DICT
# ==========================================

def alternative_dict(alternative):

    return {
        "alternative_id": alternative.alternative_id,
        "decision_id": alternative.decision_id,
        "title": alternative.title,
        "description": alternative.description,
        "pros": alternative.pros,
        "cons": alternative.cons,
        "estimated_cost": (
            float(alternative.estimated_cost)
            if alternative.estimated_cost is not None
            else None
        ),
        "feasibility": alternative.feasibility,
        "risk_level": alternative.risk_level,
        "risk_explanation": alternative.risk_explanation,
        "is_recommended": bool(alternative.is_recommended),
        "created_by": alternative.created_by,
        "created_by_name": (
            alternative.creator.name
            if alternative.creator
            else None
        ),
        "created_at": alternative.created_at,
        "updated_at": alternative.updated_at
    }


# ==========================================
# HELPER: VALIDATE LEVEL FIELD
# ==========================================

def validate_level(
    value: str,
    field_name: str
):

    if value and value not in VALID_ALTERNATIVE_LEVELS:

        raise HTTPException(
            status_code=422,
            detail=(
                f"Invalid {field_name} value. "
                "Allowed values: Low, Medium, High"
            )
        )


# ==========================================
# HELPER: CAN MANAGE ALTERNATIVES
# ==========================================

def can_manage(
    decision: Decision,
    current_user,
    alternative: DecisionAlternative = None
):

    if current_user.user_id == decision.expert_id:
        return True

    if current_user.role_id == 4:
        return True

    if (
        alternative is not None
        and alternative.created_by == current_user.user_id
    ):
        return True

    return False


def require_manage_access(
    decision: Decision,
    current_user,
    alternative: DecisionAlternative = None
):

    if not can_manage(decision, current_user, alternative):

        raise HTTPException(
            status_code=403,
            detail=(
                "You do not have permission to modify "
                "alternatives for this decision"
            )
        )


# ==========================================
# CREATE ALTERNATIVE
# ==========================================

@router.post("/{decision_id}/alternatives")
def create_alternative(
    decision_id: int,
    alternative_data: AlternativeCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):

    decision = get_decision_or_404(db, decision_id)

    require_manage_access(decision, current_user)

    if not alternative_data.title.strip():

        raise HTTPException(
            status_code=422,
            detail="Alternative title is required"
        )

    validate_level(
        alternative_data.feasibility,
        "feasibility"
    )

    validate_level(
        alternative_data.risk_level,
        "risk level"
    )

    if (
        alternative_data.is_recommended
        and alternative_data.is_recommended is True
    ):

        db.query(DecisionAlternative).filter(
            DecisionAlternative.decision_id == decision_id,
            DecisionAlternative.is_recommended.is_(True)
        ).update(
            {
                DecisionAlternative.is_recommended: False,
                DecisionAlternative.updated_at: datetime.utcnow()
            }
        )

    now = datetime.utcnow()

    new_alternative = DecisionAlternative(
        decision_id=decision_id,
        title=alternative_data.title.strip(),
        description=alternative_data.description,
        pros=alternative_data.pros,
        cons=alternative_data.cons,
        estimated_cost=alternative_data.estimated_cost,
        feasibility=alternative_data.feasibility,
        risk_level=alternative_data.risk_level,
        risk_explanation=alternative_data.risk_explanation,
        is_recommended=bool(
            alternative_data.is_recommended
        ),
        created_by=current_user.user_id,
        created_at=now,
        updated_at=now
    )

    db.add(new_alternative)

    record_version(
        db,
        decision,
        current_user,
        f"Alternative added: {new_alternative.title}"
    )

    db.commit()

    db.refresh(new_alternative)

    return alternative_dict(new_alternative)


# ==========================================
# GET ALL ALTERNATIVES FOR A DECISION
# ==========================================

@router.get("/{decision_id}/alternatives")
def get_alternatives(
    decision_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):

    get_decision_or_404(db, decision_id)

    alternatives = (
        db.query(DecisionAlternative)
        .filter(
            DecisionAlternative.decision_id == decision_id
        )
        .order_by(
            DecisionAlternative.alternative_id.asc()
        )
        .all()
    )

    return [
        alternative_dict(a)
        for a in alternatives
    ]


# ==========================================
# GET SINGLE ALTERNATIVE
# ==========================================

@router.get("/{decision_id}/alternatives/{alternative_id}")
def get_alternative(
    decision_id: int,
    alternative_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):

    get_decision_or_404(db, decision_id)

    alternative = get_alternative_or_404(
        db,
        decision_id,
        alternative_id
    )

    return alternative_dict(alternative)


# ==========================================
# UPDATE ALTERNATIVE (FULL)
# ==========================================

@router.put("/{decision_id}/alternatives/{alternative_id}")
def update_alternative(
    decision_id: int,
    alternative_id: int,
    alternative_data: AlternativeUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):

    decision = get_decision_or_404(db, decision_id)

    alternative = get_alternative_or_404(
        db,
        decision_id,
        alternative_id
    )

    require_manage_access(
        decision,
        current_user,
        alternative
    )

    if (
        alternative_data.title is not None
        and not alternative_data.title.strip()
    ):

        raise HTTPException(
            status_code=422,
            detail="Alternative title cannot be empty"
        )

    validate_level(
        alternative_data.feasibility,
        "feasibility"
    )

    validate_level(
        alternative_data.risk_level,
        "risk level"
    )

    if alternative_data.title is not None:
        alternative.title = alternative_data.title.strip()

    if alternative_data.description is not None:
        alternative.description = alternative_data.description

    if alternative_data.pros is not None:
        alternative.pros = alternative_data.pros

    if alternative_data.cons is not None:
        alternative.cons = alternative_data.cons

    if alternative_data.estimated_cost is not None:
        alternative.estimated_cost = (
            alternative_data.estimated_cost
        )

    if alternative_data.feasibility is not None:
        alternative.feasibility = alternative_data.feasibility

    if alternative_data.risk_level is not None:
        alternative.risk_level = alternative_data.risk_level

    if alternative_data.risk_explanation is not None:
        alternative.risk_explanation = (
            alternative_data.risk_explanation
        )

    if alternative_data.is_recommended is not None:

        if alternative_data.is_recommended:

            db.query(DecisionAlternative).filter(
                DecisionAlternative.decision_id == decision_id,
                DecisionAlternative.is_recommended.is_(True)
            ).update(
                {
                    DecisionAlternative.is_recommended: False,
                    DecisionAlternative.updated_at: datetime.utcnow()
                }
            )

        alternative.is_recommended = (
            alternative_data.is_recommended
        )

    alternative.updated_at = datetime.utcnow()

    record_version(
        db,
        decision,
        current_user,
        f"Alternative updated: {alternative.title}"
    )

    db.commit()

    db.refresh(alternative)

    return alternative_dict(alternative)


# ==========================================
# PARTIAL UPDATE ALTERNATIVE
# ==========================================

@router.patch("/{decision_id}/alternatives/{alternative_id}")
def patch_alternative(
    decision_id: int,
    alternative_id: int,
    alternative_data: AlternativeUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):

    return update_alternative(
        decision_id,
        alternative_id,
        alternative_data,
        db,
        current_user
    )


# ==========================================
# DELETE ALTERNATIVE
# ==========================================

@router.delete("/{decision_id}/alternatives/{alternative_id}")
def delete_alternative(
    decision_id: int,
    alternative_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):

    decision = get_decision_or_404(db, decision_id)

    alternative = get_alternative_or_404(
        db,
        decision_id,
        alternative_id
    )

    require_manage_access(
        decision,
        current_user,
        alternative
    )

    title = alternative.title

    db.delete(alternative)

    record_version(
        db,
        decision,
        current_user,
        f"Alternative deleted: {title}"
    )

    db.commit()

    return {
        "message": "Alternative deleted successfully",
        "decision_id": decision_id
    }


# ==========================================
# SELECT / RECOMMEND ALTERNATIVE
# ==========================================

@router.patch("/{decision_id}/alternatives/{alternative_id}/recommend")
def recommend_alternative(
    decision_id: int,
    alternative_id: int,
    recommend_data: AlternativeRecommendUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):

    decision = get_decision_or_404(db, decision_id)

    alternative = get_alternative_or_404(
        db,
        decision_id,
        alternative_id
    )

    require_manage_access(decision, current_user)

    if recommend_data.is_recommended:

        db.query(DecisionAlternative).filter(
            DecisionAlternative.decision_id == decision_id,
            DecisionAlternative.is_recommended.is_(True)
        ).update(
            {
                DecisionAlternative.is_recommended: False,
                DecisionAlternative.updated_at: datetime.utcnow()
            }
        )

        alternative.is_recommended = True

        record_version(
            db,
            decision,
            current_user,
            f"Recommended alternative selected: {alternative.title}"
        )

    else:

        if alternative.is_recommended:

            record_version(
                db,
                decision,
                current_user,
                f"Recommended alternative cleared: {alternative.title}"
            )

        alternative.is_recommended = False

    alternative.updated_at = datetime.utcnow()

    decision.updated_at = datetime.utcnow()

    db.commit()

    db.refresh(alternative)

    return {
        "message": (
            "Recommendation updated"
            if recommend_data.is_recommended
            else "Recommendation cleared"
        ),
        "alternative": alternative_dict(alternative)
    }