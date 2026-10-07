import os
from functools import lru_cache
from pathlib import Path

from pydantic import Field, computed_field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

BACKEND_ROOT = Path(__file__).resolve().parents[2]
ENV_FILE = BACKEND_ROOT / ".env"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=ENV_FILE if ENV_FILE.exists() else ".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    app_name: str = "Expert Decision Replay Platform"
    environment: str = "development"
    debug: bool = False
    log_level: str = "INFO"

    secret_key: str = Field(
        default="enterprise-secret-key-for-local-development-min-32-chars",
        min_length=16,
    )
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    refresh_token_expire_days: int = 7

    database_url: str = "sqlite:///./edrp.db"
    cors_origins: str = "http://localhost:5173,http://localhost:3000"
    cors_origin_regex: str | None = None

    auto_init_db: bool | None = None
    auto_seed_db: bool | None = None

    @field_validator("environment", mode="before")
    @classmethod
    def resolve_environment(cls, v: str | None) -> str:
        if v:
            return v
        return os.getenv("VERCEL_ENV", "development")

    @field_validator("database_url", mode="before")
    @classmethod
    def normalize_database_url(cls, v: str | None) -> str:
        if not v:
            return "sqlite:///./edrp.db"
        url = v.strip()
        # Convert postgres:// or bare postgresql:// to postgresql+psycopg:// for SQLAlchemy 2.0 + psycopg 3
        if url.startswith("postgres://"):
            url = url.replace("postgres://", "postgresql+psycopg://", 1)
        elif url.startswith("postgresql://") and not url.startswith("postgresql+"):
            url = url.replace("postgresql://", "postgresql+psycopg://", 1)
        return url

    @computed_field
    @property
    def cors_origin_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]

    @property
    def is_development(self) -> bool:
        return self.environment.lower() in {"development", "dev", "local"}

    @property
    def should_init_db(self) -> bool:
        if self.auto_init_db is not None:
            return self.auto_init_db
        return self.is_development

    @property
    def should_seed_db(self) -> bool:
        if self.auto_seed_db is not None:
            return self.auto_seed_db
        return self.is_development


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
