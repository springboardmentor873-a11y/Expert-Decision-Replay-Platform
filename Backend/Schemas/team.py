from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict


class TeamCreate(BaseModel):
    name: str
    manager_id: Optional[int] = None


class TeamOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    manager_id: Optional[int] = None
    created_at: datetime


class AssignTeam(BaseModel):
    team_id: int
