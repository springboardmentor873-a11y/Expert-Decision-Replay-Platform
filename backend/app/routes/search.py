from fastapi import APIRouter
from fastapi import Depends

from sqlalchemy.orm import Session
from sqlalchemy import or_

from typing import Optional

from app.database import get_db
from app.models import Decision
from app.models import DecisionDocument
from app.models import DecisionComment
from app.models import User
from app.models import Team
from app.models import Category
from app.models import KnowledgeArticle
from app.auth import get_current_user
from app.routes.decisions import decision_dict


# ==========================================
# ROUTER
# ==========================================

router = APIRouter(
    prefix="/search",
    tags=["Search"]
)


# ==========================================
# SEARCH
# ==========================================

@router.get("/")
def global_search(
    q: Optional[str] = "",
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):

    query = (q or "").strip()

    if not query:
        return {
            "query": "",
            "decisions": [],
            "documents": [],
            "teams": [],
            "discussions": [],
            "people": [],
            "knowledge": [],
            "categories": []
        }

    term = f"%{query}%"

    # ------------------------------------------------
    # DECISIONS
    # ------------------------------------------------

    decisions = [
        decision_dict(d)
        for d in (
            db.query(Decision)
            .outerjoin(User, User.user_id == Decision.expert_id)
            .outerjoin(Team, Team.team_id == User.team_id)
            .filter(
                or_(
                    Decision.title.ilike(term),
                    Decision.description.ilike(term),
                    Decision.problem_statement.ilike(term),
                    Decision.rationale.ilike(term),
                    Decision.final_outcome.ilike(term)
                )
            )
            .order_by(Decision.updated_at.desc())
            .limit(10)
            .all()
        )
    ]

    # ------------------------------------------------
    # DOCUMENTS (search across all decision documents)
    # ------------------------------------------------

    documents = []

    doc_rows = (
        db.query(
            DecisionDocument.document_id,
            DecisionDocument.file_name,
            DecisionDocument.original_file_name,
            DecisionDocument.file_type,
            DecisionDocument.file_size,
            DecisionDocument.uploaded_at,
            DecisionDocument.decision_id,
            Decision.title.label("decision_title"),
            User.name.label("uploader_name")
        )
        .join(Decision, Decision.decision_id == DecisionDocument.decision_id)
        .outerjoin(User, User.user_id == DecisionDocument.uploaded_by)
        .filter(
            or_(
                DecisionDocument.file_name.ilike(term),
                DecisionDocument.original_file_name.ilike(term)
            )
        )
        .order_by(DecisionDocument.uploaded_at.desc())
        .limit(10)
        .all()
    )

    for r in doc_rows:
        documents.append({
            "document_id": r.document_id,
            "file_name": r.file_name,
            "original_file_name": r.original_file_name,
            "file_type": r.file_type,
            "file_size": (
                float(r.file_size)
                if r.file_size is not None
                else None
            ),
            "uploaded_at": r.uploaded_at,
            "decision_id": r.decision_id,
            "decision_title": r.decision_title,
            "uploader_name": r.uploader_name
        })

    # ------------------------------------------------
    # TEAMS
    # ------------------------------------------------

    teams = [
        {
            "team_id": t.team_id,
            "team_name": t.team_name,
            "description": t.description,
            "member_count": len(t.users),
            "is_archived": bool(t.is_archived)
        }
        for t in (
            db.query(Team)
            .filter(
                or_(
                    Team.team_name.ilike(term),
                    Team.description.ilike(term)
                )
            )
            .order_by(Team.team_name.asc())
            .limit(10)
            .all()
        )
    ]

    # ------------------------------------------------
    # DISCUSSIONS (decisions whose title or comments match)
    # ------------------------------------------------

    title_match_ids = [
        d.decision_id
        for d in (
            db.query(Decision.decision_id)
            .filter(Decision.title.ilike(term))
            .limit(20)
            .all()
        )
    ]

    comment_match_ids = [
        c.decision_id
        for c in (
            db.query(DecisionComment.decision_id)
            .filter(DecisionComment.content.ilike(term))
            .distinct()
            .limit(20)
            .all()
        )
    ]

    discussion_decision_ids = list(
        dict.fromkeys(title_match_ids + comment_match_ids)
    )[:20]

    discussions = []

    if discussion_decision_ids:

        discussion_map = {}

        comment_counts = (
            db.query(
                DecisionComment.decision_id,
                DecisionComment.user_id
            )
            .filter(DecisionComment.decision_id.in_(discussion_decision_ids))
            .distinct()
            .all()
        )

        for decision_id, user_id in comment_counts:
            entry = discussion_map.setdefault(
                decision_id,
                {"participants": set(), "comments": 0}
            )
            entry["participants"].add(user_id)

        for d in (
            db.query(Decision)
            .filter(Decision.decision_id.in_(discussion_decision_ids))
            .all()
        ):
            meta = discussion_map.get(d.decision_id)

            discussions.append({
                "decision_id": d.decision_id,
                "title": d.title,
                "status": d.status,
                "expert_name": (
                    d.expert.name
                    if d.expert
                    else None
                ),
                "team_name": (
                    d.expert.team.team_name
                    if d.expert and d.expert.team
                    else None
                ),
                "comment_count": (
                    len(meta["participants"]) if meta else 0
                ),
                "participant_count": (
                    len(meta["participants"]) if meta else 0
                )
            })

    # ------------------------------------------------
    # PEOPLE
    # ------------------------------------------------

    people = [
        {
            "user_id": u.user_id,
            "name": u.name,
            "email": u.email,
            "role_id": u.role_id,
            "role_name": (
                u.role.role_name
                if u.role
                else None
            ),
            "team_id": u.team_id,
            "team_name": (
                u.team.team_name
                if u.team
                else None
            )
        }
        for u in (
            db.query(User)
            .outerjoin(Team, Team.team_id == User.team_id)
            .filter(
                or_(
                    User.name.ilike(term),
                    User.email.ilike(term)
                )
            )
            .order_by(User.name.asc())
            .limit(10)
            .all()
        )
    ]

    # ------------------------------------------------
    # KNOWLEDGE ARTICLES
    # ------------------------------------------------

    knowledge_rows = (
        db.query(KnowledgeArticle)
        .filter(
            or_(
                KnowledgeArticle.title.ilike(term),
                KnowledgeArticle.content.ilike(term),
                KnowledgeArticle.category.ilike(term)
            )
        )
        .order_by(KnowledgeArticle.updated_at.desc())
        .limit(10)
        .all()
    )

    knowledge = [
        {
            "article_id": a.article_id,
            "title": a.title,
            "content": a.content,
            "category": a.category,
            "author_id": a.author_id,
            "author_name": (
                a.author.name
                if a.author
                else None
            ),
            "created_at": a.created_at,
            "updated_at": a.updated_at
        }
        for a in knowledge_rows
    ]

    # ------------------------------------------------
    # CATEGORIES / TOPICS
    # ------------------------------------------------

    categories = [
        {
            "category_id": c.category_id,
            "category_name": c.category_name,
            "decision_count": len(c.decisions)
        }
        for c in (
            db.query(Category)
            .filter(Category.category_name.ilike(term))
            .order_by(Category.category_name.asc())
            .limit(10)
            .all()
        )
    ]

    return {
        "query": query,
        "decisions": decisions,
        "documents": documents,
        "teams": teams,
        "discussions": discussions,
        "people": people,
        "knowledge": knowledge,
        "categories": categories
    }