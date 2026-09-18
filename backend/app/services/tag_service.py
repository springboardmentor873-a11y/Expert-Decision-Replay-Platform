from typing import List
from sqlalchemy import func
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.models.tag import Tag, DecisionTag
from app.models.decision import Decision
from app.models.user import User
from app.models.audit_log import AuditActionEnum
from app.schemas.tag import TagCreateRequest
from app.services.audit_service import create_audit_log


def get_tags(db: Session) -> List[Tag]:
    return db.query(Tag).order_by(Tag.name.asc()).all()


def create_tag(db: Session, tag_in: TagCreateRequest, current_user: User) -> Tag:
    name_clean = tag_in.name.strip()
    existing = db.query(Tag).filter(func.lower(Tag.name) == name_clean.lower()).first()
    if existing:
        return existing

    tag = Tag(
        name=name_clean,
        description=tag_in.description.strip() if tag_in.description else None
    )
    db.add(tag)
    db.commit()
    db.refresh(tag)

    create_audit_log(
        db=db,
        user_id=current_user.id,
        action=AuditActionEnum.TAG_CREATED.value,
        entity_type="Tag",
        entity_id=tag.id,
        description=f"User '{current_user.full_name}' created tag '{tag.name}'."
    )
    return tag


def assign_tags_to_decision(db: Session, decision_id: int, tag_ids: List[int], current_user: User) -> List[Tag]:
    decision = db.query(Decision).filter(Decision.id == decision_id).first()
    if not decision:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Decision with ID {decision_id} not found."
        )

    assigned_tags = []
    for tid in tag_ids:
        tag = db.query(Tag).filter(Tag.id == tid).first()
        if not tag:
            continue
        existing_dt = db.query(DecisionTag).filter(
            DecisionTag.decision_id == decision_id,
            DecisionTag.tag_id == tid
        ).first()
        if not existing_dt:
            dt = DecisionTag(decision_id=decision_id, tag_id=tid)
            db.add(dt)
        assigned_tags.append(tag)

    db.commit()

    create_audit_log(
        db=db,
        user_id=current_user.id,
        action=AuditActionEnum.TAG_ASSIGNED.value,
        entity_type="Decision",
        entity_id=decision_id,
        description=f"User '{current_user.full_name}' assigned tags to decision #{decision_id}."
    )
    return assigned_tags


def remove_tag_from_decision(db: Session, decision_id: int, tag_id: int, current_user: User) -> None:
    dt = db.query(DecisionTag).filter(
        DecisionTag.decision_id == decision_id,
        DecisionTag.tag_id == tag_id
    ).first()
    if dt:
        db.delete(dt)
        db.commit()

        create_audit_log(
            db=db,
            user_id=current_user.id,
            action=AuditActionEnum.TAG_REMOVED.value,
            entity_type="Decision",
            entity_id=decision_id,
            description=f"User '{current_user.full_name}' removed tag #{tag_id} from decision #{decision_id}."
        )
