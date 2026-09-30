"""Response schemas for the read-only Knowledge Repository."""
import uuid
from datetime import datetime

from pydantic import BaseModel

from app.models.decision import DecisionStatus


class RepositoryDocumentOut(BaseModel):
    id: uuid.UUID
    title: str
    description: str | None
    team_id: uuid.UUID | None
    team_name: str | None
    uploaded_by: uuid.UUID | None
    uploader_name: str | None
    uploader_email: str | None
    file_type: str | None
    file_size_bytes: int | None
    tags: list[str]
    decision_id: uuid.UUID | None
    decision_title: str | None
    has_content: bool
    created_at: datetime


class RepositoryDocumentList(BaseModel):
    items: list[RepositoryDocumentOut]
    total: int
    file_types: list[str]
    tags: list[str]


class RepositorySummary(BaseModel):
    total_documents: int
    decision_documents: int
    teams_contributed: int
    recently_added: int


class RepositoryDecisionOut(BaseModel):
    id: uuid.UUID
    title: str
    category: str | None
    status: DecisionStatus
    team_id: uuid.UUID | None
    team_name: str | None
    created_by: uuid.UUID
    created_by_name: str | None
    document_count: int
    created_at: datetime


class RepositoryDecisionList(BaseModel):
    items: list[RepositoryDecisionOut]
    total: int


class KnowledgeGraphNode(BaseModel):
    id: uuid.UUID
    type: str  # team | person | document | decision
    label: str
    subtitle: str | None
    team_id: uuid.UUID | None = None


class KnowledgeGraphEdge(BaseModel):
    source: uuid.UUID
    target: uuid.UUID
    relationship: str


class KnowledgeGraph(BaseModel):
    nodes: list[KnowledgeGraphNode]
    edges: list[KnowledgeGraphEdge]