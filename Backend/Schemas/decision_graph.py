from typing import Any, Dict, List

from pydantic import BaseModel, Field


class DecisionGraphNode(BaseModel):
    id: str
    type: str
    label: str
    decision_id: int
    details: Dict[str, Any] = Field(default_factory=dict)


class DecisionGraphEdge(BaseModel):
    id: str
    source: str
    target: str
    label: str


class DecisionGraphOut(BaseModel):
    decision_id: int
    nodes: List[DecisionGraphNode]
    edges: List[DecisionGraphEdge]