from typing import Any, Dict, List, Optional
from datetime import datetime
from sqlalchemy import or_, and_, desc, func, distinct
from sqlalchemy.orm import Session, joinedload

from app.models.decision import Decision, DecisionStatusEnum
from app.models.alternative import Alternative
from app.models.category import Category
from app.models.tag import Tag, DecisionTag
from app.models.document import Document
from app.models.audit_log import AuditLog
from app.models.discussion import Discussion
from app.models.role import RoleEnum
from app.models.team import Team, TeamMember
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
        joinedload(Decision.team),
        joinedload(Decision.tags).joinedload(DecisionTag.tag),
        joinedload(Decision.documents),
        joinedload(Decision.alternatives)
    )

    if status_filter:
        query = query.filter(Decision.status == status_filter)
    else:
        if not is_admin:
            query = query.filter(
                or_(
                    Decision.status.in_([DecisionStatusEnum.APPROVED.value, DecisionStatusEnum.ARCHIVED.value]),
                    Decision.created_by == current_user.id
                )
            )

    if category_id:
        query = query.filter(Decision.category_id == category_id)

    if tag_id:
        query = query.join(Decision.tags).filter(DecisionTag.tag_id == tag_id)

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
            "team_id": d.team_id,
            "team_name": d.team.name if d.team else None,
            "creator_id": d.created_by,
            "creator_name": d.creator.full_name if d.creator else None,
            "tags": tags_list,
            "document_count": len(d.documents),
            "alternative_count": len(d.alternatives),
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
                "file_type": doc.content_type,
                "file_size": doc.file_size,
                "uploader_name": doc.uploader.full_name if doc.uploader else None,
                "download_url": f"/api/v1/decisions/{doc.decision_id}/documents/{doc.id}/download",
                "created_at": doc.created_at,
            })

    categories = db.query(Category).all()
    cat_list = []
    for c in categories:
        cnt = db.query(func.count(Decision.id)).filter(Decision.category_id == c.id).scalar() or 0
        cat_list.append({"id": c.id, "name": c.name, "count": cnt})

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


def get_knowledge_graph_data(db: Session, current_user: User) -> Dict[str, Any]:
    """
    Generates a live, fully-connected graph from real database records:
    Decisions, Teams, Categories, Alternatives, Documents, Tags, Authors.
    """
    decisions = db.query(Decision).options(
        joinedload(Decision.creator),
        joinedload(Decision.category),
        joinedload(Decision.team),
        joinedload(Decision.tags).joinedload(DecisionTag.tag),
        joinedload(Decision.documents),
        joinedload(Decision.alternatives)
    ).all()

    nodes_map = {}
    links = []

    def add_node(node_id: str, label: str, node_type: str, status: Optional[str] = None, meta: Optional[dict] = None):
        if node_id not in nodes_map:
            nodes_map[node_id] = {
                "id": node_id,
                "label": label,
                "type": node_type,
                "status": status,
                "meta": meta or {},
            }

    for d in decisions:
        d_node_id = f"decision-{d.id}"
        add_node(
            d_node_id,
            d.title,
            "decision",
            status=d.status,
            meta={
                "id": d.id,
                "category": d.category.name if d.category else None,
                "team": d.team.name if d.team else None,
                "author": d.creator.full_name if d.creator else None,
                "date": d.created_at.strftime("%Y-%m-%d") if d.created_at else None,
                "alternatives_count": len(d.alternatives),
                "documents_count": len(d.documents),
            }
        )

        # Connect author
        if d.creator:
            u_node_id = f"user-{d.creator.id}"
            add_node(u_node_id, d.creator.full_name, "user", meta={"email": d.creator.email})
            links.append({
                "source": u_node_id,
                "target": d_node_id,
                "label": "AUTHORED",
                "relationship": "authored"
            })

        # Connect category
        if d.category:
            c_node_id = f"category-{d.category.id}"
            add_node(c_node_id, d.category.name, "category", meta={"description": d.category.description})
            links.append({
                "source": d_node_id,
                "target": c_node_id,
                "label": "IN_CATEGORY",
                "relationship": "categorized_as"
            })

        # Connect team
        if d.team:
            t_node_id = f"team-{d.team.id}"
            add_node(t_node_id, d.team.name, "team", meta={"description": d.team.description})
            links.append({
                "source": d_node_id,
                "target": t_node_id,
                "label": "OWNED_BY_TEAM",
                "relationship": "owned_by_team"
            })

        # Connect alternatives
        for alt in d.alternatives:
            alt_node_id = f"alt-{alt.id}"
            alt_label = alt.name if len(alt.name) <= 28 else alt.name[:25] + "..."
            add_node(
                alt_node_id,
                alt_label,
                "alternative",
                status="SELECTED" if alt.is_selected else "EVALUATED",
                meta={"name": alt.name, "is_selected": alt.is_selected, "feasibility": alt.feasibility}
            )
            links.append({
                "source": d_node_id,
                "target": alt_node_id,
                "label": "SELECTED_ALTERNATIVE" if alt.is_selected else "CONSIDERED",
                "relationship": "evaluated_alternative",
                "is_selected": alt.is_selected
            })

        # Connect documents
        for doc in d.documents:
            doc_node_id = f"doc-{doc.id}"
            add_node(
                doc_node_id,
                doc.original_filename,
                "document",
                meta={"file_type": doc.content_type, "file_size": doc.file_size}
            )
            links.append({
                "source": d_node_id,
                "target": doc_node_id,
                "label": "ATTACHED_DOC",
                "relationship": "has_document"
            })

        # Connect tags
        for dt in d.tags:
            if dt.tag:
                tag_node_id = f"tag-{dt.tag.id}"
                add_node(tag_node_id, f"#{dt.tag.name}", "tag", meta={"id": dt.tag.id})
                links.append({
                    "source": d_node_id,
                    "target": tag_node_id,
                    "label": "TAGGED",
                    "relationship": "tagged_with"
                })

    nodes_list = list(nodes_map.values())
    type_counts = {}
    for n in nodes_list:
        type_counts[n["type"]] = type_counts.get(n["type"], 0) + 1

    return {
        "nodes": nodes_list,
        "links": links,
        "stats": {
            "total_nodes": len(nodes_list),
            "total_edges": len(links),
            "decision_nodes": type_counts.get("decision", 0),
            "category_nodes": type_counts.get("category", 0),
            "team_nodes": type_counts.get("team", 0),
            "alternative_nodes": type_counts.get("alternative", 0),
            "document_nodes": type_counts.get("document", 0),
            "tag_nodes": type_counts.get("tag", 0),
            "user_nodes": type_counts.get("user", 0),
        }
    }


