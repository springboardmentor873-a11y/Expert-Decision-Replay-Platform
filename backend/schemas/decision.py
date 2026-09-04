from pydantic import BaseModel, Field


DECISION_STATUSES = {
    "Draft",
    "Under Review",
    "Approved",
    "Rejected",
    "Archived"
}


# -----------------------------
# DECISION
# -----------------------------

class DecisionCreate(BaseModel):

    title: str = Field(
        min_length=1,
        max_length=200
    )

    problem_statement: str = Field(
        min_length=1
    )

    objective: str | None = None

    category: str | None = None

    status: str = "Draft"

    rationale: str | None = None


class DecisionUpdate(BaseModel):

    title: str | None = Field(
        default=None,
        min_length=1,
        max_length=200
    )

    problem_statement: str | None = None

    objective: str | None = None

    category: str | None = None

    status: str | None = None

    rationale: str | None = None


# -----------------------------
# ALTERNATIVE
# -----------------------------

class AlternativeCreate(BaseModel):

    name: str = Field(
        min_length=1,
        max_length=200
    )

    description: str | None = None

    pros: str | None = None

    cons: str | None = None

    cost: float | None = None

    feasibility: str | None = None

    risk: str | None = None

    score: float | None = Field(
        default=None,
        ge=0,
        le=100
    )


class AlternativeUpdate(AlternativeCreate):
    pass


# -----------------------------
# DISCUSSION
# -----------------------------

class DiscussionCreate(BaseModel):

    content: str = Field(
        min_length=1
    )

    note_type: str = "Comment"