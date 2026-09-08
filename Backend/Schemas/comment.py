from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class CommentCreate(BaseModel):
    content: str
    parent_id: Optional[int] = None
    attachment_url: Optional[str] = None


class MeetingNoteCreate(BaseModel):
    content: str
    meeting_date: Optional[datetime] = None
    meeting_attendees: Optional[str] = None
    attachment_url: Optional[str] = None


class CommentOut(BaseModel):
    id: int
    decision_id: int
    user_id: int
    user_name: Optional[str] = None
    parent_id: Optional[int] = None
    content: str
    is_meeting_note: bool
    meeting_date: Optional[datetime] = None
    meeting_attendees: Optional[str] = None
    attachment_url: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    replies: Optional[List["CommentOut"]] = []

    class Config:
        from_attributes = True
