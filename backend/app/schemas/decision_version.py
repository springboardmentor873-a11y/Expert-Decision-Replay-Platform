from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, ConfigDict, Field


class ChangerSummary(BaseModel):
    id: int
    full_name: str
    email: str

    model_config = ConfigDict(from_attributes=True)


class DecisionVersionResponse(BaseModel):
    id: int
    decision_id: int
    version_number: int
    title: str
    problem_statement: str
    context: str
    decision_taken: str
    reasoning: str
    expected_outcome: Optional[str] = None
    actual_outcome: Optional[str] = None
    status: str
    changed_by: int
    changer: Optional[ChangerSummary] = None
    created_at: datetime
    change_summary: str

    model_config = ConfigDict(from_attributes=True)


class FieldDifference(BaseModel):
    field: str
    old_value: Optional[str] = None
    new_value: Optional[str] = None


class VersionComparisonResponse(BaseModel):
    decision_id: int
    version_a: int
    version_b: int
    changes: List[FieldDifference] = []
