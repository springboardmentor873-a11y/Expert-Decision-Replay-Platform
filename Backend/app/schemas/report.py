import uuid
from datetime import date

from pydantic import BaseModel, ConfigDict

from app.models.decision import DecisionStatus
from app.models.user import UserRole


class StatusCount(BaseModel):
    status: DecisionStatus
    count: int

    model_config = ConfigDict(use_enum_values=True)


class ActionCounts(BaseModel):
    approvals: int = 0
    rejections: int = 0


class TeamStat(BaseModel):
    team_id: uuid.UUID
    team_name: str
    users: int
    decisions: int

    model_config = ConfigDict(from_attributes=True)


class RoleCount(BaseModel):
    role: UserRole
    count: int

    model_config = ConfigDict(use_enum_values=True)


class TeamUserStats(BaseModel):
    total_users: int
    active_users: int
    by_role: list[RoleCount]


class TeamStats(BaseModel):
    total_teams: int
    by_team: list[TeamStat]


class ReportSummary(BaseModel):
    start_date: date | None
    end_date: date | None

    total_decisions: int
    total_approvals: int
    total_rejections: int
    pending_review: int

    by_status: list[StatusCount]
    by_reviewer: ActionCounts
    by_manager: ActionCounts

    users: TeamUserStats
    teams: TeamStats


class StatusBreakdown(BaseModel):
    start_date: date | None
    end_date: date | None
    total: int
    by_status: list[StatusCount]


class ActivityPoint(BaseModel):
    date: date
    decisions_created: int
    approvals_actioned: int


class ActivitySeries(BaseModel):
    start_date: date | None
    end_date: date | None
    total_decisions_created: int
    total_approvals_actioned: int
    points: list[ActivityPoint]


class UserStat(BaseModel):
    user_id: uuid.UUID
    full_name: str
    role: UserRole
    decisions_created: int
    approvals: int
    rejections: int

    model_config = ConfigDict(use_enum_values=True)


class UserReportList(BaseModel):
    start_date: date | None
    end_date: date | None
    total_users: int
    users: list[UserStat]