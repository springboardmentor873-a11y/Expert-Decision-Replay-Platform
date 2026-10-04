import os, uuid
from pathlib import Path
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from fastapi.responses import FileResponse
from app.auth.dependencies import get_current_user
from app.models import decision_model as m

UPLOAD_DIR=Path(__file__).resolve().parents[3]/"uploads"
UPLOAD_DIR.mkdir(exist_ok=True)
MAX_SIZE=10*1024*1024
ALLOWED={"pdf","doc","docx","txt","png","jpg","jpeg","xlsx","csv"}

router=APIRouter(prefix="/documents",tags=["Documents"])

@router.get("/decision/{decision_id}")
def documents(decision_id:int,current_user=Depends(get_current_user)):
    if not m.get_decision(decision_id): raise HTTPException(404,"Decision not found.")
    rows=m.list_documents(decision_id)
    for r in rows:
        r["uploaded_at"]=str(r["uploaded_at"])
    return rows

@router.post("/decision/{decision_id}")
async def upload(decision_id:int,file:UploadFile=File(...),current_user=Depends(get_current_user)):
    if not m.get_decision(decision_id): raise HTTPException(404,"Decision not found.")
    ext=(file.filename.rsplit(".",1)[1].lower() if "." in file.filename else "")
    if ext not in ALLOWED: raise HTTPException(400,"Unsupported file type.")
    data=await file.read()
    if len(data)>MAX_SIZE: raise HTTPException(400,"File is too large. Maximum size is 10 MB.")
    stored=f"{uuid.uuid4().hex}.{ext}"
    target=UPLOAD_DIR/stored
    target.write_bytes(data)
    i=m.create_document(decision_id,Path(file.filename).name,stored,str(target),file.content_type,len(data),current_user["id"])
    return {"id":i,"message":"File uploaded successfully."}

@router.get("/{document_id}/download")
def download(document_id:int,current_user=Depends(get_current_user)):
    d=m.get_document(document_id)
    if not d: raise HTTPException(404,"Document not found.")
    path=Path(d["file_path"]).resolve()
    if not path.exists() or UPLOAD_DIR.resolve() not in path.parents:
        raise HTTPException(404,"Stored file not found.")
    return FileResponse(path,media_type=d.get("content_type") or "application/octet-stream",filename=d["original_filename"])

@router.delete("/{document_id}")
def delete(document_id:int,current_user=Depends(get_current_user)):
    d=m.get_document(document_id)
    if not d: raise HTTPException(404,"Document not found.")
    allowed=d["uploaded_by"]==current_user["id"] or current_user["role"]=="Administrator"
    if not allowed: raise HTTPException(403,"You can only delete your own uploads.")
    path=Path(d["file_path"])
    if path.exists(): path.unlink()
    m.delete_document(document_id,current_user["id"],current_user["role"]=="Administrator")
    return {"message":"Document deleted."}
