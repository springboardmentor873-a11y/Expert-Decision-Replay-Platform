from typing import List, Optional
from sqlalchemy import func
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.models.category import Category
from app.models.decision import Decision
from app.models.user import User
from app.models.audit_log import AuditActionEnum
from app.schemas.category import CategoryCreateRequest, CategoryUpdateRequest
from app.services.audit_service import create_audit_log


def get_categories(db: Session) -> List[dict]:
    """Return all categories with associated decision counts."""
    categories = db.query(Category).order_by(Category.name.asc()).all()
    results = []
    for cat in categories:
        count = db.query(func.count(Decision.id)).filter(Decision.category_id == cat.id).scalar() or 0
        results.append({
            "id": cat.id,
            "name": cat.name,
            "description": cat.description,
            "created_by": cat.created_by,
            "created_at": cat.created_at,
            "updated_at": cat.updated_at,
            "decision_count": count
        })
    return results


def get_category_by_id(db: Session, category_id: int) -> dict:
    cat = db.query(Category).filter(Category.id == category_id).first()
    if not cat:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Category with ID {category_id} not found."
        )
    count = db.query(func.count(Decision.id)).filter(Decision.category_id == cat.id).scalar() or 0
    return {
        "id": cat.id,
        "name": cat.name,
        "description": cat.description,
        "created_by": cat.created_by,
        "created_at": cat.created_at,
        "updated_at": cat.updated_at,
        "decision_count": count
    }


def create_category(db: Session, category_in: CategoryCreateRequest, current_user: User) -> dict:
    existing = db.query(Category).filter(func.lower(Category.name) == category_in.name.strip().lower()).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Category with name '{category_in.name}' already exists."
        )

    cat = Category(
        name=category_in.name.strip(),
        description=category_in.description.strip() if category_in.description else None,
        created_by=current_user.id
    )
    db.add(cat)
    db.commit()
    db.refresh(cat)

    create_audit_log(
        db=db,
        user_id=current_user.id,
        action=AuditActionEnum.CATEGORY_CREATED.value,
        entity_type="Category",
        entity_id=cat.id,
        description=f"User '{current_user.full_name}' created category '{cat.name}'."
    )

    return {
        "id": cat.id,
        "name": cat.name,
        "description": cat.description,
        "created_by": cat.created_by,
        "created_at": cat.created_at,
        "updated_at": cat.updated_at,
        "decision_count": 0
    }


def update_category(db: Session, category_id: int, category_in: CategoryUpdateRequest, current_user: User) -> dict:
    cat = db.query(Category).filter(Category.id == category_id).first()
    if not cat:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Category with ID {category_id} not found."
        )

    if category_in.name is not None:
        new_name = category_in.name.strip()
        existing = db.query(Category).filter(
            func.lower(Category.name) == new_name.lower(),
            Category.id != category_id
        ).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Category with name '{new_name}' already exists."
            )
        cat.name = new_name

    if category_in.description is not None:
        cat.description = category_in.description.strip() if category_in.description else None

    db.commit()
    db.refresh(cat)

    create_audit_log(
        db=db,
        user_id=current_user.id,
        action=AuditActionEnum.CATEGORY_UPDATED.value,
        entity_type="Category",
        entity_id=cat.id,
        description=f"User '{current_user.full_name}' updated category '{cat.name}'."
    )

    count = db.query(func.count(Decision.id)).filter(Decision.category_id == cat.id).scalar() or 0
    return {
        "id": cat.id,
        "name": cat.name,
        "description": cat.description,
        "created_by": cat.created_by,
        "created_at": cat.created_at,
        "updated_at": cat.updated_at,
        "decision_count": count
    }


def delete_category(db: Session, category_id: int, current_user: User) -> None:
    cat = db.query(Category).filter(Category.id == category_id).first()
    if not cat:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Category with ID {category_id} not found."
        )

    cat_name = cat.name
    # Unlink decisions referencing this category
    db.query(Decision).filter(Decision.category_id == category_id).update({"category_id": None})
    db.delete(cat)
    db.commit()

    create_audit_log(
        db=db,
        user_id=current_user.id,
        action=AuditActionEnum.CATEGORY_DELETED.value,
        entity_type="Category",
        entity_id=category_id,
        description=f"User '{current_user.full_name}' deleted category '{cat_name}'."
    )
