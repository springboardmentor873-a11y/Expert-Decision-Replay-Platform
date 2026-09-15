from pydantic import BaseModel


class AlternativeCreate(BaseModel):
    name: str
    description: str | None = None
    pros: str | None = None
    cons: str | None = None


class AlternativeResponse(BaseModel):
    id: int
    decision_id: int
    name: str
    description: str | None = None
    pros: str | None = None
    cons: str | None = None

    class Config:
        from_attributes = True


class AlternativeUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    pros: str | None = None
    cons: str | None = None
    