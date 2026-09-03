"""
Sets up the connection to PostgreSQL.

Uses SQLAlchemy's async engine so the API doesn't block on database calls.
Every request gets its own session via the `get_db` dependency, which is
closed automatically when the request finishes.
"""
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase

from app.core.config import settings

engine = create_async_engine(
    settings.DATABASE_URL,
    echo=settings.DEBUG,
    pool_pre_ping=True,  # avoids using a dead connection after DB restarts
)

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False,
)


class Base(DeclarativeBase):
    """All database models inherit from this."""
    pass


async def get_db():
    """
    FastAPI dependency — gives each request its own database session
    and guarantees it gets closed afterwards, even if an error happens.
    """
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()
