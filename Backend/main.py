import os
import shutil
from datetime import datetime
from typing import Optional
from notification_model import Notification

from fastapi import FastAPI, HTTPException, UploadFile, File, Request, Body
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse

from database import engine, Base, SessionLocal

from models import (
    User,
    Decision,
    DecisionHistory,
    Alternative,
    Review,
    Outcome,
    Document,
    Comment,
    Approval,
    AuditLog,
)

from schemas import (
    UserCreate,
    UserLogin,
    DecisionCreate,
    DecisionEditUpdate,
    AlternativeCreate,
    AlternativeOut,
    ReviewCreate,
    ReviewOut,
    OutcomeCreate,
    OutcomeOut,
    CommentCreate,
    CommentOut,
    DocumentOut,
)


# ============================================================
# DATABASE
# ============================================================

Base.metadata.create_all(bind=engine)


# ============================================================
# FASTAPI APP
# ============================================================

app = FastAPI(
    title="Expert Decision Replay Platform"
)


# ============================================================
# CORS
# ============================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================
# FILE UPLOAD DIRECTORY
# ============================================================

UPLOAD_DIR = "uploads"

os.makedirs(
    UPLOAD_DIR,
    exist_ok=True
)


# ============================================================
# HELPER
# MANAGER AUTHORIZATION
# ============================================================

def require_manager(db, user_id):
    """
    Allow only Manager/Admin users to perform
    manager-only operations.
    """

    if not user_id:
        raise HTTPException(
            status_code=403,
            detail="Manager access required"
        )

    user = (
        db.query(User)
        .filter(User.id == user_id)
        .first()
    )

    if not user:
        raise HTTPException(
            status_code=403,
            detail="User not found"
        )

    allowed_roles = [
        "manager",
        "admin",
        "administrator",
    ]

    role = (
        user.role or "employee"
    ).lower()

    if role not in allowed_roles:
        raise HTTPException(
            status_code=403,
            detail="Only managers can perform this action"
        )

    return user


# ============================================================
# NOTIFICATION HELPER
# ============================================================

def create_notification(
    db,
    user_id,
    title,
    message,
    notification_type="info",
    decision_id=None
):
    """Create a notification for a specific user."""

    notification = Notification(
        user_id=user_id,
        decision_id=decision_id,
        title=title,
        message=message,
        notification_type=notification_type,
        is_read=0
    )

    db.add(notification)
    return notification


# ============================================================
# AUDIT LOG HELPER
# ============================================================

def log_audit(
    db,
    action: str,
    description: str = None,
    user_id: int = None,
    user_name: str = None,
    user_role: str = None,
    decision_id: int = None,
):
    """Safely create an organizational audit log record."""
    try:
        if user_id and (not user_name or not user_role):
            u = db.query(User).filter(User.id == user_id).first()
            if u:
                user_name = user_name or u.name
                user_role = user_role or u.role

        audit_entry = AuditLog(
            user_id=user_id,
            user_name=user_name or "System",
            user_role=user_role or "System",
            action=action,
            decision_id=decision_id,
            description=description,
            timestamp=datetime.utcnow(),
        )
        db.add(audit_entry)
        return audit_entry
    except Exception as e:
        print(f"Error logging audit: {e}")
        return None


# ============================================================
# BASIC
# ============================================================

@app.get("/")
def home():
    return {
        "message": "Expert Decision Replay Platform Backend"
    }


@app.get("/health")
def health():
    return {
        "status": "healthy"
    }


# ============================================================
# USERS
# ============================================================

@app.post("/register")
def register_user(payload: UserCreate):

    db = SessionLocal()

    try:

        existing_user = (
            db.query(User)
            .filter(
                User.email == payload.email
            )
            .first()
        )

        if existing_user:
            raise HTTPException(
                status_code=400,
                detail="Email already registered"
            )

        user = User(
            name=payload.name,
            email=payload.email,
            password=payload.password,
            role=payload.role,
        )

        db.add(user)
        db.commit()
        db.refresh(user)

        return {
            "message": "Registration successful",
            "user_id": user.id,
            "name": user.name,
            "email": user.email,
            "role": user.role,
        }

    finally:
        db.close()


@app.post("/login")
def login_user(payload: UserLogin):

    db = SessionLocal()

    try:

        user = (
            db.query(User)
            .filter(
                User.email == payload.email
            )
            .first()
        )

        if not user:
            raise HTTPException(
                status_code=401,
                detail="Invalid email or password"
            )

        if user.password != payload.password:
            raise HTTPException(
                status_code=401,
                detail="Invalid email or password"
            )

        log_audit(
            db=db,
            action="User login",
            description=f"User {user.name} ({user.email}) logged in",
            user_id=user.id,
            user_name=user.name,
            user_role=user.role,
        )
        db.commit()

        return {
            "message": "Login successful",
            "user_id": user.id,
            "name": user.name,
            "email": user.email,
            "role": user.role,
        }

    finally:
        db.close()


@app.get("/users")
def get_users():

    db = SessionLocal()

    try:

        users = (
            db.query(User)
            .order_by(User.id.asc())
            .all()
        )

        return users

    finally:
        db.close()


# ============================================================
# DECISIONS
# ============================================================

@app.get("/decisions")
def get_decisions():

    db = SessionLocal()

    try:

        return (
            db.query(Decision)
            .order_by(
                Decision.id.desc()
            )
            .all()
        )

    finally:
        db.close()


@app.get("/decisions/{decision_id}")
def get_decision(
    decision_id: int
):

    db = SessionLocal()

    try:

        decision = (
            db.query(Decision)
            .filter(
                Decision.id == decision_id
            )
            .first()
        )

        if not decision:
            raise HTTPException(
                status_code=404,
                detail="Decision not found"
            )

        return decision

    finally:
        db.close()


# ============================================================
# CREATE DECISION
# ============================================================

