from typing import List, Optional

from pydantic import BaseModel


class GraphNode(BaseModel):
    id: str
    type: str  # decision | team | person | document | topic | state
    label: str
    subtitle: Optional[str] = None


class GraphEdge(BaseModel):
    source: str
    target: str
    relation: str


class KnowledgeGraphResponse(BaseModel):
    focal_decision_id: int
    nodes: List[GraphNode]
    edges: List[GraphEdge]
