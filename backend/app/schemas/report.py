from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, ConfigDict, Field


# -------------------------------------------------------------
# 1. Decision Summary Report Schemas
# -------------------------------------------------------------
class DecisionSummaryReport(BaseModel):
    total_decisions: int
    draft: int
    submitted: int
    under_review: int
    approved: int
    rejected: int
    status_percentages: Dict[str, float]
    status_distribution: List[Dict[str, Any]]
    decisions_over_time: List[Dict[str, Any]] = []

    model_config = ConfigDict(from_attributes=True)


# -------------------------------------------------------------
# 2. Approval Report Schemas
# -------------------------------------------------------------
class ApprovalReportItem(BaseModel):
    id: int
    decision_id: int
    decision_title: str
    reviewer_id: int
    reviewer_name: str
    reviewer_email: str
    action: str
    previous_status: str
    new_status: str
    rejection_reason: Optional[str] = None
    comment: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ApprovalReport(BaseModel):
    total_reviews: int
    approved_count: int
    rejected_count: int
    pending_approvals: int
    approval_rate: float
    rejection_rate: float
    reviews_by_action: List[Dict[str, Any]] = []
    items: List[ApprovalReportItem] = []
    total: int = 0
    page: int = 1
    page_size: int = 20
    pages: int = 1

    model_config = ConfigDict(from_attributes=True)


# -------------------------------------------------------------
# 3. Decision Outcome Report Schemas
# -------------------------------------------------------------
class OutcomeReportItem(BaseModel):
    decision_id: int
    decision_title: str
    status: str
    creator_id: int
    creator_name: str
    expected_outcome: Optional[str] = None
    actual_outcome: Optional[str] = None
    outcome_recorded: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class OutcomeReport(BaseModel):
    total_decisions: int
    recorded_count: int
    not_recorded_count: int
    recorded_percentage: float
    items: List[OutcomeReportItem] = []
    total: int = 0
    page: int = 1
    page_size: int = 20
    pages: int = 1

    model_config = ConfigDict(from_attributes=True)


# -------------------------------------------------------------
# 4. Alternative Report Schemas
# -------------------------------------------------------------
class AlternativeReportItem(BaseModel):
    alternative_id: int
    decision_id: int
    decision_title: str
    decision_status: str
    name: str
    description: str
    pros: str
    cons: str
    cost: Optional[str] = None
    feasibility: Optional[str] = None
    risk_assessment: Optional[str] = None
    is_selected: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class AlternativeReport(BaseModel):
    total_alternatives: int
    total_decisions_analyzed: int
    selected_alternatives_count: int
    avg_alternatives_per_decision: float
    feasibility_distribution: Dict[str, int] = {}
    items: List[AlternativeReportItem] = []
    total: int = 0
    page: int = 1
    page_size: int = 20
    pages: int = 1

    model_config = ConfigDict(from_attributes=True)


# -------------------------------------------------------------
# 5. Activity Report Schemas
# -------------------------------------------------------------
class ActivityReportItem(BaseModel):
    id: int
    timestamp: datetime
    user_id: int
    user_name: str
    user_email: str
    action: str
    entity_type: str
    entity_id: int
    decision_id: Optional[int] = None
    decision_title: Optional[str] = None
    description: str

    model_config = ConfigDict(from_attributes=True)


class ActivityReport(BaseModel):
    total_activities: int
    action_counts: Dict[str, int] = {}
    items: List[ActivityReportItem] = []
    total: int = 0
    page: int = 1
    page_size: int = 20
    pages: int = 1

    model_config = ConfigDict(from_attributes=True)


# -------------------------------------------------------------
# 6. Decision Timeline Report Schemas
# -------------------------------------------------------------
class TimelineEventItem(BaseModel):
    event_id: str
    timestamp: datetime
    stage: str
    action: str
    title: str
    description: str
    actor_id: Optional[int] = None
    actor_name: Optional[str] = None
    actor_email: Optional[str] = None
    metadata: Dict[str, Any] = {}

    model_config = ConfigDict(from_attributes=True)


class DecisionTimelineReport(BaseModel):
    decision_id: int
    title: str
    status: str
    created_at: datetime
    updated_at: datetime
    creator_id: int
    creator_name: str
    events: List[TimelineEventItem] = []

    model_config = ConfigDict(from_attributes=True)
