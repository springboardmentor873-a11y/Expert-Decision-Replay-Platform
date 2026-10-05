from typing import Dict, List

from pydantic import BaseModel


class DecisionReport(BaseModel):
    total: int
    by_status: Dict[str, int]
    by_category: Dict[str, int]
    by_user: List[Dict]
    by_team: List[Dict]
    pending_approvals: int
