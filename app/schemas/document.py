from datetime import datetime

from pydantic import BaseModel


class DocumentResponse(BaseModel):
    id: int
    decision_id: int
    uploaded_by: int
    filename: str
    file_size: int
    content_type: str
    created_at: datetime

    class Config:
        from_attributes = True
