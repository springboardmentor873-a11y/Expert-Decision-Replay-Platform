from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field


class MeetingNoteCreateRequest(BaseModel):
    title: str = Field(..., min_length=2, max_length=255, description="Meeting title or subject")
    notes: str = Field(..., min_length=5, description="Detailed notes, minutes or discussion points")
    meeting_date: Optional[datetime] = Field(None, description="Date and time when the meeting occurred")


class MeetingNoteUpdateRequest(BaseModel):
    title: Optional[str] = Field(None, min_length=2, max_length=255)
    notes: Optional[str] = Field(None, min_length=5)
    meeting_date: Optional[datetime] = None


class MeetingNoteResponse(BaseModel):
    id: int
    decision_id: int
    title: str
    notes: str
    meeting_date: datetime
    created_by: Optional[int] = None
    author_name: Optional[str] = None
    author_email: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
