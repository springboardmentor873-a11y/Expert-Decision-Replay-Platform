import logging
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from jwt.exceptions import InvalidTokenError
from sqlalchemy.exc import SQLAlchemyError

from app.api.v1.router import api_router
from app.core.config import settings
from app.core.exceptions import AppError
from app.core.logging import configure_logging
from app.db.health import database_is_reachable
from app.middleware.request_context import RequestContextMiddleware
from app.schemas.health import HealthResponse

from app.db.base import Base
from app.db.seed import seed_database
from app.db.session import engine

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(_app: FastAPI) -> AsyncIterator[None]:
    configure_logging()
    logger.info("Starting %s (%s)", settings.app_name, settings.environment)
    try:
        Base.metadata.create_all(bind=engine)
        seed_database()
        logger.info("Database initialized and verified.")
    except Exception as e:
        logger.warning("Database auto-init warning: %s", e)
    yield
    logger.info("Shutting down %s", settings.app_name)


def create_app() -> FastAPI:
    application = FastAPI(
        title=settings.app_name,
        version="0.1.0",
        lifespan=lifespan,
        docs_url="/docs" if settings.is_development else None,
        redoc_url="/redoc" if settings.is_development else None,
    )

    application.add_middleware(RequestContextMiddleware)
    application.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origin_list,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @application.exception_handler(AppError)
    async def app_error_handler(_request: Request, exc: AppError) -> JSONResponse:
        return JSONResponse(status_code=exc.status_code, content=exc.detail)

    @application.exception_handler(RequestValidationError)
    async def validation_handler(_request: Request, exc: RequestValidationError) -> JSONResponse:
        return JSONResponse(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            content={
                "code": "validation_error",
                "message": "Request validation failed",
                "details": exc.errors(),
            },
        )

    @application.exception_handler(InvalidTokenError)
    async def jwt_handler(_request: Request, _exc: InvalidTokenError) -> JSONResponse:
        return JSONResponse(
            status_code=status.HTTP_401_UNAUTHORIZED,
            content={"code": "invalid_token", "message": "Invalid or expired token", "details": None},
        )

    @application.exception_handler(SQLAlchemyError)
    async def sqlalchemy_handler(_request: Request, exc: SQLAlchemyError) -> JSONResponse:
        logger.exception("Database error: %s", exc)
        return JSONResponse(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            content={"code": "database_error", "message": "Database unavailable", "details": None},
        )

    @application.exception_handler(Exception)
    async def unhandled_handler(_request: Request, exc: Exception) -> JSONResponse:
        logger.exception("Unhandled error: %s", exc)
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"code": "internal_error", "message": "An unexpected error occurred", "details": None},
        )

    @application.get("/health", response_model=HealthResponse, tags=["health"])
    def liveness() -> HealthResponse:
        db_state = "ok" if database_is_reachable() else "unavailable"
        return HealthResponse(
            status="ok",
            app=settings.app_name,
            environment=settings.environment,
            database=db_state,
        )

    application.include_router(api_router, prefix="/api/v1")
    return application


app = create_app()
