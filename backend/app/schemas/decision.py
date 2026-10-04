from typing import Optional
from pydantic import BaseModel, Field, field_validator

STATUSES=["Draft","Under Review","Approved","Rejected","Archived"]

class DecisionCreate(BaseModel):
    title:str
    problem_statement:str
    category:Optional[str]=None
    status:str="Draft"
    @field_validator("title","problem_statement")
    @classmethod
    def required(cls,v):
        if not v.strip(): raise ValueError("This field is required.")
        return v.strip()
    @field_validator("status")
    @classmethod
    def valid_status(cls,v):
        if v not in STATUSES: raise ValueError("Invalid decision status.")
        return v

class DecisionOut(BaseModel):
    id:int
    title:str
    problem_statement:str
    category:Optional[str]=None
    status:str
    created_by:int
    creator_name:Optional[str]=None
    team_name:Optional[str]=None
    created_at:str
    updated_at:str

class AlternativeIn(BaseModel):
    title:str
    description:Optional[str]=None
    pros:Optional[str]=None
    cons:Optional[str]=None
    estimated_cost:Optional[float]=None
    feasibility:Optional[str]=None
    risk:Optional[str]=None
    @field_validator("title")
    @classmethod
    def title_required(cls,v):
        if not v.strip(): raise ValueError("Alternative title is required.")
        return v.strip()

class CommentIn(BaseModel):
    comment_text:str
    parent_id:Optional[int]=None
    @field_validator("comment_text")
    @classmethod
    def comment_required(cls,v):
        if not v.strip(): raise ValueError("Comment cannot be empty.")
        return v.strip()
