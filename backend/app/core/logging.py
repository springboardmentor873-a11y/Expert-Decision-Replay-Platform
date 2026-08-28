import logging
from logging.config import dictConfig

from app.core.config import settings


def configure_logging() -> None:
    dictConfig(
        {
            "version": 1,
            "disable_existing_loggers": False,
            "formatters": {
                "default": {
                    "format": "%(asctime)s | %(levelname)s | %(name)s | %(message)s",
                }
            },
            "handlers": {
                "console": {
                    "class": "logging.StreamHandler",
                    "formatter": "default",
                }
            },
            "root": {
                "level": settings.log_level.upper(),
                "handlers": ["console"],
            },
            "loggers": {
                "uvicorn": {"level": settings.log_level.upper(), "propagate": True},
                "sqlalchemy.engine": {
                    "level": "WARNING" if not settings.debug else "INFO",
                    "propagate": True,
                },
            },
        }
    )
    logging.getLogger(__name__).debug("Logging configured for %s", settings.environment)