@app.post("/decisions")
def create_decision(
    payload: DecisionCreate
):

    db = SessionLocal()

    try:

        decision = Decision(
            title=payload.title,
            problem=payload.problem,
            reasoning=payload.reasoning,
            category=payload.category,
            user_id=payload.user_id,
        )

        db.add(decision)
        db.commit()
        db.refresh(decision)

        # Add history
        history = DecisionHistory(
            action="Decision created",
            description=(
                f"Decision created by user "
                f"{payload.user_id}"
            ),
            decision_id=decision.id,
        )

        db.add(history)

        log_audit(
            db=db,
            action="Decision created",
            description=f"Decision '{decision.title}' created",
            user_id=payload.user_id,
            decision_id=decision.id,
        )

        db.commit()

        return decision

    finally:
        db.close()


# ============================================================
# MANAGER:
# MARK DECISION COMPLETED
# ============================================================

@app.put("/decisions/{decision_id}")
def update_decision(
    decision_id: int,
    final_decision: str,
    user_id: int,
):

    db = SessionLocal()

    try:

        # Manager permission
        manager = require_manager(
            db,
            user_id
        )

        decision = (
            db.query(Decision)
            .filter(
                Decision.id == decision_id
            )
            .first()
        )

        if not decision:
            raise HTTPException(
                status_code=404,
                detail="Decision not found"
            )

        old_status = decision.status

        decision.final_decision = final_decision
        decision.status = "Completed"

        db.commit()
        db.refresh(decision)

        history = DecisionHistory(
            action="Updated",
            description=(
                f"Status changed from "
                f"{old_status} to "
                f"{decision.status}. "
                f"Updated by manager "
                f"{manager.name}"
            ),
            decision_id=decision.id,
        )

        db.add(history)

        log_audit(
            db=db,
            action="Decision completed",
            description=f"Status changed from {old_status} to Completed by {manager.name}",
            user_id=manager.id,
            user_name=manager.name,
            user_role=manager.role,
            decision_id=decision.id,
        )

        db.commit()

        return decision

    finally:
        db.close()


# ============================================================
# MANAGER:
# EDIT DECISION
# ============================================================

@app.put("/decisions/{decision_id}/edit")
def edit_decision(
    decision_id: int,
    payload: DecisionEditUpdate,
    user_id: int,
):

    db = SessionLocal()

    try:

        # Manager permission
        manager = require_manager(
            db,
            user_id
        )

        decision = (
            db.query(Decision)
            .filter(
                Decision.id == decision_id
            )
            .first()
        )

        if not decision:
            raise HTTPException(
                status_code=404,
                detail="Decision not found"
            )

        changes = []

        if (
            payload.title is not None
            and payload.title != decision.title
        ):
            changes.append(
                "title changed"
            )

            decision.title = payload.title

        if (
            payload.problem is not None
            and payload.problem != decision.problem
        ):
            changes.append(
                "problem statement updated"
            )

            decision.problem = payload.problem

        if (
            payload.reasoning is not None
            and payload.reasoning != decision.reasoning
        ):
            changes.append(
                "reasoning updated"
            )

            decision.reasoning = payload.reasoning

        if (
            payload.category is not None
            and payload.category != decision.category
        ):
            changes.append(
                "category changed"
            )

            decision.category = payload.category

        db.commit()
        db.refresh(decision)

        if changes:

            history = DecisionHistory(
                action="Edited",
                description=(
                    "; ".join(changes)
                    + f" by manager {manager.name}"
                ),
                decision_id=decision.id,
            )

            db.add(history)

            log_audit(
                db=db,
                action="Decision edited",
                description=(
                    "; ".join(changes)
                    + f" by manager {manager.name}"
                ),
                user_id=manager.id,
                user_name=manager.name,
                user_role=manager.role,
                decision_id=decision.id,
            )

            db.commit()

        return decision

    finally:
        db.close()


# ============================================================
# MANAGER:
# DELETE DECISION
# ============================================================

@app.delete("/decisions/{decision_id}")
def delete_decision(
    decision_id: int,
    user_id: int,
):

    db = SessionLocal()

    try:

        # Manager permission
        require_manager(
            db,
            user_id
        )

        decision = (
            db.query(Decision)
            .filter(
                Decision.id == decision_id
            )
            .first()
        )

        if not decision:
            raise HTTPException(
                status_code=404,
                detail="Decision not found"
            )

        # Delete related rows first
        db.query(Alternative).filter(
            Alternative.decision_id == decision_id
        ).delete(
            synchronize_session=False
        )

        db.query(Review).filter(
            Review.decision_id == decision_id
        ).delete(
            synchronize_session=False
        )

        db.query(DecisionHistory).filter(
            DecisionHistory.decision_id == decision_id
        ).delete(
            synchronize_session=False
        )

        db.query(Outcome).filter(
            Outcome.decision_id == decision_id
        ).delete(
            synchronize_session=False
        )

        db.query(Document).filter(
            Document.decision_id == decision_id
        ).delete(
            synchronize_session=False
        )

        db.query(Comment).filter(
            Comment.decision_id == decision_id
        ).delete(
            synchronize_session=False
        )

        # Delete approvals
        db.query(Approval).filter(
            Approval.decision_id == decision_id
        ).delete(synchronize_session=False)

        decision_title = decision.title
        db.delete(decision)

        log_audit(
            db=db,
            action="Decision deleted",
            description=f"Decision '{decision_title}' (ID #{decision_id}) deleted",
            user_id=user_id,
            decision_id=decision_id,
        )

        db.commit()

        return {
            "message": "Decision deleted"
        }

    finally:
        db.close()


# ============================================================
# DECISION HISTORY / REPLAY
# ============================================================

@app.post("/decisions/{decision_id}/history")
def add_history(
    decision_id: int,
    action: str,
    description: str,
):

    db = SessionLocal()

    try:

        decision = (
            db.query(Decision)
            .filter(
                Decision.id == decision_id
            )
            .first()
        )

        if not decision:
            raise HTTPException(
                status_code=404,
                detail="Decision not found"
            )

        history = DecisionHistory(
            action=action,
            description=description,
            decision_id=decision_id,
        )

        db.add(history)
        db.commit()
        db.refresh(history)

        return history

    finally:
        db.close()


