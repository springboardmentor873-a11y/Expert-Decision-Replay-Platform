"""Database engine, session factory and startup helpers.

Connection settings come from the environment. `DATABASE_URL` is read from the
project-root `.env` file, which is resolved from this module's own location so
it is found no matter which directory the process was started from. Inside
Docker Compose the variables are injected into the container, and a real
environment variable always takes precedence over the file.

There is deliberately no built-in connection string: a silent fallback used to
point at `localhost:5432` with default credentials, which connects to whatever
PostgreSQL happens to own that port rather than to this project's database.
"""

import os
import time
from pathlib import Path

from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.engine import make_url
from sqlalchemy.orm import declarative_base, sessionmaker

# Backend/database.py -> Backend/ -> project root. Resolved from __file__ so the
# root .env is located independently of the current working directory.
PROJECT_ROOT = Path(__file__).resolve().parent.parent
ENV_FILE = PROJECT_ROOT / ".env"


class DatabaseConfigurationError(RuntimeError):
    """Raised when DATABASE_URL is missing or unusable."""


def load_env_file(env_file: Path = ENV_FILE) -> Path:
    """
    Load the project-root .env into the process environment.

    python-dotenv does not overwrite variables that are already set, so real
    environment variables (Docker Compose, CI, an explicit export) keep
    precedence over the file. Returns the path that was loaded.
    """

    load_dotenv(dotenv_path=env_file)
    return env_file


load_env_file()


def _safe_database_url() -> str:
    """DATABASE_URL with the password masked, safe to write to logs."""

    try:
        return make_url(DATABASE_URL).render_as_string(hide_password=True)
    except Exception:  # noqa: BLE001 - logging must never raise
        return "<unparseable DATABASE_URL>"


def _require_database_url() -> str:
    url = (os.getenv("DATABASE_URL") or "").strip()

    if not url:
        raise DatabaseConfigurationError(
            "DATABASE_URL is not set.\n"
            f"Set it in {ENV_FILE} (the project-root environment file), or "
            "export it before starting the API, for example:\n"
            "  DATABASE_URL=postgresql+psycopg://USER:PASSWORD@HOST:PORT/DATABASE"
        )

    if not url.startswith("postgresql"):
        raise DatabaseConfigurationError(
            f"DATABASE_URL must be a PostgreSQL URL, got {url.split(':', 1)[0]!r}."
        )

    return url


DATABASE_URL = _require_database_url()


def _engine_options():
    options = {
        # Never hand out a connection that died while idle (e.g. DB restart).
        "pool_pre_ping": True,
        # Objects stay usable after commit() so endpoints can return them
        # without a DetachedInstanceError once the session is closed.
        "echo": os.getenv("SQL_ECHO", "false").lower() == "true",
    }

    if DATABASE_URL.startswith("postgresql"):
        options.update(
            {
                "pool_size": int(os.getenv("DB_POOL_SIZE", "10")),
                "max_overflow": int(os.getenv("DB_MAX_OVERFLOW", "20")),
                "pool_recycle": int(os.getenv("DB_POOL_RECYCLE", "1800")),
                "pool_timeout": int(os.getenv("DB_POOL_TIMEOUT", "30")),
            }
        )

    return options


engine = create_engine(DATABASE_URL, **_engine_options())

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    expire_on_commit=False,
    bind=engine,
)

Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def _is_permanent_failure(exc: Exception) -> bool:
    """
    Distinguish "not ready yet" from "will never work".

    Retrying a bad password or a missing database for the whole timeout hides
    the real cause behind dozens of identical messages, so these fail fast.
    """

    message = str(exc).lower()

    permanent_markers = (
        "password authentication failed",
        "authentication failed",
        "role does not exist",
        "database does not exist",
        "no pg_hba.conf entry",
        "ssl connection is required",
    )

    return any(marker in message for marker in permanent_markers)


def wait_for_database(timeout: int = 90, interval: float = 2.0) -> bool:
    """
    Block until the database accepts connections.

    In Docker Compose the API container usually starts before PostgreSQL has
    finished its first-boot initialisation, so startup has to tolerate that.
    Configuration errors are reported immediately instead of being retried.
    """

    deadline = time.time() + timeout
    attempt = 0

    while True:
        attempt += 1
        try:
            connection = engine.connect()
            connection.close()
            return True
        except Exception as exc:  # noqa: BLE001 - any driver error means "not ready"
            if _is_permanent_failure(exc):
                print(
                    "[database] configuration error (not retrying):\n"
                    f"  {exc}\n"
                    f"  DATABASE_URL={_safe_database_url()}\n"
                    "  Check the credentials and that the port is not already "
                    "in use by another PostgreSQL. A native PostgreSQL on port "
                    "5432 shadows the container; publish this one on another "
                    "port with POSTGRES_PORT and update DATABASE_URL.",
                    flush=True,
                )
                return False

            if time.time() >= deadline:
                print(
                    f"[database] giving up after {attempt} attempt(s): {exc}",
                    flush=True,
                )
                return False

            print(
                f"[database] waiting for database "
                f"(attempt {attempt}): {exc.__class__.__name__}",
                flush=True,
            )
            time.sleep(interval)


def create_tables() -> None:
    Base.metadata.create_all(bind=engine)