from datetime import datetime
from uuid import UUID
from pydantic import BaseModel


class DashboardStatsOut(BaseModel):
    role: str
    metrics: dict
    recent_items: list[dict] = []
    activity_feed: list[dict] = []


class AnalyticsOverviewOut(BaseModel):
    decisions_by_status: dict[str, int]
    decisions_by_category: list[dict]
    decisions_over_time: list[dict]
    approval_metrics: dict
    user_activity: dict


class ReportRequest(BaseModel):
    report_type: str
    category_id: UUID | None = None
    team_id: UUID | None = None
    status: str | None = None
    start_date: datetime | None = None
    end_date: datetime | None = None
    format: str = "pdf"