@app.get("/decisions/{decision_id}/history")
def get_history(
    decision_id: int
):

    db = SessionLocal()

    try:

        return (
            db.query(DecisionHistory)
            .filter(
                DecisionHistory.decision_id
                == decision_id
            )
            .order_by(
                DecisionHistory.id.desc()
            )
            .all()
        )

    finally:
        db.close()


@app.get("/decisions/{decision_id}/replay")
def replay_decision(
    decision_id: int
):

    db = SessionLocal()

    try:

        decision = (
            db.query(Decision)
            .filter(
                Decision.id == decision_id
            )
            .first()
        )

        if not decision:
            return {
                "message": "Decision not found"
            }

        history = (
            db.query(DecisionHistory)
            .filter(
                DecisionHistory.decision_id
                == decision_id
            )
            .order_by(
                DecisionHistory.id.asc()
            )
            .all()
        )

        return {
            "decision": decision,
            "history": history,
        }

    finally:
        db.close()


# ============================================================
# ALTERNATIVES
# ============================================================

@app.post(
    "/decisions/{decision_id}/alternatives",
    response_model=AlternativeOut
)
def create_alternative(
    decision_id: int,
    payload: AlternativeCreate
):

    db = SessionLocal()

    try:

        decision = (
            db.query(Decision)
            .filter(
                Decision.id == decision_id
            )
            .first()
        )

        if not decision:
            raise HTTPException(
                status_code=404,
                detail="Decision not found"
            )

        alt = Alternative(
            **payload.dict(),
            decision_id=decision_id
        )

        db.add(alt)
        db.commit()
        db.refresh(alt)

        history = DecisionHistory(
            action="Alternative added",
            description=alt.name,
            decision_id=decision_id,
        )

        db.add(history)

        log_audit(
            db=db,
            action="Alternative added",
            description=f"Alternative '{alt.name}' added to decision #{decision_id}",
            decision_id=decision_id,
        )

        db.commit()

        return alt

    finally:
        db.close()


@app.get(
    "/decisions/{decision_id}/alternatives",
    response_model=list[AlternativeOut]
)
def get_alternatives(
    decision_id: int
):

    db = SessionLocal()

    try:

        return (
            db.query(Alternative)
            .filter(
                Alternative.decision_id
                == decision_id
            )
            .all()
        )

    finally:
        db.close()


@app.delete("/alternatives/{alternative_id}")
def delete_alternative(
    alternative_id: int
):

    db = SessionLocal()

    try:

        alt = (
            db.query(Alternative)
            .filter(
                Alternative.id == alternative_id
            )
            .first()
        )

        if not alt:
            raise HTTPException(
                status_code=404,
                detail="Alternative not found"
            )

        alt_name = alt.name
        alt_decision_id = alt.decision_id
        db.delete(alt)

        log_audit(
            db=db,
            action="Alternative deleted",
            description=f"Alternative '{alt_name}' deleted from decision #{alt_decision_id}",
            decision_id=alt_decision_id,
        )

        db.commit()

        return {
            "message": "Alternative deleted"
        }

    finally:
        db.close()


# ============================================================
# REVIEWS
# ============================================================

@app.post(
    "/decisions/{decision_id}/reviews",
    response_model=ReviewOut
)
def create_review(
    decision_id: int,
    payload: ReviewCreate
):

    db = SessionLocal()

    try:

        decision = (
            db.query(Decision)
            .filter(
                Decision.id == decision_id
            )
            .first()
        )

        if not decision:
            raise HTTPException(
                status_code=404,
                detail="Decision not found"
            )

        review = Review(
            **payload.dict(),
            decision_id=decision_id
        )

        db.add(review)
        db.commit()
        db.refresh(review)

        return review

    finally:
        db.close()


@app.get(
    "/decisions/{decision_id}/reviews",
    response_model=list[ReviewOut]
)
def get_reviews(
    decision_id: int
):

    db = SessionLocal()

    try:

        return (
            db.query(Review)
            .filter(
                Review.decision_id
                == decision_id
            )
            .all()
        )

    finally:
        db.close()


# ============================================================
# OUTCOMES
# ============================================================

@app.post(
    "/decisions/{decision_id}/outcome",
    response_model=OutcomeOut
)
def create_outcome(
    decision_id: int,
    payload: OutcomeCreate
):

    db = SessionLocal()

    try:

        decision = (
            db.query(Decision)
            .filter(
                Decision.id == decision_id
            )
            .first()
        )

        if not decision:
            raise HTTPException(
                status_code=404,
                detail="Decision not found"
            )

        outcome = Outcome(
            **payload.dict(),
            decision_id=decision_id
        )

        db.add(outcome)
        db.commit()
        db.refresh(outcome)

        return outcome

    finally:
        db.close()


@app.get(
    "/decisions/{decision_id}/outcome",
    response_model=OutcomeOut
)
def get_outcome(
    decision_id: int
):

    db = SessionLocal()

    try:

        outcome = (
            db.query(Outcome)
            .filter(
                Outcome.decision_id
                == decision_id
            )
            .first()
        )

        if not outcome:
            raise HTTPException(
                status_code=404,
                detail="No outcome recorded yet"
            )

        return outcome

    finally:
        db.close()


# ============================================================
# COMMENTS
# DISCUSSION MODULE
# ============================================================

@app.post(
    "/decisions/{decision_id}/comments",
    response_model=CommentOut
)
def create_comment(
    decision_id: int,
    payload: CommentCreate
):

    db = SessionLocal()

    try:

        decision = (
            db.query(Decision)
            .filter(
                Decision.id == decision_id
            )
            .first()
        )

        if not decision:
            raise HTTPException(
                status_code=404,
                detail="Decision not found"
            )

        # Verify user exists
        if payload.user_id:

            user = (
                db.query(User)
                .filter(
                    User.id == payload.user_id
                )
                .first()
            )

            if not user:
                raise HTTPException(
                    status_code=403,
                    detail="User not found"
                )

        comment = Comment(
            **payload.dict(),
            decision_id=decision_id
        )

        db.add(comment)

        log_audit(
            db=db,
            action="Comment added",
            description=f"Comment posted on decision #{decision_id}: {comment.content[:60]}",
            user_id=payload.user_id,
            decision_id=decision_id,
        )

        db.commit()
        db.refresh(comment)

        return comment

    finally:
        db.close()


