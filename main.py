from fastapi import FastAPI
from database import engine, Base
import models

app = FastAPI(
    title="Expert Decision Replay Platform",
    version="1.0.0"
)

Base.metadata.create_all(bind=engine)


@app.get("/")
def root():
    return {
        "message": "Expert Decision Replay Platform API is running"
    }


@app.get("/health")
def health():
    return {
        "status": "healthy"
    }