def get_related_insights(db: Session, current_user: User) -> Dict[str, Any]:
    """
    Derives analytical and relational insights from the live database:
    portfolio breakdown, cross-team collaboration, high impact decisions, and trends.
    """
    total_decisions = db.query(func.count(Decision.id)).scalar() or 0
    total_documents = db.query(func.count(Document.id)).scalar() or 0
    total_categories = db.query(func.count(Category.id)).scalar() or 0
    total_tags = db.query(func.count(Tag.id)).scalar() or 0
    total_teams = db.query(func.count(Team.id)).scalar() or 0

    approved_count = db.query(func.count(Decision.id)).filter(
        Decision.status.in_([DecisionStatusEnum.APPROVED.value, "IMPLEMENTED"])
    ).scalar() or 0

    in_review_count = db.query(func.count(Decision.id)).filter(
        Decision.status == DecisionStatusEnum.UNDER_REVIEW.value
    ).scalar() or 0

    active_contributors_count = db.query(func.count(distinct(Decision.created_by))).scalar() or 0

    # Categories breakdown with real counts
    cat_records = db.query(
        Category.id,
        Category.name,
        Category.description,
        func.count(Decision.id).label("decisions_count")
    ).outerjoin(Decision, Decision.category_id == Category.id).group_by(
        Category.id, Category.name, Category.description
    ).order_by(desc("decisions_count")).all()

    category_insights = []
    for c_id, c_name, c_desc, c_cnt in cat_records:
        percentage = round((c_cnt / total_decisions * 100), 1) if total_decisions > 0 else 0
        category_insights.append({
            "id": c_id,
            "name": c_name,
            "description": c_desc,
            "decisions_count": c_cnt,
            "portfolio_share": percentage,
        })

    # High-impact decisions (ranking by alternatives count + documents + discussions)
    all_decs = db.query(Decision).options(
        joinedload(Decision.creator),
        joinedload(Decision.category),
        joinedload(Decision.team),
        joinedload(Decision.alternatives),
        joinedload(Decision.documents),
        joinedload(Decision.discussions)
    ).all()

    high_impact_list = []
    for d in all_decs:
        impact_score = len(d.alternatives) * 2 + len(d.documents) * 2 + len(d.discussions)
        selected_alt = next((a.name for a in d.alternatives if a.is_selected), None)
        high_impact_list.append({
            "id": d.id,
            "title": d.title,
            "status": d.status,
            "category": d.category.name if d.category else None,
            "team": d.team.name if d.team else None,
            "author": d.creator.full_name if d.creator else None,
            "alternatives_count": len(d.alternatives),
            "documents_count": len(d.documents),
            "discussions_count": len(d.discussions),
            "selected_alternative": selected_alt,
            "impact_score": impact_score,
            "created_at": d.created_at,
        })

    high_impact_list.sort(key=lambda x: x["impact_score"], reverse=True)

    # Key Contributors
    users_with_decisions = db.query(
        User.id,
        User.full_name,
        User.email,
        func.count(Decision.id).label("authored_count")
    ).join(Decision, Decision.created_by == User.id).group_by(
        User.id, User.full_name, User.email
    ).order_by(desc("authored_count")).limit(5).all()

    contributors_list = []
    for u_id, u_name, u_email, a_cnt in users_with_decisions:
        contributors_list.append({
            "id": u_id,
            "name": u_name,
            "email": u_email,
            "decisions_authored": a_cnt,
        })

    # Team Collaboration Overview
    teams = db.query(Team).options(joinedload(Team.members), joinedload(Team.decisions)).all()
    team_insights = []
    for t in teams:
        team_insights.append({
            "id": t.id,
            "name": t.name,
            "members_count": len(t.members),
            "decisions_count": len(t.decisions),
        })

    approval_rate = round((approved_count / total_decisions * 100), 1) if total_decisions > 0 else 0

    return {
        "metrics": {
            "total_decisions": total_decisions,
            "total_documents": total_documents,
            "total_categories": total_categories,
            "total_tags": total_tags,
            "total_teams": total_teams,
            "approved_rate": approval_rate,
            "in_review_count": in_review_count,
            "active_contributors": active_contributors_count,
        },
        "top_categories": category_insights,
        "high_impact_decisions": high_impact_list[:5],
        "key_contributors": contributors_list,
        "teams_overview": team_insights,
    }
