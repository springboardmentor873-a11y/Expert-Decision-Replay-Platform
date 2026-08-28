from datetime import datetime
from uuid import UUID
from pydantic import BaseModel, ConfigDict


class AttachmentOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    decision_id: UUID
    uploaded_by_id: UUID
    uploaded_by_name: str | None = None
    file_name: str
    content_type: str
    byte_size: int
    storage_backend: str
    created_at: datetime
