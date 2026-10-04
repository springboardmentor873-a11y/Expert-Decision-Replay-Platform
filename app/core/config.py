from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "Expert Decision Replay Platform"
    app_version: str = "1.0.0"

    database_url: str

    jwt_secret_key: str
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 60

    allowed_origins: str = "http://localhost:5173,http://127.0.0.1:5173"

    upload_dir: str = "uploads"
    max_upload_size_mb: int = 20

    sla_grace_period_hours: int = 24

    EMAIL_ENABLED: bool = False
    SMTP_HOST: str = "localhost"
    SMTP_PORT: int = 25
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    SMTP_FROM: str = "noreply@example.com"

    @property
    def cors_origins(self) -> list[str]:
        return [
            origin.strip()
            for origin in self.allowed_origins.split(",")
            if origin.strip()
        ]

    model_config = SettingsConfigDict(
        env_file=".env",
        extra="ignore"
    )


settings = Settings()
