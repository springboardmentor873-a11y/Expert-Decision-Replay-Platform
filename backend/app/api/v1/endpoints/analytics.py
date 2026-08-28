from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db
from app.models.identity import User
from app.schemas.reports_analytics import AnalyticsOverviewOut
from app.services.analytics_service import get_analytics_overview

router = APIRouter(prefix="/analytics", tags=["analytics"])


@router.get("/overview", response_model=AnalyticsOverviewOut)
def get_analytics(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> AnalyticsOverviewOut:
    """Retrieve full organizational analytics, trends, and distribution breakdowns."""
    overview = get_analytics_overview(db)
    return AnalyticsOverviewOut(
        decisions_by_status=overview["decisions_by_status"],
        decisions_by_category=overview["decisions_by_category"],
        decisions_over_time=overview["decisions_over_time"],
        approval_metrics=overview["approval_metrics"],
        user_activity=overview["user_activity"],
    )
