#!/usr/bin/env sh
set -e

echo "Waiting for the database to accept connections..."
python - << 'PYEOF'
import time
import sys

from sqlalchemy import create_engine, text
from app.config import settings

deadline = time.time() + 60
last_error = None

while time.time() < deadline:
    try:
        engine = create_engine(settings.DATABASE_URL)
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        print("Database is ready.")
        sys.exit(0)
    except Exception as exc:  # noqa: BLE001
        last_error = exc
        time.sleep(1)

print(f"Database never became ready: {last_error}", file=sys.stderr)
sys.exit(1)
PYEOF

echo "Running database migrations (alembic upgrade head)..."
alembic upgrade head

echo "Starting API server..."
exec uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
