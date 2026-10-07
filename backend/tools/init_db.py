"""Database bootstrap and verification script for Expert Decision Replay Platform.

Can be run locally or against a remote hosted PostgreSQL database by setting DATABASE_URL:
    python tools/init_db.py [--seed]
"""

import argparse
import logging
import sys
from pathlib import Path

# Add backend directory to sys.path
backend_dir = Path(__file__).resolve().parent.parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from app.core.config import settings
from app.db.base import Base
from app.db.health import database_is_reachable
from app.db.seed import seed_database
from app.db.session import engine

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)


def init_db(seed: bool = True) -> bool:
    logger.info("Target Environment: %s", settings.environment)
    logger.info("Checking database reachability...")

    if not database_is_reachable():
        logger.error(
            "Database is unreachable. Please verify DATABASE_URL and network connectivity."
        )
        return False

    logger.info("Database reachable. Creating tables from SQLAlchemy models...")
    try:
        Base.metadata.create_all(bind=engine)
        logger.info("Tables created / verified successfully.")
    except Exception as e:
        logger.error("Failed to create tables: %s", e)
        return False

    if seed:
        logger.info("Seeding initial system roles, workflows, and demo data...")
        try:
            seed_database()
            logger.info("Seed data applied successfully.")
        except Exception as e:
            logger.error("Failed to seed database: %s", e)
            return False

    logger.info("Database initialization completed successfully!")
    return True


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Initialize database schema and seed data.")
    parser.add_argument("--no-seed", action="store_true", help="Skip seeding initial demo data")
    args = parser.parse_args()

    success = init_db(seed=not args.no_seed)
    sys.exit(0 if success else 1)
