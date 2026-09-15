from pydantic import BaseModel


class TeamCreate(BaseModel):
    name: str


class TeamResponse(BaseModel):
    id: int
    name: str

    class Config:
        from_attributes = True