@app.get(
    "/decisions/{decision_id}/comments",
    response_model=list[CommentOut]
)
def get_comments(
    decision_id: int
):

    db = SessionLocal()

    try:

        return (
            db.query(Comment)
            .filter(
                Comment.decision_id
                == decision_id
            )
            .order_by(
                Comment.created_at.asc()
            )
            .all()
        )

    finally:
        db.close()


# ============================================================
# GLOBAL DISCUSSIONS
#
# MANAGER:
#   sees everyone's discussions
#
# EMPLOYEE:
#   sees only their own discussions
# ============================================================

@app.get("/discussions")
def get_all_discussions(
    user_id: int
):

    db = SessionLocal()

    try:

        current_user = (
            db.query(User)
            .filter(
                User.id == user_id
            )
            .first()
        )

        if not current_user:
            raise HTTPException(
                status_code=403,
                detail="User not found"
            )

        role = (
            current_user.role
            or "employee"
        ).lower()

        is_manager = role in [
            "manager",
            "admin",
            "administrator",
        ]

        query = (
            db.query(
                Comment,
                Decision.title.label(
                    "decision_title"
                ),
                User.name.label(
                    "user_name"
                ),
                User.role.label(
                    "user_role"
                ),
            )
            .join(
                Decision,
                Comment.decision_id
                == Decision.id
            )
            .outerjoin(
                User,
                Comment.user_id
                == User.id
            )
        )

        # Employees see only their own
        # discussions
        if not is_manager:

            query = query.filter(
                Comment.user_id == user_id
            )

        results = (
            query
            .order_by(
                Comment.created_at.desc()
            )
            .all()
        )

        discussions = []

        for (
            comment,
            decision_title,
            user_name,
            user_role,
        ) in results:

            discussions.append(
                {
                    "id": comment.id,
                    "content": comment.content,
                    "is_meeting_note": (
                        comment.is_meeting_note
                    ),
                    "created_at": (
                        comment.created_at
                    ),
                    "decision_id": (
                        comment.decision_id
                    ),
                    "decision_title": (
                        decision_title
                    ),
                    "user_id": (
                        comment.user_id
                    ),
                    "user_name": (
                        user_name
                        or "Unknown User"
                    ),
                    "user_role": (
                        user_role
                        or "Employee"
                    ),
                }
            )

        return discussions

    finally:
        db.close()


# ============================================================
# DOCUMENTS
# ============================================================

@app.post(
    "/decisions/{decision_id}/documents",
    response_model=DocumentOut
)
def upload_document(
    decision_id: int,
    user_id: Optional[int] = None,
    file: UploadFile = File(...)
):

    db = SessionLocal()

    try:

        decision = (
            db.query(Decision)
            .filter(
                Decision.id == decision_id
            )
            .first()
        )

        if not decision:
            raise HTTPException(
                status_code=404,
                detail="Decision not found"
            )

        if not file.filename:
            raise HTTPException(
                status_code=400,
                detail="No file selected"
            )

        if user_id is not None:
            uploader = db.query(User).filter(User.id == user_id).first()
            if not uploader:
                raise HTTPException(status_code=403, detail="User not found")

        folder = os.path.join(
            UPLOAD_DIR,
            str(decision_id)
        )

        os.makedirs(
            folder,
            exist_ok=True
        )

        save_path = os.path.join(
            folder,
            file.filename
        )

        with open(
            save_path,
            "wb"
        ) as buffer:

            shutil.copyfileobj(
                file.file,
                buffer
            )

        doc = Document(
            filename=file.filename,
            filepath=save_path,
            decision_id=decision_id,
            uploaded_by=user_id,
        )

        db.add(doc)

        # History
        history = DecisionHistory(
            action="Document uploaded",
            description=file.filename,
            decision_id=decision_id,
        )

        db.add(history)

        log_audit(
            db=db,
            action="Document uploaded",
            description=f"File '{file.filename}' uploaded to decision #{decision_id}",
            decision_id=decision_id,
        )

        # One commit only
        db.commit()

        # Refresh after commit
        db.refresh(doc)

        return doc

    finally:
        db.close()


@app.get(
    "/decisions/{decision_id}/documents",
    response_model=list[DocumentOut]
)
def get_documents(
    decision_id: int
):

    db = SessionLocal()

    try:

        return (
            db.query(Document)
            .filter(
                Document.decision_id
                == decision_id
            )
            .order_by(
                Document.id.desc()
            )
            .all()
        )

    finally:
        db.close()


@app.get(
    "/documents/{document_id}/download"
)
def download_document(
    document_id: int,
    user_id: Optional[int] = None,
):

    db = SessionLocal()

    try:

        doc = (
            db.query(Document)
            .filter(
                Document.id == document_id
            )
            .first()
        )

        if not doc:
            raise HTTPException(
                status_code=404,
                detail="Document not found"
            )

        if not os.path.exists(
            doc.filepath
        ):
            raise HTTPException(
                status_code=404,
                detail="File not found on server"
            )

        log_audit(
            db=db,
            action="Document downloaded",
            description=f"Document '{doc.filename}' (ID #{doc.id}) downloaded",
            decision_id=doc.decision_id,
            user_id=user_id,
        )
        db.commit()

        return FileResponse(
            doc.filepath,
            filename=doc.filename
        )

    finally:
        db.close()


# ============================================================
# KNOWLEDGE REPOSITORY - ALL ACCESSIBLE DOCUMENTS
# ============================================================

