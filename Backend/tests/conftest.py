import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Point the app at an in-memory SQLite DB and a fake secret BEFORE importing
# main, so the real .env / Postgres config is never required for tests.
os.environ.setdefault("DATABASE_URL", "sqlite://")
os.environ.setdefault("SECRET_KEY", "test-secret-key")

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

import database.database as dbmod

TEST_DATABASE_URL = "sqlite://"  # in-memory, shared across the session

dbmod.DATABASE_URL = TEST_DATABASE_URL
dbmod.engine = create_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
dbmod.SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=dbmod.engine)

from fastapi.testclient import TestClient  # noqa: E402
from main import app, seed_default_roles  # noqa: E402
from database.database import Base, engine, SessionLocal  # noqa: E402


@pytest.fixture(scope="session", autouse=True)
def _setup_database():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    seed_default_roles(db)
    db.close()
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture(scope="session")
def client():
    return TestClient(app)


def _register_and_login(client, email, role_name, full_name="Test User"):
    client.post(
        "/register",
        json={
            "full_name": full_name,
            "email": email,
            "password": "password123",
            "role_name": role_name,
        },
    )
    resp = client.post("/login", json={"email": email, "password": "password123"})
    return resp.json()["access_token"]


@pytest.fixture(scope="session")
def admin_token(client):
    return _register_and_login(client, "admin@edrp-test.com", "administrator", "Admin User")


@pytest.fixture(scope="session")
def employee_token(client):
    return _register_and_login(client, "employee@edrp-test.com", "employee", "Employee User")


@pytest.fixture(scope="session")
def manager_token(client):
    return _register_and_login(client, "manager@edrp-test.com", "manager", "Manager User")


@pytest.fixture(scope="session")
def auth_headers(admin_token):
    return {"Authorization": f"Bearer {admin_token}"}


@pytest.fixture(scope="session")
def employee_headers(employee_token):
    return {"Authorization": f"Bearer {employee_token}"}
