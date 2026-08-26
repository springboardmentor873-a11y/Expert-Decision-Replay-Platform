from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.api.router import api_router
from app.api.routes import auth, users
from app.database.database import Base, engine, SessionLocal
from app.services.user_service import seed_roles_if_needed


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown lifecycle handler."""
    # Ensure tables exist and default roles are seeded safely
    try:
        Base.metadata.create_all(bind=engine)
        db = SessionLocal()
        try:
            seed_roles_if_needed(db)
        finally:
            db.close()
    except Exception as exc:
        print(f"[Warning] Database auto-init skipped or deferred: {exc}")
    yield


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="API for the Expert Decision Replay Platform - Milestone 1",
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# Configure CORS middleware
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API Router under /api/v1
app.include_router(api_router, prefix=settings.API_V1_STR)

# Also expose /auth and /users directly for convenience if called at root level
app.include_router(auth.router, prefix="/auth", tags=["Authentication (Direct)"])
app.include_router(users.router, prefix="/users", tags=["User Management (Direct)"])


@app.get("/health", tags=["Health"])
def health_check():
    """Health check endpoint."""
    return {"status": "healthy"}


@app.get("/", tags=["Root"])
def root():
    """Root landing endpoint."""
    return {
        "project": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "health": "/health",
        "docs": "/docs"
    }