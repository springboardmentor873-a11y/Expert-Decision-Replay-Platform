"""
Application configuration.

All sensitive values (database credentials, JWT secret) are loaded from
environment variables via a local ".env" file. Nothing sensitive is
hardcoded here. See ".env.example" for the variables that must be set.
"""

import os
from dotenv import load_dotenv

# Load variables from a ".env" file located in the backend/ directory
# (this file lives in backend/app/, so we look one directory up).
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ENV_PATH = os.path.join(BASE_DIR, ".env")
load_dotenv(dotenv_path=ENV_PATH)


class Settings:
    # ---- Database ----
    DB_HOST: str = os.getenv("DB_HOST", "localhost")
    DB_PORT: int = int(os.getenv("DB_PORT", "3306"))
    DB_USER: str = os.getenv("DB_USER", "root")
    DB_PASSWORD: str = os.getenv("DB_PASSWORD", "")
    DB_NAME: str = os.getenv("DB_NAME", "expert_decision_replay")

    # ---- JWT ----
    JWT_SECRET_KEY: str = os.getenv("JWT_SECRET_KEY", "")
    JWT_ALGORITHM: str = os.getenv("JWT_ALGORITHM", "HS256")
    JWT_EXPIRE_MINUTES: int = int(os.getenv("JWT_EXPIRE_MINUTES", "60"))

    # ---- CORS ----
    CORS_ORIGINS: list = [
        origin.strip()
        for origin in os.getenv(
            "CORS_ORIGINS",
            "http://localhost:5500,http://127.0.0.1:5500"
        ).split(",")
        if origin.strip()
    ]


settings = Settings()

if not settings.JWT_SECRET_KEY:
    raise RuntimeError(
        "JWT_SECRET_KEY is not set. Copy backend/.env.example to backend/.env "
        "and set a real secret value before starting the server."
    )
