from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.models.user import User
from app.core.dependencies import get_current_user
from app.services.knowledge_repository_service import (
    get_knowledge_repository,
    get_knowledge_graph_data,
    get_related_insights,
)

router = APIRouter(tags=["Knowledge Repository"])


@router.get("")
def read_knowledge_repository(
    search: Optional[str] = Query(None, description="Multi-field text search query"),
    team_id: Optional[int] = Query(None, description="Filter by team ID"),
    category_id: Optional[int] = Query(None, description="Filter by category ID"),
    tag_id: Optional[int] = Query(None, description="Filter by tag ID"),
    file_type: Optional[str] = Query(None, description="Filter by file type / format"),
    status: Optional[str] = Query(None, description="Filter by decision status (e.g. Approved, Archived)"),
    sort_by: Optional[str] = Query(None, description="Sort order (newest, oldest, recently_updated, most_relevant)"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Search and browse organizational knowledge repository across decisions,
    timeline events, and document archives.
    """
    return get_knowledge_repository(
        db=db,
        current_user=current_user,
        search=search,
        team_id=team_id,
        category_id=category_id,
        tag_id=tag_id,
        file_type=file_type,
        status_filter=status,
        sort_by=sort_by,
        skip=skip,
        limit=limit,
    )


@router.get("/graph")
def read_knowledge_graph(
    decision_id: Optional[int] = Query(None, description="Focal decision ID to center the graph around"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Returns an interconnected knowledge graph of Decisions, Teams, Categories,
    Alternatives, Documents, Tags, and Status directly sourced from database relations.
    """
    return get_knowledge_graph_data(db=db, current_user=current_user, decision_id=decision_id)


@router.get("/insights")
def read_related_insights(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Returns dynamic analytical and relational insights derived from database records,
    including portfolio composition, key contributors, and high-impact decisions.
    """
    return get_related_insights(db=db, current_user=current_user)