@app.get("/documents")
def get_all_documents(user_id: int):
    db = SessionLocal()

    try:
        user = (
            db.query(User)
            .filter(User.id == user_id)
            .first()
        )

        if not user:
            raise HTTPException(
                status_code=403,
                detail="User not found"
            )

        role = (user.role or "employee").lower()
        is_manager = role in ["manager", "admin", "administrator"]

        query = (
            db.query(
                Document,
                Decision,
                Decision.title.label("decision_title"),
                User.name.label("uploader_name"),
            )
            .join(Decision, Document.decision_id == Decision.id)
            .outerjoin(User, Document.uploaded_by == User.id)
        )

        if not is_manager:
            query = query.filter(
                (Decision.user_id == user_id) | (Document.uploaded_by == user_id)
            )

        results = (
            query
            .order_by(Document.uploaded_at.desc(), Document.id.desc())
            .all()
        )

        docs = []
        for doc, decision, decision_title, uploader_name in results:
            docs.append({
                "id": doc.id,
                "filename": doc.filename,
                "filepath": doc.filepath,
                "decision_id": doc.decision_id,
                "decision_title": decision_title or f"Decision #{doc.decision_id}",
                "uploaded_by": doc.uploaded_by,
                "uploader_name": uploader_name or (decision.user.name if decision.user else "System User"),
                "uploaded_at": doc.uploaded_at,
            })

        return docs

    finally:
        db.close()



# ============================================================
# MILESTONE 3
# APPROVAL WORKFLOW
# ============================================================


# ------------------------------------------------------------
# EMPLOYEE:
# SUBMIT DECISION FOR APPROVAL
# ------------------------------------------------------------

@app.post(
    "/decisions/{decision_id}/submit-approval"
)
def submit_for_approval(
    decision_id: int,
    user_id: int,
):

    db = SessionLocal()

    try:

        decision = (
            db.query(Decision)
            .filter(
                Decision.id == decision_id
            )
            .first()
        )

        if not decision:
            raise HTTPException(
                status_code=404,
                detail="Decision not found"
            )

        user = (
            db.query(User)
            .filter(
                User.id == user_id
            )
            .first()
        )

        if not user:
            raise HTTPException(
                status_code=403,
                detail="User not found"
            )

        # Only creator can submit
        if decision.user_id != user_id:
            raise HTTPException(
                status_code=403,
                detail=(
                    "Only the decision creator "
                    "can submit this decision"
                )
            )

        # Check existing pending approval
        existing = (
            db.query(Approval)
            .filter(
                Approval.decision_id
                == decision_id,
                Approval.status == "Pending",
            )
            .first()
        )

        if existing:

            raise HTTPException(
                status_code=400,
                detail=(
                    "This decision is already "
                    "waiting for approval"
                )
            )

        # Only Draft or Rejected can be submitted
        if decision.status not in [
            "Draft",
            "Rejected",
        ]:

            raise HTTPException(
                status_code=400,
                detail=(
                    f"Decision cannot be submitted "
                    f"from status "
                    f"'{decision.status}'"
                )
            )

        approval = Approval(
            decision_id=decision_id,
            requested_by=user_id,
            status="Pending",
            comments=None,
        )

        db.add(approval)

        # Decision becomes Under Review
        decision.status = "Under Review"

        history = DecisionHistory(
            action="Submitted for approval",
            description=(
                f"Decision submitted for "
                f"manager approval by "
                f"{user.name}"
            ),
            decision_id=decision_id,
        )

        db.add(history)

        # Notify all managers/admins about the new approval request
        managers = (
            db.query(User)
            .filter(
                User.role.in_([
                    "manager",
                    "admin",
                    "administrator",
                ])
            )
            .all()
        )

        for manager in managers:
            create_notification(
                db=db,
                user_id=manager.id,
                title="New Approval Request",
                message=(
                    f"{user.name} submitted "
                    f"'{decision.title}' for approval."
                ),
                notification_type="approval",
                decision_id=decision.id,
            )

        log_audit(
            db=db,
            action="Decision submitted for approval",
            description=(
                f"Decision '{decision.title}' submitted for "
                f"manager approval by {user.name}"
            ),
            user_id=user.id,
            user_name=user.name,
            user_role=user.role,
            decision_id=decision.id,
        )

        db.commit()
        db.refresh(approval)

        return {
            "message": (
                "Decision submitted "
                "for approval"
            ),
            "approval_id": approval.id,
            "decision_id": decision_id,
            "status": approval.status,
            "decision_status": decision.status,
        }

    except HTTPException:
        db.rollback()
        raise

    except Exception as e:

        db.rollback()

        raise HTTPException(
            status_code=500,
            detail=str(e)
        )

    finally:
        db.close()


# ------------------------------------------------------------
# GET APPROVAL FOR ONE DECISION
# ------------------------------------------------------------

@app.get(
    "/decisions/{decision_id}/approval"
)
def get_decision_approval(
    decision_id: int,
    user_id: int,
):

    db = SessionLocal()

    try:

        user = (
            db.query(User)
            .filter(
                User.id == user_id
            )
            .first()
        )

        if not user:
            raise HTTPException(
                status_code=403,
                detail="User not found"
            )

        approval = (
            db.query(Approval)
            .filter(
                Approval.decision_id
                == decision_id
            )
            .order_by(
                Approval.id.desc()
            )
            .first()
        )

        if not approval:

            return {
                "message": (
                    "No approval request found"
                ),
                "approval": None,
            }

        # Employee can only see approval
        # for their own decision
        role = (
            user.role or "employee"
        ).lower()

        is_manager = role in [
            "manager",
            "admin",
            "administrator",
        ]

        decision = (
            db.query(Decision)
            .filter(
                Decision.id == decision_id
            )
            .first()
        )

        if (
            not is_manager
            and decision
            and decision.user_id != user_id
        ):

            raise HTTPException(
                status_code=403,
                detail="Access denied"
            )

        return {
            "id": approval.id,
            "decision_id": (
                approval.decision_id
            ),
            "requested_by": (
                approval.requested_by
            ),
            "reviewed_by": (
                approval.reviewed_by
            ),
            "status": approval.status,
            "comments": approval.comments,
            "created_at": (
                approval.created_at
            ),
            "reviewed_at": (
                approval.reviewed_at
            ),
        }

    finally:
        db.close()


