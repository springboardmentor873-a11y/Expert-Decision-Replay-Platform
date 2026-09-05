from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict


class AttachmentOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    decision_id: int
    uploaded_by_id: int
    filename: str
    file_path: str
    file_size: int
    content_type: Optional[str] = None
    created_at: datetime
