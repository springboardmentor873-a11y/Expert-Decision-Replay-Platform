from pydantic import BaseModel


class TeamCreate(BaseModel):
    name: str
    description: str | None = None


class TeamAssign(BaseModel):
    team_id: int