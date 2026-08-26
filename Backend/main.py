from fastapi import FastAPI
from database import engine, Base, SessionLocal
from models import User, Decision, DecisionHistory

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Expert Decision Replay Platform")


@app.get("/")
def home():
    return {"message": "Expert Decision Replay Platform Backend"}


@app.get("/health")
def health():
    return {"status": "healthy"}


@app.get("/users")
def get_users():
    return {"message": "Users API is working"}


@app.get("/decisions")
def get_decisions():
    db = SessionLocal()
    try:
        decisions = db.query(Decision).all()
        return decisions
    finally:
        db.close()

@app.post("/decisions")
def create_decision(title: str, problem: str, reasoning: str):
    db = SessionLocal()
    try:
        decision = Decision(
            title=title,
            problem=problem,
            reasoning=reasoning
        )
        db.add(decision)
        db.commit()
        db.refresh(decision)
        return decision
    finally:
        db.close()

@app.put("/decisions/{decision_id}")
def update_decision(decision_id: int, final_decision: str):
    db = SessionLocal()

    try:
        decision = db.query(Decision).filter(Decision.id == decision_id).first()

        if not decision:
            return {"message": "Decision not found"}

        decision.final_decision = final_decision
        decision.status = "Completed"

        db.commit()
        db.refresh(decision)

        return decision

    finally:
        db.close()

@app.post("/decisions/{decision_id}/history")
def add_history(decision_id: int, action: str, description: str):
    db = SessionLocal()

    try:
        history = DecisionHistory(
            action=action,
            description=description,
            decision_id=decision_id
        )

        db.add(history)
        db.commit()
        db.refresh(history)

        return history

    finally:
        db.close() 

@app.get("/decisions/{decision_id}/history")
def get_history(decision_id: int):
    db = SessionLocal()

    try:
        history = (
            db.query(DecisionHistory)
            .filter(DecisionHistory.decision_id == decision_id)
            .all()
        )

        return history

    finally:
        db.close()

@app.get("/decisions/{decision_id}/replay")
def replay_decision(decision_id: int):
    db = SessionLocal()

    try:
        decision = db.query(Decision).filter(
            Decision.id == decision_id
        ).first()

        if not decision:
            return {"message": "Decision not found"}

        history = db.query(DecisionHistory).filter(
            DecisionHistory.decision_id == decision_id
        ).all()

        return {
            "decision": decision,
            "history": history
        }

    finally:
        db.close()       