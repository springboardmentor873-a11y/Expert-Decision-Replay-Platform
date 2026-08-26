from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    PROJECT_NAME: str = "Expert Decision Replay Platform"
    VERSION: str = "0.1.0"
    API_V1_STR: str = "/api/v1"

    # CORS Origins
    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]

    # Database Configuration
    DATABASE_URL: str = "postgresql://postgres:postgres@localhost:5432/expert_decision_db"

    # Security & JWT Configuration
    SECRET_KEY: str = "dev_secret_key_expert_decision_replay_platform_2026"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 1 day in minutes

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore"
    )


settings = Settings()