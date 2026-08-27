from typing import List

from pydantic_settings import BaseSettings
from pydantic import field_validator


class Settings(BaseSettings):
    PROJECT_NAME: str = "Expert Decision Replay Platform"
    ENV: str = "development"

    DATABASE_URL: str = "postgresql+psycopg2://postgres:postgres@localhost:5432/decision_replay"

    SECRET_KEY: str = "dev-secret-change-me"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # Comma-separated list of allowed origins for CORS, e.g.
    # "http://localhost:5173,https://app.example.com"
    ALLOWED_ORIGINS: str = "http://localhost:5173"

    # Used only by scripts/seed_admin.py — never hardcode production credentials.
    SEED_ADMIN_EMAIL: str = "admin@decisionreplay.example.com"
    SEED_ADMIN_PASSWORD: str = "ChangeMe123!"
    SEED_ADMIN_FULL_NAME: str = "System Administrator"

    @field_validator("SECRET_KEY")
    @classmethod
    def warn_default_secret(cls, v: str) -> str:
        return v

    @property
    def cors_origins(self) -> List[str]:
        return [o.strip() for o in self.ALLOWED_ORIGINS.split(",") if o.strip()]

    class Config:
        env_file = ".env"


settings = Settings()
