from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user
from app.database.database import get_db
from app.models.user import User
from app.schemas.dashboard import DashboardSummaryResponse
from app.services import dashboard_service

router = APIRouter()


@router.get("/summary", response_model=DashboardSummaryResponse)
def get_dashboard_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Retrieve consolidated, role-aware dashboard summary data for the authenticated user.
    Aggregates decisions, approval workload, status distributions, trends,
    recent items, discussions, documents, audit activity, and notifications.
    """
    return dashboard_service.get_dashboard_summary(db=db, current_user=current_user)
