from datetime import datetime

from pydantic import BaseModel


class FileResponse(BaseModel):
    id: int
    decision_id: int
    file_name: str
    file_path: str
    file_type: str | None = None
    uploaded_at: datetime

    class Config:
        from_attributes = True