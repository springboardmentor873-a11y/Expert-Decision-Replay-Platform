from fastapi import APIRouter, Depends, HTTPException, status
from app.auth.dependencies import get_current_user
from app.schemas.decision import DecisionCreate, DecisionOut, AlternativeIn, CommentIn
from app.models import decision_model as m

router=APIRouter(prefix="/decisions",tags=["Decision Management"])

def out(r):
    if not r: return None
    for k in ("created_at","updated_at"):
        if r.get(k) is not None: r[k]=str(r[k])
    return DecisionOut(**{k:r.get(k) for k in DecisionOut.model_fields})

@router.get("",response_model=list[DecisionOut])
def all_decisions(current_user=Depends(get_current_user)):
    return [out(r) for r in m.list_decisions()]

@router.get("/stats")
def decision_stats(current_user=Depends(get_current_user)):
    r=m.stats()
    return {k:int(r.get(k) or 0) for k in ["total","draft","review","approved","rejected"]}

@router.post("",response_model=DecisionOut,status_code=201)
def add_decision(payload:DecisionCreate,current_user=Depends(get_current_user)):
    i=m.create_decision(payload.title,payload.problem_statement,payload.category,payload.status,current_user["id"])
    return out(m.get_decision(i))

@router.get("/{decision_id}",response_model=DecisionOut)
def one_decision(decision_id:int,current_user=Depends(get_current_user)):
    r=m.get_decision(decision_id)
    if not r: raise HTTPException(404,"Decision not found.")
    return out(r)

@router.put("/{decision_id}",response_model=DecisionOut)
def edit_decision(decision_id:int,payload:DecisionCreate,current_user=Depends(get_current_user)):
    r=m.update_decision(decision_id,payload.title,payload.problem_statement,payload.category,payload.status,current_user["id"])
    if not r: raise HTTPException(404,"Decision not found.")
    return out(r)

@router.delete("/{decision_id}")
def remove_decision(decision_id:int,current_user=Depends(get_current_user)):
    if not m.delete_decision(decision_id): raise HTTPException(404,"Decision not found.")
    return {"message":"Decision deleted."}

@router.get("/{decision_id}/alternatives")
def alternatives(decision_id:int,current_user=Depends(get_current_user)):
    if not m.get_decision(decision_id): raise HTTPException(404,"Decision not found.")
    return m.list_alternatives(decision_id)

@router.post("/{decision_id}/alternatives")
def add_alternative(decision_id:int,payload:AlternativeIn,current_user=Depends(get_current_user)):
    if not m.get_decision(decision_id): raise HTTPException(404,"Decision not found.")
    i=m.create_alternative(decision_id,payload.model_dump(),current_user["id"])
    return {"id":i,"message":"Alternative added."}

@router.put("/alternatives/{alternative_id}")
def edit_alternative(alternative_id:int,payload:AlternativeIn,current_user=Depends(get_current_user)):
    if not m.update_alternative(alternative_id,payload.model_dump()): raise HTTPException(404,"Alternative not found.")
    return {"message":"Alternative updated."}

@router.delete("/alternatives/{alternative_id}")
def remove_alternative(alternative_id:int,current_user=Depends(get_current_user)):
    if not m.delete_alternative(alternative_id): raise HTTPException(404,"Alternative not found.")
    return {"message":"Alternative deleted."}

@router.get("/{decision_id}/discussions")
def discussions(decision_id:int,current_user=Depends(get_current_user)):
    if not m.get_decision(decision_id): raise HTTPException(404,"Decision not found.")
    rows=m.list_comments(decision_id)
    for r in rows:
        r["created_at"]=str(r["created_at"])
        r["updated_at"]=str(r["updated_at"])
    return rows

@router.post("/{decision_id}/discussions")
def add_discussion(decision_id:int,payload:CommentIn,current_user=Depends(get_current_user)):
    if not m.get_decision(decision_id): raise HTTPException(404,"Decision not found.")
    i=m.create_comment(decision_id,payload.comment_text,current_user["id"],payload.parent_id)
    return {"id":i,"message":"Comment added."}

@router.delete("/discussions/{comment_id}")
def remove_discussion(comment_id:int,current_user=Depends(get_current_user)):
    if not m.delete_comment(comment_id,current_user["id"],current_user["role"]=="Administrator"):
        raise HTTPException(404,"Comment not found or not owned by you.")
    return {"message":"Comment deleted."}

@router.get("/{decision_id}/versions")
def versions(decision_id:int,current_user=Depends(get_current_user)):
    if not m.get_decision(decision_id): raise HTTPException(404,"Decision not found.")
    rows=m.list_versions(decision_id)
    for r in rows: r["changed_at"]=str(r["changed_at"])
    return rows
