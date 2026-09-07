from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict


class UploaderSummary(BaseModel):
    id: int
    full_name: str
    email: str

    model_config = ConfigDict(from_attributes=True)


class DocumentResponse(BaseModel):
    id: int
    decision_id: int
    original_filename: str
    stored_filename: str
    file_path: str
    content_type: str
    file_size: int
    uploaded_by: int
    uploader: Optional[UploaderSummary] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
