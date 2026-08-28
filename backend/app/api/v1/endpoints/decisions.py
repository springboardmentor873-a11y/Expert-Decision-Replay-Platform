from datetime import datetime, UTC
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select, or_, and_
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db, require_role
from app.core.exceptions import NotFoundError, ForbiddenError
from app.models.decision import Decision, DecisionVersion
from app.models.identity import Role, User
from app.models.taxonomy import DecisionCategory, DecisionTag, DecisionTagLink
from app.schemas.decision import (
    DecisionCreate,
    DecisionDetailOut,
    DecisionOut,
    DecisionOutcomeUpdate,
    DecisionUpdate,
    DecisionVersionDiffOut,
    DecisionVersionOut,
)
from app.schemas.taxonomy import CategoryCreate, CategoryOut, TagCreate, TagOut
from app.services.audit_service import log_audit
from app.services.decision_service import build_decision_detail_out, build_decision_out
from app.services.version_service import compare_decision_versions, create_decision_snapshot

router = APIRouter(prefix="/decisions", tags=["decisions"])


# ---------------- TAXONOMY ----------------

@router.get("/categories", response_model=list[CategoryOut])
def list_categories(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[CategoryOut]:
    """List all active decision categories."""
    cats = db.scalars(select(DecisionCategory).where(DecisionCategory.deleted_at.is_(None)).order_by(DecisionCategory.name)).all()
    return [CategoryOut.model_validate(c) for c in cats]


@router.post("/categories", response_model=CategoryOut, status_code=status.HTTP_201_CREATED)
def create_category(
    data: CategoryCreate,
    current_user: User = Depends(require_role("administrator", "manager")),
    db: Session = Depends(get_db),
) -> CategoryOut:
    """Create a new decision category."""
    slug = data.slug or data.name.lower().replace(" ", "-").replace("&", "and")
    cat = DecisionCategory(
        name=data.name.strip(),
        slug=slug[:120],
        description=data.description.strip() if data.description else None,
    )
    db.add(cat)
    db.commit()
    db.refresh(cat)
    return CategoryOut.model_validate(cat)


@router.get("/tags", response_model=list[TagOut])
def list_tags(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[TagOut]:
    """List all active decision tags."""
    tags = db.scalars(select(DecisionTag).where(DecisionTag.deleted_at.is_(None)).order_by(DecisionTag.name)).all()
    return [TagOut.model_validate(t) for t in tags]


@router.post("/tags", response_model=TagOut, status_code=status.HTTP_201_CREATED)
def create_tag(
    data: TagCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> TagOut:
    """Create a decision tag."""
    slug = data.slug or data.name.lower().replace(" ", "-")
    existing = db.scalar(select(DecisionTag).where(DecisionTag.slug == slug))
    if existing:
        return TagOut.model_validate(existing)

    tag = DecisionTag(name=data.name.strip(), slug=slug[:80])
    db.add(tag)
    db.commit()
    db.refresh(tag)
    return TagOut.model_validate(tag)


# ---------------- DECISIONS CRUD ----------------

@router.get("", response_model=list[DecisionOut])
def list_decisions(
    category_id: UUID | None = None,
    status: str | None = None,
    team_id: UUID | None = None,
    owner_id: UUID | None = None,
    tag_id: UUID | None = None,
    search: str | None = None,
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=50, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[DecisionOut]:
    """List decisions with multi-faceted filtering, search, and pagination."""
    query = select(Decision).where(Decision.deleted_at.is_(None))

    if category_id:
        query = query.where(Decision.category_id == category_id)
    if status:
        query = query.where(Decision.status == status)
    if team_id:
        query = query.where(Decision.team_id == team_id)
    if owner_id:
        query = query.where(Decision.owner_id == owner_id)
    if tag_id:
        query = query.join(DecisionTagLink, DecisionTagLink.decision_id == Decision.id).where(
            DecisionTagLink.tag_id == tag_id
        )
    if search:
        s = f"%{search.strip()}%"
        query = query.where(or_(Decision.title.ilike(s), Decision.problem_statement.ilike(s)))

    decisions = db.scalars(query.order_by(Decision.created_at.desc()).offset(skip).limit(limit)).all()
    return [build_decision_out(db, d) for d in decisions]


@router.post("", response_model=DecisionDetailOut, status_code=status.HTTP_201_CREATED)
def create_decision(
    data: DecisionCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> DecisionDetailOut:
    """Create a new decision record in DRAFT status."""
    decision = Decision(
        owner_id=current_user.id,
        category_id=data.category_id,
        team_id=data.team_id,
        title=data.title.strip(),
        problem_statement=data.problem_statement.strip(),
        status="draft",
        implementation_status="not_started",
        current_version_no=0,
    )
    db.add(decision)
    db.flush()

    # Associate tags
    for tag_id in data.tag_ids:
        link = DecisionTagLink(decision_id=decision.id, tag_id=tag_id)
        db.add(link)
    db.flush()

    # Create initial version snapshot (v1)
    create_decision_snapshot(db, decision.id, current_user.id, reason="Initial creation")
    log_audit(
        db=db,
        action="decision_create",
        entity_type="decision",
        entity_id=decision.id,
        actor_id=current_user.id,
        decision_id=decision.id,
        extra={"title": decision.title},
    )
    db.commit()
    db.refresh(decision)

    return build_decision_detail_out(db, decision)


@router.get("/{decision_id}", response_model=DecisionDetailOut)
def get_decision_detail(
    decision_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> DecisionDetailOut:
    """Get complete case file for a single decision."""
    decision = db.scalar(select(Decision).where(Decision.id == decision_id, Decision.deleted_at.is_(None)))
    if not decision:
        raise NotFoundError(message="Decision not found.")
    return build_decision_detail_out(db, decision)


@router.put("/{decision_id}", response_model=DecisionDetailOut)
def update_decision(
    decision_id: UUID,
    data: DecisionUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> DecisionDetailOut:
    """Update decision problem, category, or team (automatically creates a new version)."""
    decision = db.scalar(select(Decision).where(Decision.id == decision_id, Decision.deleted_at.is_(None)))
    if not decision:
        raise NotFoundError(message="Decision not found.")

    user_role = db.scalar(select(Role).where(Role.id == current_user.role_id))
    is_admin = user_role and user_role.code == "administrator"
    if decision.owner_id != current_user.id and not is_admin:
        raise ForbiddenError(message="You can only edit decisions you own.")

    if data.title is not None:
        decision.title = data.title.strip()
    if data.problem_statement is not None:
        decision.problem_statement = data.problem_statement.strip()
    if data.category_id is not None:
        decision.category_id = data.category_id
    if data.team_id is not None:
        decision.team_id = data.team_id

    if data.tag_ids is not None:
        # Clear existing links and re-add
        existing_links = db.scalars(select(DecisionTagLink).where(DecisionTagLink.decision_id == decision_id)).all()
        for link in existing_links:
            db.delete(link)
        db.flush()
        for tag_id in data.tag_ids:
            db.add(DecisionTagLink(decision_id=decision.id, tag_id=tag_id))
        db.flush()

    create_decision_snapshot(db, decision.id, current_user.id, reason="Decision details updated")
    log_audit(
        db=db,
        action="decision_update",
        entity_type="decision",
        entity_id=decision.id,
        actor_id=current_user.id,
        decision_id=decision.id,
    )
    db.commit()
    db.refresh(decision)

    return build_decision_detail_out(db, decision)


@router.delete("/{decision_id}")
def delete_decision(
    decision_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict:
    """Soft delete / archive a decision."""
    decision = db.scalar(select(Decision).where(Decision.id == decision_id, Decision.deleted_at.is_(None)))
    if not decision:
        raise NotFoundError(message="Decision not found.")

    user_role = db.scalar(select(Role).where(Role.id == current_user.role_id))
    is_admin = user_role and user_role.code == "administrator"
    if decision.owner_id != current_user.id and not is_admin:
        raise ForbiddenError(message="Only the decision owner or an administrator can archive a decision.")

    decision.deleted_at = datetime.now(UTC)
    log_audit(
        db=db,
        action="decision_archive",
        entity_type="decision",
        entity_id=decision.id,
        actor_id=current_user.id,
        decision_id=decision.id,
    )
    db.commit()
    return {"status": "ok", "message": "Decision archived successfully."}


@router.post("/{decision_id}/outcome", response_model=DecisionDetailOut)
def record_decision_outcome(
    decision_id: UUID,
    data: DecisionOutcomeUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> DecisionDetailOut:
    """Record retrospective outcome and update implementation status."""
    decision = db.scalar(select(Decision).where(Decision.id == decision_id, Decision.deleted_at.is_(None)))
    if not decision:
        raise NotFoundError(message="Decision not found.")

    decision.outcome_summary = data.outcome_summary.strip()
    decision.implementation_status = data.implementation_status
    decision.outcome_recorded_at = datetime.now(UTC)
    decision.outcome_recorded_by_id = current_user.id

    create_decision_snapshot(db, decision.id, current_user.id, reason="Outcome rationale recorded")
    log_audit(
        db=db,
        action="decision_outcome_record",
        entity_type="decision",
        entity_id=decision.id,
        actor_id=current_user.id,
        decision_id=decision.id,
        extra={"implementation_status": data.implementation_status},
    )
    db.commit()
    db.refresh(decision)

    return build_decision_detail_out(db, decision)


# ---------------- VERSION HISTORY & DIFF ----------------

@router.get("/{decision_id}/versions", response_model=list[DecisionVersionOut])
def get_decision_versions(
    decision_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[DecisionVersionOut]:
    """Retrieve all historical snapshots for a decision."""
    versions = db.scalars(
        select(DecisionVersion)
        .where(DecisionVersion.decision_id == decision_id)
        .order_by(DecisionVersion.version_no.desc())
    ).all()
    results = []
    for v in versions:
        creator = db.scalar(select(User).where(User.id == v.created_by_id))
        creator_name = creator.email if creator else "System"
        results.append(
            DecisionVersionOut(
                id=v.id,
                decision_id=v.decision_id,
                version_no=v.version_no,
                reason=v.reason,
                snapshot=v.snapshot,
                created_by_id=v.created_by_id,
                created_by_name=creator_name,
                created_at=v.created_at,
            )
        )
    return results


@router.get("/{decision_id}/versions/compare", response_model=DecisionVersionDiffOut)
def compare_versions(
    decision_id: UUID,
    v1: int = Query(ge=1),
    v2: int = Query(ge=1),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> DecisionVersionDiffOut:
    """Compare two version snapshots and generate a structured field diff."""
    try:
        diff_data = compare_decision_versions(db, decision_id, v1, v2)
    except ValueError as e:
        raise NotFoundError(message=str(e))

    return DecisionVersionDiffOut(
        decision_id=decision_id,
        v1_no=v1,
        v2_no=v2,
        differences=diff_data.get("differences", {}),
    )
