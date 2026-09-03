"""
Everything related to keeping passwords and login sessions secure.

- Passwords are never stored as plain text — only their bcrypt hash.
- Login issues two tokens: a short-lived access token (used on every
  request) and a longer-lived refresh token (used only to get a new
  access token, and stored server-side so it can be revoked / logged out).
"""
import uuid
from datetime import datetime, timedelta, timezone

from jose import JWTError, jwt
from passlib.context import CryptContext

from app.core.config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def create_access_token(subject: str, role: str) -> str:
    """
    Creates a short-lived JWT. `subject` is the user's id, `role` is
    embedded so we don't need a DB lookup on every request just to
    check permissions.
    """
    expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    payload = {"sub": subject, "role": role, "type": "access", "exp": expire}
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def create_refresh_token(subject: str) -> tuple[str, str, datetime]:
    """
    Creates a refresh token. Returns (token, jti, expires_at) — the jti
    (a random unique id) is what we store in the database, not the raw
    token, so a stolen database dump can't be replayed as a login token.
    """
    jti = str(uuid.uuid4())
    expire = datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    payload = {"sub": subject, "jti": jti, "type": "refresh", "exp": expire}
    token = jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return token, jti, expire


def decode_token(token: str) -> dict | None:
    try:
        return jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
    except JWTError:
        return None
