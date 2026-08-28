from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db
from app.models.identity import User
from app.schemas.reports_analytics import DashboardStatsOut
from app.services.analytics_service import get_dashboard_stats

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/stats", response_model=DashboardStatsOut)
def get_user_dashboard(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> DashboardStatsOut:
    """Retrieve role-specific dashboard metrics, pending actions, and activity feeds."""
    stats = get_dashboard_stats(db, current_user)
    return DashboardStatsOut(
        role=stats["role"],
        metrics=stats["metrics"],
        recent_items=stats.get("recent_items", []),
        activity_feed=stats.get("activity_feed", []),
    )