# ------------------------------------------------------------
# MANAGER:
# VIEW PENDING APPROVALS
# ------------------------------------------------------------

@app.get("/approvals")
def get_pending_approvals(
    user_id: int,
):

    db = SessionLocal()

    try:

        # Manager only
        require_manager(
            db,
            user_id
        )

        results = (
            db.query(
                Approval,
                Decision,
                User,
            )
            .join(
                Decision,
                Approval.decision_id
                == Decision.id,
            )
            .join(
                User,
                Approval.requested_by
                == User.id,
            )
            .filter(
                Approval.status == "Pending"
            )
            .order_by(
                Approval.created_at.desc()
            )
            .all()
        )

        approvals = []

        for (
            approval,
            decision,
            employee,
        ) in results:

            approvals.append(
                {
                    "id": approval.id,
                    "decision_id": (
                        decision.id
                    ),
                    "decision_title": (
                        decision.title
                    ),
                    "decision_problem": (
                        decision.problem
                    ),
                    "decision_reasoning": (
                        decision.reasoning
                    ),
                    "decision_category": (
                        decision.category or "General"
                    ),
                    "requested_by": (
                        employee.id
                    ),
                    "employee_name": (
                        employee.name
                    ),
                    "employee_email": (
                        employee.email
                    ),
                    "status": (
                        approval.status
                    ),
                    "comments": (
                        approval.comments
                    ),
                    "created_at": (
                        approval.created_at
                    ),
                }
            )

        return approvals

    finally:
        db.close()


# ------------------------------------------------------------
# MANAGER:
# APPROVE DECISION
# ------------------------------------------------------------

@app.put(
    "/approvals/{approval_id}/approve"
)
def approve_decision(
    approval_id: int,
    user_id: int,
    comments: str = "",
):

    db = SessionLocal()

    try:

        # Manager permission
        manager = require_manager(
            db,
            user_id
        )

        approval = (
            db.query(Approval)
            .filter(
                Approval.id == approval_id
            )
            .first()
        )

        if not approval:
            raise HTTPException(
                status_code=404,
                detail=(
                    "Approval request not found"
                )
            )

        if approval.status != "Pending":

            raise HTTPException(
                status_code=400,
                detail=(
                    f"Approval is already "
                    f"{approval.status}"
                )
            )

        decision = (
            db.query(Decision)
            .filter(
                Decision.id
                == approval.decision_id
            )
            .first()
        )

        if not decision:
            raise HTTPException(
                status_code=404,
                detail="Decision not found"
            )

        # Update approval
        approval.status = "Approved"

        approval.reviewed_by = (
            manager.id
        )

        approval.comments = (
            comments.strip()
            if comments
            else None
        )

        approval.reviewed_at = (
            datetime.utcnow()
        )

        # Update decision
        decision.status = "Approved"

        # History
        history = DecisionHistory(
            action="Decision approved",
            description=(
                f"Decision approved by "
                f"manager {manager.name}"
            ),
            decision_id=decision.id,
        )

        db.add(history)

        # Notify the employee who submitted the decision
        if decision.user_id:
            create_notification(
                db=db,
                user_id=decision.user_id,
                title="Decision Approved",
                message=(
                    f"Your decision '{decision.title}' "
                    f"has been approved by manager "
                    f"{manager.name}."
                ),
                notification_type="success",
                decision_id=decision.id,
            )

        log_audit(
            db=db,
            action="Decision approved",
            description=f"Decision '{decision.title}' approved by manager {manager.name}",
            user_id=manager.id,
            user_name=manager.name,
            user_role=manager.role,
            decision_id=decision.id,
        )

        db.commit()

        db.refresh(approval)
        db.refresh(decision)

        return {
            "message": (
                "Decision approved "
                "successfully"
            ),
            "approval_id": approval.id,
            "decision_id": decision.id,
            "approval_status": (
                approval.status
            ),
            "decision_status": (
                decision.status
            ),
            "reviewed_by": (
                manager.name
            ),
        }

    except HTTPException:
        db.rollback()
        raise

    except Exception as e:

        db.rollback()

        raise HTTPException(
            status_code=500,
            detail=str(e)
        )

    finally:
        db.close()


# ------------------------------------------------------------
# MANAGER:
# REJECT DECISION
# ------------------------------------------------------------

@app.put(
    "/approvals/{approval_id}/reject"
)
def reject_decision(
    approval_id: int,
    user_id: int,
    comments: Optional[str] = None,
    payload: Optional[dict] = Body(None),
):

    db = SessionLocal()

    try:

        # Manager permission
        manager = require_manager(
            db,
            user_id
        )

        approval = (
            db.query(Approval)
            .filter(
                Approval.id == approval_id
            )
            .first()
        )

        if not approval:
            raise HTTPException(
                status_code=404,
                detail=(
                    "Approval request not found"
                )
            )

        if approval.status != "Pending":

            raise HTTPException(
                status_code=400,
                detail=(
                    f"Approval is already "
                    f"{approval.status}"
                )
            )

        decision = (
            db.query(Decision)
            .filter(
                Decision.id
                == approval.decision_id
            )
            .first()
        )

        if not decision:
            raise HTTPException(
                status_code=404,
                detail="Decision not found"
            )

        rejection_reason = "No reason provided"
        if payload and isinstance(payload, dict) and payload.get("comments"):
            rejection_reason = str(payload.get("comments")).strip()
        elif comments and comments.strip():
            rejection_reason = comments.strip()

        # Update approval
        approval.status = "Rejected"

        approval.reviewed_by = (
            manager.id
        )

        approval.comments = (
            rejection_reason
        )

        approval.reviewed_at = (
            datetime.utcnow()
        )

        # Return decision to employee
        decision.status = "Rejected"

        # History
        history = DecisionHistory(
            action="Decision rejected",
            description=(
                f"Decision rejected by "
                f"manager {manager.name}. "
                f"Reason: "
                f"{rejection_reason}"
            ),
            decision_id=decision.id,
        )

        db.add(history)

        # Notify the employee who submitted the decision
        if decision.user_id:
            create_notification(
                db=db,
                user_id=decision.user_id,
                title="Decision Rejected",
                message=(
                    f"Your decision '{decision.title}' "
                    f"was rejected by manager "
                    f"{manager.name}. "
                    f"Reason: {rejection_reason}"
                ),
                notification_type="error",
                decision_id=decision.id,
            )

        log_audit(
            db=db,
            action="Decision rejected",
            description=(
                f"Decision '{decision.title}' rejected by "
                f"manager {manager.name}. Reason: {rejection_reason}"
            ),
            user_id=manager.id,
            user_name=manager.name,
            user_role=manager.role,
            decision_id=decision.id,
        )

        db.commit()

        db.refresh(approval)
        db.refresh(decision)

        return {
            "message": (
                "Decision rejected"
            ),
            "approval_id": approval.id,
            "decision_id": decision.id,
            "approval_status": (
                approval.status
            ),
            "decision_status": (
                decision.status
            ),
            "reviewed_by": (
                manager.name
            ),
            "comments": (
                approval.comments
            ),
        }

    except HTTPException:
        db.rollback()
        raise

    except Exception as e:

        db.rollback()

        raise HTTPException(
            status_code=500,
            detail=str(e)
        )

    finally:
        db.close()

