"""
Knowledge Graph — reconstructs a decision's web of relationships
(who created it, who's discussed or reviewed it, which team it belongs
to, what topics/tags it carries, what documents support it, and its
current state) as a graph of nodes and edges, built entirely from real
rows in the database. Nothing here is fabricated or placeholder data.
"""
from typing import Dict, List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user
from app.db.database import get_db
from app.models.comment import Comment
from app.models.decision import Decision
from app.models.decision_rationale import DecisionRationale
from app.models.discussion_thread import DiscussionThread
from app.models.document import Document
from app.models.meeting_note import MeetingNote
from app.models.approval import Approval
from app.models.team import Team
from app.models.team_member import TeamMember
from app.models.thread_reply import ThreadReply
from app.models.user import User
from app.schemas.knowledge_graph import GraphEdge, GraphNode, KnowledgeGraphResponse
from app.services.authorization import assert_can_access_decision


router = APIRouter(prefix="/decisions", tags=["Knowledge Graph"])


def _get_decision_or_404(db: Session, decision_id: int) -> Decision:
    decision = db.query(Decision).filter(Decision.id == decision_id).first()
    if not decision:
        raise HTTPException(status_code=404, detail="Decision not found")
    return decision


@router.get(
    "/{decision_id}/knowledge-graph",
    response_model=KnowledgeGraphResponse,
)
def get_knowledge_graph(
    decision_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    decision = _get_decision_or_404(db, decision_id)
    assert_can_access_decision(current_user, decision, db)

    nodes: List[GraphNode] = []
    edges: List[GraphEdge] = []

    decision_node_id = f"decision-{decision.id}"
    nodes.append(
        GraphNode(
            id=decision_node_id,
            type="decision",
            label=decision.title,
            subtitle=decision.category,
        )
    )

    # ---- State (current status) --------------------------------------
    state_node_id = f"state-{decision.id}"
    nodes.append(
        GraphNode(id=state_node_id, type="state", label=decision.status, subtitle="Current state")
    )
    edges.append(GraphEdge(source=decision_node_id, target=state_node_id, relation="is in state"))

    # ---- Team (the creator's department team, if one exists) ---------
    creator = db.query(User).filter(User.id == decision.created_by).first()
    if creator:
        team = (
            db.query(Team)
            .join(TeamMember, TeamMember.team_id == Team.id)
            .filter(TeamMember.user_id == creator.id)
            .first()
        )
        if not team:
            team = db.query(Team).filter(Team.department == creator.department).first()
        if team:
            team_node_id = f"team-{team.id}"
            nodes.append(
                GraphNode(id=team_node_id, type="team", label=team.name, subtitle=team.department)
            )
            edges.append(
                GraphEdge(source=decision_node_id, target=team_node_id, relation="owned by")
            )

    # ---- People (every distinct human touchpoint on this decision) ---
    # Maps user_id -> the most descriptive role we've found for them.
    people_roles: Dict[int, str] = {}

    def note_person(user_id: int, role: str, priority: int, roles_seen: Dict[int, tuple]):
        # Keep the highest-priority role seen per person so a reviewer who
        # also commented still shows as "Reviewer", not "Commented".
        existing = roles_seen.get(user_id)
        if not existing or priority > existing[1]:
            roles_seen[user_id] = (role, priority)

    role_priority: Dict[int, tuple] = {}

    if creator:
        note_person(creator.id, "Created by", 100, role_priority)

    for approval in db.query(Approval).filter(Approval.decision_id == decision.id).all():
        label = {
            "Approved": "Approved",
            "Rejected": "Rejected",
            "Escalated": "Escalated review",
        }.get(approval.status, "Reviewing")
        note_person(approval.reviewer_id, label, 90, role_priority)

    for comment in db.query(Comment).filter(Comment.decision_id == decision.id).all():
        note_person(comment.user_id, "Commented", 40, role_priority)

    for thread in db.query(DiscussionThread).filter(DiscussionThread.decision_id == decision.id).all():
        note_person(thread.user_id, "Started discussion", 50, role_priority)
        for reply in db.query(ThreadReply).filter(ThreadReply.thread_id == thread.id).all():
            note_person(reply.user_id, "Discussed", 30, role_priority)

    for note in db.query(MeetingNote).filter(MeetingNote.decision_id == decision.id).all():
        note_person(note.user_id, "Took meeting notes", 45, role_priority)

    rationale = (
        db.query(DecisionRationale).filter(DecisionRationale.decision_id == decision.id).first()
    )
    if rationale:
        note_person(rationale.user_id, "Documented rationale", 60, role_priority)

    for doc in db.query(Document).filter(Document.decision_id == decision.id).all():
        note_person(doc.uploaded_by, "Uploaded a document", 55, role_priority)

    users_by_id = {
        u.id: u
        for u in db.query(User).filter(User.id.in_(list(role_priority.keys()))).all()
    }

    for user_id, (role_label, _priority) in role_priority.items():
        person = users_by_id.get(user_id)
        if not person:
            continue
        person_node_id = f"person-{person.id}"
        nodes.append(
            GraphNode(
                id=person_node_id,
                type="person",
                label=person.full_name,
                subtitle=person.designation,
            )
        )
        edges.append(
            GraphEdge(source=decision_node_id, target=person_node_id, relation=role_label.lower())
        )

    # ---- Documents ------------------------------------------------------
    for doc in db.query(Document).filter(Document.decision_id == decision.id).all():
        doc_node_id = f"document-{doc.id}"
        nodes.append(
            GraphNode(id=doc_node_id, type="document", label=doc.filename, subtitle="Attachment")
        )
        edges.append(
            GraphEdge(source=decision_node_id, target=doc_node_id, relation="supported by")
        )

    # ---- Topics (tags) ----------------------------------------------
    if decision.tags:
        for raw_tag in decision.tags.split(","):
            tag = raw_tag.strip()
            if not tag:
                continue
            topic_node_id = f"topic-{tag.lower()}"
            if not any(n.id == topic_node_id for n in nodes):
                nodes.append(
                    GraphNode(id=topic_node_id, type="topic", label=tag, subtitle="Topic tag")
                )
            edges.append(
                GraphEdge(source=decision_node_id, target=topic_node_id, relation="tagged")
            )

    return KnowledgeGraphResponse(
        focal_decision_id=decision.id,
        nodes=nodes,
        edges=edges,
    )
