from sqlalchemy.engine import Engine
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.db.session import engine


def database_is_reachable(bind: Engine | None = None) -> bool:
    target = bind or engine
    try:
        with target.connect() as connection:
            connection.execute(text("SELECT 1"))
        return True
    except Exception:
        return False


def ping_session(db: Session) -> None:
    db.execute(text("SELECT 1"))