# ============================================================
# MILESTONE 3 - NOTIFICATIONS
# ============================================================


# ------------------------------------------------------------
# GET ALL NOTIFICATIONS FOR CURRENT USER
# ------------------------------------------------------------

@app.get("/notifications")
def get_notifications(user_id: int):

    db = SessionLocal()

    try:

        user = (
            db.query(User)
            .filter(
                User.id == user_id
            )
            .first()
        )

        if not user:
            raise HTTPException(
                status_code=403,
                detail="User not found"
            )

        notifications = (
            db.query(Notification)
            .filter(
                Notification.user_id == user_id
            )
            .order_by(
                Notification.created_at.desc()
            )
            .all()
        )

        return [
            {
                "id": notification.id,
                "user_id": notification.user_id,
                "decision_id": notification.decision_id,
                "title": notification.title,
                "message": notification.message,
                "notification_type": notification.notification_type,
                "is_read": notification.is_read,
                "created_at": notification.created_at,
            }
            for notification in notifications
        ]

    finally:
        db.close()


# ------------------------------------------------------------
# GET UNREAD NOTIFICATION COUNT
# ------------------------------------------------------------

@app.get("/notifications/unread-count")
def get_unread_notification_count(
    user_id: int
):

    db = SessionLocal()

    try:

        user = (
            db.query(User)
            .filter(
                User.id == user_id
            )
            .first()
        )

        if not user:
            raise HTTPException(
                status_code=403,
                detail="User not found"
            )

        count = (
            db.query(Notification)
            .filter(
                Notification.user_id == user_id,
                Notification.is_read == 0
            )
            .count()
        )

        return {
            "count": count
        }

    finally:
        db.close()


# ------------------------------------------------------------
# MARK ONE NOTIFICATION AS READ
# ------------------------------------------------------------

@app.put(
    "/notifications/{notification_id}/read"
)
def mark_notification_read(
    notification_id: int,
    user_id: int
):

    db = SessionLocal()

    try:

        notification = (
            db.query(Notification)
            .filter(
                Notification.id == notification_id
            )
            .first()
        )

        if not notification:
            raise HTTPException(
                status_code=404,
                detail="Notification not found"
            )

        # Security:
        # User can only modify their own notification
        if notification.user_id != user_id:
            raise HTTPException(
                status_code=403,
                detail="Access denied"
            )

        notification.is_read = 1

        db.commit()

        return {
            "message": "Notification marked as read"
        }

    except HTTPException:
        db.rollback()
        raise

    except Exception as e:

        db.rollback()

        raise HTTPException(
            status_code=500,
            detail=str(e)
        )

    finally:
        db.close()


# ------------------------------------------------------------
# MARK ALL NOTIFICATIONS AS READ
# ------------------------------------------------------------

@app.put("/notifications/read-all")
def mark_all_notifications_read(
    user_id: int
):

    db = SessionLocal()

    try:

        user = (
            db.query(User)
            .filter(
                User.id == user_id
            )
            .first()
        )

        if not user:
            raise HTTPException(
                status_code=403,
                detail="User not found"
            )

        notifications = (
            db.query(Notification)
            .filter(
                Notification.user_id == user_id,
                Notification.is_read == 0
            )
            .all()
        )

        for notification in notifications:

            notification.is_read = 1

        db.commit()

        return {
            "message": "All notifications marked as read",
            "count": len(notifications)
        }

    except HTTPException:

        db.rollback()
        raise

    except Exception as e:

        db.rollback()

        raise HTTPException(
            status_code=500,
            detail=str(e)
        )

    finally:
        db.close()

# ------------------------------------------------------------
# MANAGER:
# CREATE TEST NOTIFICATION
# ------------------------------------------------------------

@app.post("/notifications/test")
def create_test_notification(
    user_id: int,
    manager_id: int,
):
    db = SessionLocal()

    try:
        require_manager(db, manager_id)

        user = (
            db.query(User)
            .filter(User.id == user_id)
            .first()
        )

        if not user:
            raise HTTPException(
                status_code=404,
                detail="User not found"
            )

        notification = create_notification(
            db=db,
            user_id=user.id,
            title="Test Notification",
            message="This is a test notification from the Expert Decision Replay Platform.",
            notification_type="info",
            decision_id=None,
        )

        db.commit()
        db.refresh(notification)

        return {
            "message": "Test notification created",
            "notification_id": notification.id,
            "user_id": user.id,
        }

    except HTTPException:
        db.rollback()
        raise

    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )

    finally:
        db.close()


# ============================================================
# MILESTONE 3 - MANAGER TEAMS
# ============================================================

