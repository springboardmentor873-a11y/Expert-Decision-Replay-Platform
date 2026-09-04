# Backend — Expert Decision Replay Platform (Milestone 1)

FastAPI backend using `mysql-connector-python` directly (no ORM), JWT
authentication, and bcrypt password hashing.

## Quick Start

```bash
cd backend
python -m venv .venv

# Activate it:
# Windows:
.venv\Scripts\activate
# macOS/Linux:
source .venv/bin/activate

pip install -r requirements.txt

cp .env.example .env
# Edit .env: set DB_PASSWORD and JWT_SECRET_KEY

uvicorn app.main:app --reload
```

Then open http://127.0.0.1:8000/docs for interactive Swagger docs, or
http://127.0.0.1:8000/health to confirm the API and database are up.

See the root `README.md` for full MySQL setup and frontend
instructions.
