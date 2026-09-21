from fastapi import APIRouter
from fastapi import Depends
from fastapi import HTTPException
from fastapi import Query

from sqlalchemy.orm import Session
from sqlalchemy import or_, func

from typing import Optional

from datetime import datetime

from pydantic import BaseModel

from app.database import get_db
from app.models import KnowledgeArticle
from app.models import Category
from app.models import Decision
from app.models import User
from app.auth import get_current_user


# ==========================================
# ROUTER
# ==========================================

router = APIRouter(
    prefix="/knowledge",
    tags=["Knowledge Repository"]
)


# ==========================================
# SCHEMAS
# ==========================================

class KnowledgeCreate(BaseModel):
    title: str
    content: str
    category: str = "General"


class KnowledgeUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    category: Optional[str] = None


# ==========================================
# HELPER: ARTICLE DICT
# ==========================================

def article_dict(article: KnowledgeArticle):

    return {
        "article_id": article.article_id,
        "title": article.title,
        "content": article.content,
        "category": article.category,
        "author_id": article.author_id,
        "author_name": (
            article.author.name
            if article.author
            else None
        ),
        "created_at": article.created_at,
        "updated_at": article.updated_at
    }


def get_article_or_404(db: Session, article_id: int):

    article = (
        db.query(KnowledgeArticle)
        .filter(
            KnowledgeArticle.article_id == article_id
        )
        .first()
    )

    if not article:

        raise HTTPException(
            status_code=404,
            detail="Knowledge article not found"
        )

    return article


# ==========================================
# LIST ARTICLES
# ==========================================

@router.get("/")
def list_articles(
    search: Optional[str] = None,
    category: Optional[str] = None,
    limit: Optional[int] = 100,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):

    query = db.query(KnowledgeArticle)

    if search:

        term = f"%{search.strip()}%"

        query = query.filter(
            or_(
                KnowledgeArticle.title.ilike(term),
                KnowledgeArticle.content.ilike(term),
                KnowledgeArticle.category.ilike(term)
            )
        )

    if category:

        query = query.filter(
            KnowledgeArticle.category == category
        )

    articles = (
        query.order_by(
            KnowledgeArticle.updated_at.desc()
        )
        .limit(limit)
        .all()
    )

    return [
        article_dict(a)
        for a in articles
    ]


# ==========================================
# LIST CATEGORIES / TOPICS
# ==========================================

@router.get("/categories")
def list_categories(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):

    article_categories = (
        db.query(KnowledgeArticle.category)
        .distinct()
        .all()
    )

    article_category_names = [
        row[0]
        for row in article_categories
        if row[0]
    ]

    topic_rows = (
        db.query(
            Category.category_name,
            func.count(Decision.decision_id)
        )
        .outerjoin(Decision, Decision.category_id == Category.category_id)
        .group_by(Category.category_name)
        .order_by(Category.category_name.asc())
        .all()
    )

    topics = [
        {
            "name": name,
            "source": "topic",
            "decision_count": count
        }
        for name, count in topic_rows
    ]

    article_counts = {}

    for name in article_category_names:
        article_counts[name] = (
            db.query(func.count(KnowledgeArticle.article_id))
            .filter(KnowledgeArticle.category == name)
            .scalar()
        ) or 0

    article_categories_out = [
        {
            "name": name,
            "source": "knowledge",
            "article_count": article_counts[name]
        }
        for name in sorted(article_category_names)
    ]

    return {
        "topics": topics,
        "knowledge_categories": article_categories_out
    }


# ==========================================
# GET SINGLE ARTICLE
# ==========================================

@router.get("/{article_id}")
def get_article(
    article_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):

    return article_dict(get_article_or_404(db, article_id))


# ==========================================
# CREATE ARTICLE
# ==========================================

@router.post("/")
def create_article(
    data: KnowledgeCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):

    title = (data.title or "").strip()
    content = (data.content or "").strip()

    if not title:
        raise HTTPException(
            status_code=422,
            detail="Article title is required"
        )

    if not content:
        raise HTTPException(
            status_code=422,
            detail="Article content is required"
        )

    category = (data.category or "General").strip()

    now = datetime.utcnow()

    article = KnowledgeArticle(
        title=title,
        content=content,
        category=category or "General",
        author_id=current_user.user_id,
        created_at=now,
        updated_at=now
    )

    db.add(article)
    db.commit()
    db.refresh(article)

    return article_dict(article)


# ==========================================
# UPDATE ARTICLE
# ==========================================

@router.put("/{article_id}")
def update_article(
    article_id: int,
    data: KnowledgeUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):

    article = get_article_or_404(db, article_id)

    if (
        article.author_id is not None
        and article.author_id != current_user.user_id
        and current_user.role_id not in (3, 4)
    ):

        raise HTTPException(
            status_code=403,
            detail=(
                "You do not have permission to modify "
                "this knowledge article"
            )
        )

    if data.title is not None:
        if not data.title.strip():
            raise HTTPException(
                status_code=422,
                detail="Article title cannot be empty"
            )
        article.title = data.title.strip()

    if data.content is not None:
        if not data.content.strip():
            raise HTTPException(
                status_code=422,
                detail="Article content cannot be empty"
            )
        article.content = data.content.strip()

    if data.category is not None:
        article.category = (
            (data.category.strip() or "General")
            if data.category.strip()
            else "General"
        )

    article.updated_at = datetime.utcnow()

    db.commit()
    db.refresh(article)

    return article_dict(article)


# ==========================================
# DELETE ARTICLE
# ==========================================

@router.delete("/{article_id}")
def delete_article(
    article_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):

    article = get_article_or_404(db, article_id)

    if (
        article.author_id is not None
        and article.author_id != current_user.user_id
        and current_user.role_id not in (3, 4)
    ):

        raise HTTPException(
            status_code=403,
            detail=(
                "You do not have permission to delete "
                "this knowledge article"
            )
        )

    db.delete(article)
    db.commit()

    return {
        "message": "Knowledge article deleted"
    }


# ==========================================
# IDEMPOTENT SEED (only when table is empty)
# ==========================================

def seed_knowledge_articles(db: Session):
    """Create starter knowledge articles derived from real past
    decisions so the repository is never empty. Runs only when the
    knowledge_articles table has no rows (idempotent)."""

    existing = (
        db.query(func.count(KnowledgeArticle.article_id)).scalar() or 0
    )

    if existing > 0:
        return

    draft_rows = []

    for d in (
        db.query(Decision)
        .filter(Decision.status.in_(["Approved", "Archived", "Rejected"]))
        .order_by(Decision.decision_id.asc())
        .limit(5)
        .all()
    ):
        content = ""

        if d.final_outcome:
            content += (
                "Outcome: " + d.final_outcome.strip() + "\n\n"
            )

        if d.rationale:
            content += (
                "Rationale: " + d.rationale.strip() + "\n\n"
            )

        if d.description:
            content += (
                "Description: " + d.description.strip()
            )

        if not content.strip():
            content = "Reference to a past decision knowledge record."

        draft_rows.append({
            "title": d.title,
            "content": content.strip(),
            "category": (
                d.category.category_name
                if d.category
                else "Past Decisions"
            )
        })

    insert_now = datetime.utcnow()

    for row in draft_rows[:4]:
        db.add(KnowledgeArticle(
            title=row["title"],
            content=row["content"],
            category=row["category"],
            author_id=None,
            created_at=insert_now,
            updated_at=insert_now
        ))

    db.commit()