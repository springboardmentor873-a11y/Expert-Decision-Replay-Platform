from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, ConfigDict


class DashboardKPIs(BaseModel):
    total_decisions: int = 0
    pending_review: int = 0
    approved: int = 0
    rejected: int = 0
    draft: int = 0
    my_decisions: int = 0
    recent_activity_count: int = 0
    unread_notifications_count: int = 0

    model_config = ConfigDict(from_attributes=True)


class StatusDistributionItem(BaseModel):
    status: str
    count: int
    percentage: float
    color: str

    model_config = ConfigDict(from_attributes=True)


class DecisionTrendItem(BaseModel):
    date: str
    count: int

    model_config = ConfigDict(from_attributes=True)


class ApprovalSummary(BaseModel):
    total_reviews: int = 0
    approved_count: int = 0
    rejected_count: int = 0
    pending_approvals: int = 0
    approval_rate: float = 0.0
    rejection_rate: float = 0.0
    average_turnaround_hours: Optional[float] = None

    model_config = ConfigDict(from_attributes=True)


class RecentDecisionItem(BaseModel):
    id: int
    title: str
    status: str
    created_by: int
    creator_name: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class PendingReviewItem(BaseModel):
    id: int
    title: str
    status: str
    submitted_by_id: int
    submitted_by_name: str
    submitted_at: datetime

    model_config = ConfigDict(from_attributes=True)


class RecentActivityItem(BaseModel):
    id: int
    action: str
    entity_type: str
    entity_id: Optional[int] = None
    description: str
    user_id: Optional[int] = None
    user_name: Optional[str] = None
    created_at: datetime
    decision_title: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class RecentDiscussionItem(BaseModel):
    id: int
    decision_id: int
    decision_title: str
    user_id: int
    user_name: str
    content_snippet: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class RecentDocumentItem(BaseModel):
    id: int
    decision_id: int
    decision_title: str
    filename: str
    file_size: int
    content_type: str
    uploaded_by_id: int
    uploaded_by_name: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class DashboardNotificationItem(BaseModel):
    id: int
    title: str
    message: str
    type: str
    is_read: bool
    created_at: datetime
    link: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class DashboardSummaryResponse(BaseModel):
    kpis: DashboardKPIs
    status_distribution: List[StatusDistributionItem] = []
    decision_trend: List[DecisionTrendItem] = []
    approval_summary: ApprovalSummary
    recent_decisions: List[RecentDecisionItem] = []
    pending_items: List[PendingReviewItem] = []
    recent_activity: List[RecentActivityItem] = []
    recent_discussions: List[RecentDiscussionItem] = []
    recent_documents: List[RecentDocumentItem] = []
    notifications: List[DashboardNotificationItem] = []
    user_role: str

    model_config = ConfigDict(from_attributes=True)
