from fastapi import FastAPI

app = FastAPI(title="Expert Decision Replay Platform")


@app.get("/")
def home():
    return {"message": "Expert Decision Replay Platform API is running"}

