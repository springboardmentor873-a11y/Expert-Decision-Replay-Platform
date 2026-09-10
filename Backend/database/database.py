import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "sqlite:///./expert_decision_replay.db"
)

try:
    if DATABASE_URL.startswith("sqlite"):
        engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
    else:
        engine = create_engine(DATABASE_URL, connect_args={"connect_timeout": 2})
        # Test connection
        with engine.connect() as conn:
            pass
except Exception as e:
    print(f"PostgreSQL connection note: {e}. Using local SQLite database.")
    DATABASE_URL = "sqlite:///./expert_decision_replay.db"
    engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

Base = declarative_base()