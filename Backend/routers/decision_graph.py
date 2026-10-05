from typing import Any, Dict, List

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from database.database import get_db
from models.audit_log import AuditLog
from models.decision import Decision
from models.user import User
from Schemas.decision_graph import DecisionGraphOut
from security.auth import get_current_user

router = APIRouter(prefix="/decision-graph", tags=["Decision Graph"])


@router.get("", response_model=DecisionGraphOut)
def get_decision_graph(
    decision_id: int = Query(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    decision = db.query(Decision).filter(Decision.id == decision_id).first()
    if not decision:
        raise HTTPException(status_code=404, detail="Decision not found")

    nodes: List[Dict[str, Any]] = []
    edges: List[Dict[str, str]] = []
    node_ids = set()

    def add_node(node_id: str, node_type: str, label: str, details: Dict[str, Any]):
        if node_id not in node_ids:
            nodes.append({
                "id": node_id,
                "type": node_type,
                "label": label,
                "decision_id": decision.id,
                "details": details,
            })
            node_ids.add(node_id)

    def add_edge(source: str, target: str, label: str):
        edges.append({
            "id": f"{source}-{label}-{target}",
            "source": source,
            "target": target,
            "label": label,
        })

    decision_node = f"decision:{decision.id}"
    add_node(
        decision_node,
        "decision",
        decision.title,
        {
            "status": decision.status.value,
            "category": decision.category.value,
            "version": decision.version,
            "created_at": decision.created_at.isoformat() if decision.created_at else None,
            "team_name": decision.team.name if decision.team else None,
        },
    )

    creator_node = f"user:{decision.creator.id}"
    add_node(
        creator_node,
        "user",
        decision.creator.full_name,
        {"role": decision.creator.role.name if decision.creator.role else None},
    )
    add_edge(decision_node, creator_node, "created by")

    if decision.team:
        team_node = f"team:{decision.team.id}"
        add_node(team_node, "team", decision.team.name, {"team_id": decision.team.id})
        add_edge(decision_node, team_node, "assigned to")

    for alternative in decision.alternatives:
        alternative_node = f"alternative:{alternative.id}"
        add_node(
            alternative_node,
            "alternative",
            alternative.title,
            {
                "pros": alternative.pros,
                "cons": alternative.cons,
                "estimated_cost": alternative.estimated_cost,
                "risk_score": alternative.risk_score,
                "feasibility_score": alternative.feasibility_score,
                "recommended": bool(alternative.is_recommended),
            },
        )
        add_edge(decision_node, alternative_node, "alternative")

    for attachment in decision.attachments:
        attachment_node = f"attachment:{attachment.id}"
        add_node(
            attachment_node,
            "attachment",
            attachment.filename,
            {
                "filename": attachment.filename,
                "content_type": attachment.content_type,
                "file_size": attachment.file_size,
                "created_at": attachment.created_at.isoformat() if attachment.created_at else None,
            },
        )
        add_edge(decision_node, attachment_node, "document")

    for comment in decision.comments:
        comment_node = f"comment:{comment.id}"
        add_node(
            comment_node,
            "comment",
            comment.content[:100] or "Discussion comment",
            {
                "content": comment.content,
                "created_at": comment.created_at.isoformat() if comment.created_at else None,
            },
        )
        add_edge(decision_node, comment_node, "discussion")
        if comment.user:
            author_node = f"user:{comment.user.id}"
            add_node(
                author_node,
                "user",
                comment.user.full_name,
                {"role": comment.user.role.name if comment.user.role else None},
            )
            add_edge(author_node, comment_node, "wrote")

    for version in decision.versions:
        version_node = f"version:{version.id}"
        add_node(
            version_node,
            "version",
            f"Version {version.version}",
            {
                "status": version.status,
                "category": version.category,
                "change_summary": version.change_summary,
                "created_at": version.created_at.isoformat() if version.created_at else None,
            },
        )
        add_edge(decision_node, version_node, "version history")

    role_name = current_user.role.name if current_user.role else None
    if role_name in ("manager", "administrator"):
        audit_entries = (
            db.query(AuditLog)
            .filter(AuditLog.decision_id == decision.id)
            .order_by(AuditLog.created_at.asc())
            .all()
        )
        for entry in audit_entries:
            audit_node = f"audit:{entry.id}"
            add_node(
                audit_node,
                "audit",
                entry.action.replace("_", " "),
                {
                    "action": entry.action,
                    "details": entry.details,
                    "created_at": entry.created_at.isoformat() if entry.created_at else None,
                },
            )
            add_edge(decision_node, audit_node, "audit activity")
            if entry.actor:
                actor_node = f"user:{entry.actor.id}"
                add_node(
                    actor_node,
                    "user",
                    entry.actor.full_name,
                    {"role": entry.actor.role.name if entry.actor.role else None},
                )
                add_edge(actor_node, audit_node, "performed by")

    return {"decision_id": decision.id, "nodes": nodes, "edges": edges}