from typing import Any, Dict, List, Optional
from datetime import datetime
from sqlalchemy import or_, and_, desc, func
from sqlalchemy.orm import Session, joinedload

from app.models.decision import Decision, DecisionStatusEnum
from app.models.category import Category
from app.models.tag import Tag, DecisionTag
from app.models.document import Document
from app.models.audit_log import AuditLog
from app.models.role import RoleEnum
from app.models.user import User


def get_knowledge_repository(
    db: Session,
    current_user: User,
    search: Optional[str] = None,
    category_id: Optional[int] = None,
    tag_id: Optional[int] = None,
    status_filter: Optional[str] = None,
    skip: int = 0,
    limit: int = 50,
) -> Dict[str, Any]:
    role_name = current_user.role.name if current_user.role else ""
    is_admin = role_name == RoleEnum.ADMINISTRATOR.value

    query = db.query(Decision).options(
        joinedload(Decision.creator),
        joinedload(Decision.category),
        joinedload(Decision.tags).joinedload(DecisionTag.tag),
        joinedload(Decision.documents)
    )

    # Scoping: Knowledge repository focuses on Approved and Archived organizational knowledge,
    # plus non-draft decisions accessible under RBAC
    if status_filter:
        query = query.filter(Decision.status == status_filter)
    else:
        # Default: show Approved and Archived knowledge base decisions, plus any user-created decisions
        if not is_admin:
            query = query.filter(
                or_(
                    Decision.status.in_([DecisionStatusEnum.APPROVED.value, DecisionStatusEnum.ARCHIVED.value]),
                    Decision.created_by == current_user.id
                )
            )

    # Category filter
    if category_id:
        query = query.filter(Decision.category_id == category_id)

    # Tag filter
    if tag_id:
        query = query.join(Decision.tags).filter(DecisionTag.tag_id == tag_id)

    # Multi-field search
    if search and isinstance(search, str) and search.strip():
        term = f"%{search.strip()}%"
        query = query.filter(
            or_(
                Decision.title.ilike(term),
                Decision.problem_statement.ilike(term),
                Decision.context.ilike(term),
                Decision.decision_taken.ilike(term),
                Decision.reasoning.ilike(term),
                Decision.expected_outcome.ilike(term),
                Decision.actual_outcome.ilike(term),
            )
        )

    total_count = query.distinct().count()
    decisions = query.order_by(Decision.created_at.desc()).offset(skip).limit(limit).all()

    decision_items = []
    decision_ids = [d.id for d in decisions]

    for d in decisions:
        tags_list = [{"id": dt.tag.id, "name": dt.tag.name} for dt in d.tags if dt.tag]
        decision_items.append({
            "id": d.id,
            "title": d.title,
            "problem_statement": d.problem_statement,
            "context": d.context,
            "decision_taken": d.decision_taken,
            "reasoning": d.reasoning,
            "expected_outcome": d.expected_outcome,
            "actual_outcome": d.actual_outcome,
            "status": d.status,
            "category_id": d.category_id,
            "category_name": d.category.name if d.category else None,
            "creator_id": d.created_by,
            "creator_name": d.creator.full_name if d.creator else None,
            "tags": tags_list,
            "document_count": len(d.documents),
            "created_at": d.created_at,
            "updated_at": d.updated_at,
        })

    # Timeline events for these decisions
    timeline_events = []
    if decision_ids:
        audit_records = db.query(AuditLog).options(joinedload(AuditLog.user)).filter(
            AuditLog.entity_type == "Decision",
            AuditLog.entity_id.in_(decision_ids)
        ).order_by(AuditLog.created_at.desc()).limit(100).all()

        for rec in audit_records:
            timeline_events.append({
                "id": rec.id,
                "decision_id": rec.entity_id,
                "action": rec.action,
                "description": rec.description,
                "actor_name": rec.user.full_name if rec.user else "System",
                "timestamp": rec.created_at,
            })

    # Aggregated document archive for these decisions
    document_archive = []
    if decision_ids:
        docs = db.query(Document).options(joinedload(Document.decision), joinedload(Document.uploader)).filter(
            Document.decision_id.in_(decision_ids)
        ).order_by(Document.created_at.desc()).all()

        for doc in docs:
            document_archive.append({
                "id": doc.id,
                "decision_id": doc.decision_id,
                "decision_title": doc.decision.title if doc.decision else None,
                "original_filename": doc.original_filename,
                "file_type": doc.file_type,
                "file_size": doc.file_size,
                "uploader_name": doc.uploader.full_name if doc.uploader else None,
                "download_url": f"/api/v1/decisions/{doc.decision_id}/documents/{doc.id}/download",
                "created_at": doc.created_at,
            })

    # Categories list with counts
    categories = db.query(Category).all()
    cat_list = []
    for c in categories:
        cnt = db.query(func.count(Decision.id)).filter(Decision.category_id == c.id).scalar() or 0
        cat_list.append({"id": c.id, "name": c.name, "count": cnt})

    # Tags list with counts
    tags = db.query(Tag).all()
    tag_list = []
    for t in tags:
        cnt = db.query(func.count(DecisionTag.id)).filter(DecisionTag.tag_id == t.id).scalar() or 0
        tag_list.append({"id": t.id, "name": t.name, "count": cnt})

    return {
        "total": total_count,
        "decisions": decision_items,
        "timeline_events": timeline_events,
        "documents": document_archive,
        "categories": cat_list,
        "tags": tag_list,
    }
