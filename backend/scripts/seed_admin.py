"""
Bootstrap the first Administrator account.

Credentials come from environment variables (see backend/.env), never from
hardcoded constants in this file, so nothing sensitive ends up committed to
source control.

Usage (from backend/):
    python -m scripts.seed_admin

Environment variables (see .env.example):
    SEED_ADMIN_EMAIL       default: admin@decisionreplay.example.com
    SEED_ADMIN_PASSWORD    default: ChangeMe123!   (change immediately after first login)
    SEED_ADMIN_FULL_NAME   default: System Administrator
"""
import sys
from pathlib import Path

sys.path.append(str(Path(__file__).resolve().parents[1]))

from app.config import settings
from app.database import SessionLocal
from app.models import User, RoleEnum
from app.auth import hash_password


def seed():
    db = SessionLocal()
    try:
        email = settings.SEED_ADMIN_EMAIL.strip().lower()
        existing = db.query(User).filter(User.email == email).first()
        if existing:
            print(f"Administrator already exists: {email}")
            return

        admin = User(
            full_name=settings.SEED_ADMIN_FULL_NAME,
            email=email,
            hashed_password=hash_password(settings.SEED_ADMIN_PASSWORD),
            role=RoleEnum.ADMINISTRATOR,
            is_active=True,
            is_verified=True,
        )
        db.add(admin)
        db.commit()
        print(f"Created Administrator: {email}")
        print("Log in and change this password immediately — it was read from SEED_ADMIN_PASSWORD.")
    finally:
        db.close()


if __name__ == "__main__":
    seed()
