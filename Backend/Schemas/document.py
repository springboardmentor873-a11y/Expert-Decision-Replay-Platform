from pydantic import BaseModel
from typing import Optional, List, Union
from datetime import datetime


class DocumentOut(BaseModel):
    id: int
    title: str
    filename: str
    original_filename: str
    file_path: str
    file_type: str
    file_size: int
    category: str
    tags: Optional[Union[List[str], str]] = None
    description: Optional[str] = None
    decision_id: Optional[int] = None
    decision_title: Optional[str] = None
    uploaded_by_id: int
    uploader_name: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True
