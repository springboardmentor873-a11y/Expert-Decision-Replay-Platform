# Add this block to the bottom of your existing schemas.py

from datetime import datetime


# ---------- Document ----------

class DocumentOut(BaseModel):
    id: int
    filename: str
    filepath: str
    decision_id: int
    uploaded_by: Optional[int] = None
    uploaded_at: datetime

    class Config:
        from_attributes = True


# ---------- Comment (Discussion Module) ----------

class CommentCreate(BaseModel):
    content: str
    is_meeting_note: Optional[int] = 0
    user_id: Optional[int] = None


class CommentOut(BaseModel):
    id: int
    content: str
    is_meeting_note: int
    decision_id: int
    user_id: Optional[int] = None
    created_at: datetime

    class Config:
        from_attributes = True