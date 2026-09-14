from datetime import date

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import require_role
from app.models.user import User, UserRole
from app.schemas.report import (
    ActivitySeries,
    ReportSummary,
    StatusBreakdown,
    UserReportList,
)
from app.services import report_service

router = APIRouter(prefix="/api/v1/reports", tags=["reports"])


@router.get("/summary", response_model=ReportSummary)
async def report_summary(
    start_date: date | None = Query(default=None, description="Inclusive range start."),
    end_date: date | None = Query(default=None, description="Inclusive range end."),
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_role(UserRole.MANAGER, UserRole.ADMINISTRATOR)),
):
    data = await report_service.build_summary(db, start_date, end_date)
    return ReportSummary(**data)


@router.get("/status-breakdown", response_model=StatusBreakdown)
async def status_breakdown(
    start_date: date | None = Query(default=None),
    end_date: date | None = Query(default=None),
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_role(UserRole.MANAGER, UserRole.ADMINISTRATOR)),
):
    data = await report_service.query_status_breakdown(db, start_date, end_date)
    return StatusBreakdown(**data)


@router.get("/activity", response_model=ActivitySeries)
async def activity(
    start_date: date | None = Query(default=None),
    end_date: date | None = Query(default=None),
    limit: int = Query(default=90, ge=1, le=366, description="Most recent N days."),
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_role(UserRole.MANAGER, UserRole.ADMINISTRATOR)),
):
    data = await report_service.query_activity(db, start_date, end_date, limit=limit)
    return ActivitySeries(**data)


@router.get("/users", response_model=UserReportList)
async def user_report(
    start_date: date | None = Query(default=None),
    end_date: date | None = Query(default=None),
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_role(UserRole.MANAGER, UserRole.ADMINISTRATOR)),
):
    rows, total = await report_service.query_user_stats(
        db, start_date, end_date, limit=limit, offset=offset
    )
    return UserReportList(
        start_date=start_date,
        end_date=end_date,
        total_users=total,
        users=rows,
    )