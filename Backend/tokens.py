"""Signed access tokens for API authentication.

The API used to trust a `user_id` query parameter as the caller's identity,
which meant anyone could act as any user by changing a number in the URL.
Identity now comes from a short-lived signed token issued by `/login` and sent
back in the `Authorization: Bearer` header.
"""

from __future__ import annotations

import logging
import os
import secrets
import uuid
from datetime import datetime, timedelta, timezone
from typing import Any

import jwt

logger = logging.getLogger(__name__)

ALGORITHM = "HS256"
ISSUER = "expert-decision-replay-platform"
AUDIENCE = "expert-decision-replay-api"

DEFAULT_TTL_MINUTES = 480
MIN_TTL_MINUTES = 1
MAX_TTL_MINUTES = 60 * 24 * 30

# A generated fallback keeps local development working, but it changes on every
# restart, so a restart invalidates outstanding sessions instead of silently
# trusting a hard-coded secret that may have been committed.
_EPHEMERAL_SECRET = secrets.token_urlsafe(48)


class TokenConfigurationError(RuntimeError):
    """Raised when the signing secret is unusable in the current environment."""


def env_flag(name: str, default: bool = False) -> bool:
    raw = os.getenv(name)
    if raw is None or raw == "":
        return default
    return raw.strip().lower() in {"1", "true", "yes", "on"}


def get_signing_secret() -> str:
    """Resolve the HMAC signing secret, refusing weak production settings."""

    secret = (os.getenv("JWT_SECRET") or "").strip()
    environment = (os.getenv("APP_ENV") or "development").strip().lower()

    if not secret:
        if environment in {"production", "prod"}:
            raise TokenConfigurationError(
                "JWT_SECRET must be set when APP_ENV is 'production'. "
                "Generate one with: python -c \"import secrets; print(secrets.token_urlsafe(48))\""
            )
        logger.warning(
            "JWT_SECRET is not set; using an ephemeral development secret. "
            "All sessions will be invalidated when the API restarts."
        )
        return _EPHEMERAL_SECRET

    if len(secret) < 32:
        raise TokenConfigurationError(
            "JWT_SECRET must be at least 32 characters long."
        )

    return secret


def get_ttl_minutes() -> int:
    raw = os.getenv("JWT_TTL_MINUTES")
    if not raw:
        return DEFAULT_TTL_MINUTES

    try:
        value = int(raw)
    except ValueError:
        logger.warning("JWT_TTL_MINUTES=%r is not a number; using default.", raw)
        return DEFAULT_TTL_MINUTES

    return max(MIN_TTL_MINUTES, min(MAX_TTL_MINUTES, value))


def create_access_token(
    *,
    user_id: int,
    email: str,
    role: str,
    ttl_minutes: int | None = None,
) -> tuple[str, int]:
    """Issue a signed access token. Returns the token and its lifetime."""

    ttl = ttl_minutes if ttl_minutes is not None else get_ttl_minutes()
    issued_at = datetime.now(timezone.utc)
    expires_at = issued_at + timedelta(minutes=ttl)

    claims: dict[str, Any] = {
        "sub": str(user_id),
        "email": email,
        "role": role,
        "iss": ISSUER,
        "aud": AUDIENCE,
        "iat": int(issued_at.timestamp()),
        "nbf": int(issued_at.timestamp()),
        "exp": int(expires_at.timestamp()),
        "jti": uuid.uuid4().hex,
    }

    token = jwt.encode(claims, get_signing_secret(), algorithm=ALGORITHM)
    return token, ttl * 60


def decode_access_token(token: str) -> dict[str, Any]:
    """Validate a token's signature, lifetime and registered claims."""

    try:
        return jwt.decode(
            token,
            get_signing_secret(),
            algorithms=[ALGORITHM],
            audience=AUDIENCE,
            issuer=ISSUER,
            options={"require": ["exp", "iat", "sub", "iss", "aud"]},
        )
    except jwt.ExpiredSignatureError as exc:
        raise ValueError("Session expired") from exc
    except jwt.InvalidTokenError as exc:
        raise ValueError("Invalid session token") from exc
