from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user
from app.database.database import get_db
from app.models.user import User
from app.services.decision_service import get_decisions
from app.services.team_service import get_teams

router = APIRouter()


@router.get(
    "",
    summary="Global cross-entity search",
    tags=["Search"],
)
def global_search(
    q: str = Query(..., min_length=1, description="Search query (min 1 character)"),
    limit: int = Query(default=20, ge=1, le=100, description="Max results per entity type"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Dict[str, Any]:
    """
    Search across decisions, teams, and categories simultaneously.

    Returns results grouped by entity type so the frontend can display
    them in separate sections (decisions, teams).

    - `decisions` — filtered by title/description matching the query
    - `teams`     — filtered by name matching the query
    - `total`     — aggregate result count across all entity types
    """
    # --- Decisions ---
    matching_decisions = get_decisions(
        db=db,
        current_user=current_user,
        search=q,
        limit=limit,
    )
    decision_results = [
        {
            "id": d.id,
            "type": "decision",
            "title": d.title,
            "status": d.status,
            "created_at": d.created_at,
        }
        for d in matching_decisions
    ]

    # --- Teams ---
    all_teams = get_teams(db=db, current_user=current_user)
    q_lower = q.lower()
    matching_teams = [
        t for t in all_teams
        if q_lower in (t.name or "").lower() or q_lower in (t.description or "").lower()
    ][:limit]
    team_results = [
        {
            "id": t.id,
            "type": "team",
            "title": t.name,
            "description": t.description,
        }
        for t in matching_teams
    ]

    total = len(decision_results) + len(team_results)

    return {
        "query": q,
        "total": total,
        "decisions": decision_results,
        "teams": team_results,
    }
