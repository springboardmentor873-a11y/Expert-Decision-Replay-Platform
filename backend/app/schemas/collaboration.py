from datetime import datetime
from uuid import UUID
from pydantic import BaseModel, ConfigDict, Field


class CommentCreate(BaseModel):
    body: str = Field(min_length=1)
    parent_id: UUID | None = None


class CommentOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    discussion_id: UUID
    parent_id: UUID | None = None
    author_id: UUID
    author_name: str | None = None
    author_email: str | None = None
    body: str
    replies: list["CommentOut"] = []
    created_at: datetime
    updated_at: datetime


class DiscussionCreate(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    initial_comment: str | None = None


class DiscussionOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    decision_id: UUID
    title: str
    created_by_id: UUID
    created_by_name: str | None = None
    comments: list[CommentOut] = []
    created_at: datetime
    updated_at: datetime


class MeetingNoteCreate(BaseModel):
    title: str = Field(min_length=1, max_length=300)
    body: str = Field(min_length=1)
    occurred_at: datetime


class MeetingNoteUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=300)
    body: str | None = Field(default=None, min_length=1)
    occurred_at: datetime | None = None


class MeetingNoteOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    decision_id: UUID
    title: str
    body: str
    occurred_at: datetime
    recorded_by_id: UUID
    recorded_by_name: str | None = None
    created_at: datetime
    updated_at: datetime


class NotificationOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: UUID
    decision_id: UUID | None = None
    type: str
    title: str
    body: str | None = None
    payload: dict | None = None
    read_at: datetime | None = None
    created_at: datetime


class NotificationCountOut(BaseModel):
    unread_count: int
