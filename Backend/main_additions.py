# ============================================================
# 1. Add these imports at the top of main.py
# ============================================================
import os
import shutil
from fastapi import UploadFile, File
from fastapi.responses import FileResponse

from models import User, Decision, DecisionHistory, Alternative, Review, Outcome, Document, Comment
from schemas import (
    AlternativeCreate, AlternativeOut,
    ReviewCreate, ReviewOut,
    OutcomeCreate, OutcomeOut,
    CommentCreate, CommentOut,
    DocumentOut,
)

UPLOAD_DIR = "uploads"


# ============================================================
# 2. Replace your existing update_decision with this version
#    (it now auto-logs a history/version entry on every change)
# ============================================================
@app.put("/decisions/{decision_id}")
def update_decision(decision_id: int, final_decision: str):
    db = SessionLocal()
    try:
        decision = db.query(Decision).filter(Decision.id == decision_id).first()
        if not decision:
            return {"message": "Decision not found"}

        old_status = decision.status
        decision.final_decision = final_decision
        decision.status = "Completed"
        db.commit()
        db.refresh(decision)

        # auto version log
        history = DecisionHistory(
            action="Updated",
            description=f"Status changed from {old_status} to {decision.status}",
            decision_id=decision.id,
        )
        db.add(history)
        db.commit()

        return decision
    finally:
        db.close()


# ============================================================
# 3. Alternative routes
# ============================================================
@app.post("/decisions/{decision_id}/alternatives", response_model=AlternativeOut)
def create_alternative(decision_id: int, payload: AlternativeCreate):
    db = SessionLocal()
    try:
        decision = db.query(Decision).filter(Decision.id == decision_id).first()
        if not decision:
            raise HTTPException(status_code=404, detail="Decision not found")

        alt = Alternative(**payload.dict(), decision_id=decision_id)
        db.add(alt)
        db.commit()
        db.refresh(alt)

        db.add(DecisionHistory(action="Alternative added", description=alt.name, decision_id=decision_id))
        db.commit()

        return alt
    finally:
        db.close()


@app.get("/decisions/{decision_id}/alternatives", response_model=list[AlternativeOut])
def get_alternatives(decision_id: int):
    db = SessionLocal()
    try:
        return db.query(Alternative).filter(Alternative.decision_id == decision_id).all()
    finally:
        db.close()


@app.delete("/alternatives/{alternative_id}")
def delete_alternative(alternative_id: int):
    db = SessionLocal()
    try:
        alt = db.query(Alternative).filter(Alternative.id == alternative_id).first()
        if not alt:
            raise HTTPException(status_code=404, detail="Alternative not found")
        db.delete(alt)
        db.commit()
        return {"message": "Alternative deleted"}
    finally:
        db.close()


# ============================================================
# 4. Review routes
# ============================================================
@app.post("/decisions/{decision_id}/reviews", response_model=ReviewOut)
def create_review(decision_id: int, payload: ReviewCreate):
    db = SessionLocal()
    try:
        decision = db.query(Decision).filter(Decision.id == decision_id).first()
        if not decision:
            raise HTTPException(status_code=404, detail="Decision not found")

        review = Review(**payload.dict(), decision_id=decision_id)
        db.add(review)
        db.commit()
        db.refresh(review)
        return review
    finally:
        db.close()


@app.get("/decisions/{decision_id}/reviews", response_model=list[ReviewOut])
def get_reviews(decision_id: int):
    db = SessionLocal()
    try:
        return db.query(Review).filter(Review.decision_id == decision_id).all()
    finally:
        db.close()


# ============================================================
# 5. Outcome routes
# ============================================================
@app.post("/decisions/{decision_id}/outcome", response_model=OutcomeOut)
def create_outcome(decision_id: int, payload: OutcomeCreate):
    db = SessionLocal()
    try:
        decision = db.query(Decision).filter(Decision.id == decision_id).first()
        if not decision:
            raise HTTPException(status_code=404, detail="Decision not found")

        outcome = Outcome(**payload.dict(), decision_id=decision_id)
        db.add(outcome)
        db.commit()
        db.refresh(outcome)
        return outcome
    finally:
        db.close()


@app.get("/decisions/{decision_id}/outcome", response_model=OutcomeOut)
def get_outcome(decision_id: int):
    db = SessionLocal()
    try:
        outcome = db.query(Outcome).filter(Outcome.decision_id == decision_id).first()
        if not outcome:
            raise HTTPException(status_code=404, detail="No outcome recorded yet")
        return outcome
    finally:
        db.close()


# ============================================================
# 6. Comment routes (Discussion Module)
# ============================================================
@app.post("/decisions/{decision_id}/comments", response_model=CommentOut)
def create_comment(decision_id: int, payload: CommentCreate):
    db = SessionLocal()
    try:
        decision = db.query(Decision).filter(Decision.id == decision_id).first()
        if not decision:
            raise HTTPException(status_code=404, detail="Decision not found")

        comment = Comment(**payload.dict(), decision_id=decision_id)
        db.add(comment)
        db.commit()
        db.refresh(comment)
        return comment
    finally:
        db.close()


@app.get("/decisions/{decision_id}/comments", response_model=list[CommentOut])
def get_comments(decision_id: int):
    db = SessionLocal()
    try:
        return db.query(Comment).filter(Comment.decision_id == decision_id).all()
    finally:
        db.close()


# ============================================================
# 7. Document routes (File Upload)
# ============================================================
@app.post("/decisions/{decision_id}/documents", response_model=DocumentOut)
def upload_document(decision_id: int, file: UploadFile = File(...)):
    db = SessionLocal()
    try:
        decision = db.query(Decision).filter(Decision.id == decision_id).first()
        if not decision:
            raise HTTPException(status_code=404, detail="Decision not found")

        folder = os.path.join(UPLOAD_DIR, str(decision_id))
        os.makedirs(folder, exist_ok=True)
        save_path = os.path.join(folder, file.filename)

        with open(save_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        doc = Document(filename=file.filename, filepath=save_path, decision_id=decision_id)
        db.add(doc)
        db.commit()
        db.refresh(doc)

        db.add(DecisionHistory(action="Document uploaded", description=file.filename, decision_id=decision_id))
        db.commit()

        return doc
    finally:
        db.close()


@app.get("/decisions/{decision_id}/documents", response_model=list[DocumentOut])
def get_documents(decision_id: int):
    db = SessionLocal()
    try:
        return db.query(Document).filter(Document.decision_id == decision_id).all()
    finally:
        db.close()


@app.get("/documents/{document_id}/download")
def download_document(document_id: int):
    db = SessionLocal()
    try:
        doc = db.query(Document).filter(Document.id == document_id).first()
        if not doc:
            raise HTTPException(status_code=404, detail="Document not found")
        return FileResponse(doc.filepath, filename=doc.filename)
    finally:
        db.close()