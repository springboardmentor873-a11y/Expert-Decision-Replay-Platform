from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routes import auth
from app.routes import roles
from app.routes import teams


# ==========================================
# APP
# ==========================================

app = FastAPI(
    title="Expert Decision Replay Platform",
    description="Decision Intelligence Platform",
    version="1.0.0"
)


# ==========================================
# CORS
# ==========================================

app.add_middleware(
    CORSMiddleware,

    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173"
    ],

    allow_credentials=True,

    allow_methods=["*"],

    allow_headers=["*"]
)


# ==========================================
# ROUTERS
# ==========================================

app.include_router(auth.router)

app.include_router(roles.router)

app.include_router(teams.router)


# ==========================================
# ROOT
# ==========================================

@app.get("/")
def root():

    return {
        "message":
        "Expert Decision Replay Platform API is running"
    }