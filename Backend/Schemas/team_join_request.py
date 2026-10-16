from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict
from models.team_join_request import JoinRequestStatus


class TeamJoinRequestCreate(BaseModel):
    pass


class TeamJoinRequestOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    user_name: Optional[str] = None
    user_email: Optional[str] = None
    team_id: int
    team_name: Optional[str] = None
    team_manager_id: Optional[int] = None
    team_manager_name: Optional[str] = None
    status: JoinRequestStatus
    created_at: datetime