@app.get("/teams")
def get_teams(user_id: int):
    """
    Manager endpoint to view organizational team members, roles,
    decision counts, and decision activity.
    """
    db = SessionLocal()
    try:
        user = (
            db.query(User)
            .filter(User.id == user_id)
            .first()
        )

        if not user:
            raise HTTPException(
                status_code=403,
                detail="User not found"
            )

        role = (user.role or "employee").lower()
        is_manager = role in ["manager", "admin", "administrator"]

        if not is_manager:
            raise HTTPException(
                status_code=403,
                detail="Manager access required to view teams management"
            )

        all_users = db.query(User).order_by(User.id.asc()).all()

        members = []
        for u in all_users:
            user_decisions = (
                db.query(Decision)
                .filter(Decision.user_id == u.id)
                .order_by(Decision.id.desc())
                .all()
            )

            members.append({
                "id": u.id,
                "name": u.name,
                "email": u.email,
                "role": u.role,
                "decisions_count": len(user_decisions),
                "decisions": [
                    {
                        "id": d.id,
                        "title": d.title,
                        "status": d.status,
                        "category": d.category or "General",
                    }
                    for d in user_decisions
                ]
            })

        return members

    finally:
        db.close()


# ============================================================
# MILESTONE 3 - ANALYTICS
# ============================================================

@app.get("/analytics")
def get_analytics(user_id: int):
    """
    Returns analytics metrics.
    Manager: organization-wide intelligence.
    Employee: own decision performance and statistics.
    """
    db = SessionLocal()
    try:
        user = (
            db.query(User)
            .filter(User.id == user_id)
            .first()
        )

        if not user:
            raise HTTPException(
                status_code=403,
                detail="User not found"
            )

        role = (user.role or "employee").lower()
        is_manager = role in ["manager", "admin", "administrator"]

        if is_manager:
            decisions = db.query(Decision).all()
            total_employees = (
                db.query(User)
                .filter(User.role.ilike("%employee%"))
                .count()
            )
            total_discussions = db.query(Comment).count()
            total_documents = db.query(Document).count()
            approvals = db.query(Approval).all()
        else:
            decisions = (
                db.query(Decision)
                .filter(Decision.user_id == user_id)
                .all()
            )
            total_employees = 1
            total_discussions = (
                db.query(Comment)
                .filter(Comment.user_id == user_id)
                .count()
            )
            decision_ids = [d.id for d in decisions]
            total_documents = (
                db.query(Document)
                .filter(Document.decision_id.in_(decision_ids))
                .count()
                if decision_ids
                else 0
            )
            approvals = (
                db.query(Approval)
                .filter(Approval.requested_by == user_id)
                .all()
            )

        draft_count = sum(1 for d in decisions if d.status == "Draft")
        under_review_count = sum(1 for d in decisions if d.status == "Under Review")
        approved_count = sum(1 for d in decisions if d.status == "Approved")
        rejected_count = sum(1 for d in decisions if d.status == "Rejected")
        completed_count = sum(1 for d in decisions if d.status == "Completed")

        # Category distribution
        categories = {}
        for d in decisions:
            cat = d.category or "General"
            categories[cat] = categories.get(cat, 0) + 1

        # Approval metrics
        pending_approvals = sum(1 for a in approvals if a.status == "Pending")
        approved_approvals = sum(1 for a in approvals if a.status == "Approved")
        rejected_approvals = sum(1 for a in approvals if a.status == "Rejected")

        return {
            "scope": "organization" if is_manager else "personal",
            "is_manager": is_manager,
            "total_decisions": len(decisions),
            "draft_count": draft_count,
            "under_review_count": under_review_count,
            "approved_count": approved_count,
            "rejected_count": rejected_count,
            "completed_count": completed_count,
            "total_employees": total_employees,
            "total_discussions": total_discussions,
            "total_documents": total_documents,
            "categories": categories,
            "approval_stats": {
                "pending": pending_approvals,
                "approved": approved_approvals,
                "rejected": rejected_approvals,
                "total": len(approvals),
            }
        }

    finally:
        db.close()


# ============================================================
# MILESTONE 3 - AUDIT LOGS
# ============================================================

@app.get("/audit-logs")
def get_audit_logs(
    user_id: int,
    action: Optional[str] = None,
    user_filter: Optional[str] = None,
    search: Optional[str] = None,
):
    """
    Returns organizational audit logs.
    Manager: organization-wide logs.
    Employee: own activities or logs related to own decisions.
    """
    db = SessionLocal()
    try:
        user = (
            db.query(User)
            .filter(User.id == user_id)
            .first()
        )

        if not user:
            raise HTTPException(
                status_code=403,
                detail="User not found"
            )

        role = (user.role or "employee").lower()
        is_manager = role in ["manager", "admin", "administrator"]

        query = db.query(AuditLog)

        if not is_manager:
            user_decision_ids = [
                d.id
                for d in db.query(Decision.id)
                .filter(Decision.user_id == user_id)
                .all()
            ]
            query = query.filter(
                (AuditLog.user_id == user_id)
                | (AuditLog.decision_id.in_(user_decision_ids))
            )

        if action and action != "All Actions":
            query = query.filter(AuditLog.action.ilike(f"%{action}%"))

        if user_filter and user_filter != "All Users":
            query = query.filter(AuditLog.user_name.ilike(f"%{user_filter}%"))

        if search:
            search_str = f"%{search.strip()}%"
            search_match = (
                (AuditLog.description.ilike(search_str))
                | (AuditLog.action.ilike(search_str))
                | (AuditLog.user_name.ilike(search_str))
            )
            if search.strip().isdigit():
                search_match = search_match | (AuditLog.decision_id == int(search.strip()))
            query = query.filter(search_match)

        logs = (
            query
            .order_by(AuditLog.timestamp.desc(), AuditLog.id.desc())
            .limit(150)
            .all()
        )

        return [
            {
                "id": log.id,
                "user_id": log.user_id,
                "user_name": log.user_name or "System",
                "user_role": log.user_role or "System",
                "action": log.action,
                "decision_id": log.decision_id,
                "description": log.description,
                "timestamp": log.timestamp,
            }
            for log in logs
        ]

    finally:
        db.close()
