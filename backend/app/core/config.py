"""
Central place for all app settings.

Nothing is hardcoded here — every value is read from environment variables
(see .env.example). This means the same code runs in dev, staging, and
production just by swapping the .env file / environment.
"""
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # --- App ---
    APP_NAME: str = "Expert Decision Replay Platform"
    ENVIRONMENT: str = "development"  # development | staging | production
    DEBUG: bool = True

    # --- Database ---
    # Example: postgresql+asyncpg://user:password@localhost:5432/decision_platform
    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/decision_platform"

    # --- Security / JWT ---
    SECRET_KEY: str = "CHANGE_ME_IN_PRODUCTION"  # overridden by .env in real use
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # --- CORS ---
    # Comma-separated list of allowed frontend origins
    CORS_ORIGINS: str = "http://localhost:5173,http://localhost:3000"

    # --- File storage ---
    # Local disk for now (milestone 2). Swappable for S3/MinIO later without
    # changing any router code — only file_service.py would need to change.
    STORAGE_DIR: str = "storage/attachments"
    MAX_UPLOAD_SIZE_MB: int = 20

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    @property
    def cors_origins_list(self) -> list[str]:
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]


# Import this single instance everywhere instead of re-reading env vars
settings = Settings()
