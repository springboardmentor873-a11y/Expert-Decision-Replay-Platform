"""Authentication: registration, login, refresh."""
from app.models import RoleEnum
from tests.conftest import make_user


def test_register_success(client):
    resp = client.post("/api/auth/register", json={
        "full_name": "Priya Employee",
        "email": "priya@example.com",
        "password": "EmployeePass123!",
        "job_title": "Business Analyst",
        "department": "Operations",
    })
    assert resp.status_code == 201
    body = resp.json()
    assert body["role"] == "employee"
    assert "hashed_password" not in body
    assert "password" not in body


def test_register_normalizes_email_case(client):
    client.post("/api/auth/register", json={
        "full_name": "Case Test", "email": "Mixed.Case@Example.com", "password": "SomePass123!",
    })
    resp = client.post("/api/auth/login", json={"email": "mixed.case@example.com", "password": "SomePass123!"})
    assert resp.status_code == 200


def test_register_duplicate_email_rejected(client):
    payload = {"full_name": "Ana Duplicate", "email": "dup@example.com", "password": "SomePass123!"}
    first = client.post("/api/auth/register", json=payload)
    assert first.status_code == 201
    second = client.post("/api/auth/register", json=payload)
    assert second.status_code == 409


def test_register_short_password_rejected(client):
    resp = client.post("/api/auth/register", json={
        "full_name": "Short Password", "email": "shortpw@example.com", "password": "short",
    })
    assert resp.status_code == 422


def test_login_success(client, db_session):
    make_user(db_session, "login@example.com", "CorrectPass123!")
    resp = client.post("/api/auth/login", json={"email": "login@example.com", "password": "CorrectPass123!"})
    assert resp.status_code == 200
    body = resp.json()
    assert "access_token" in body and "refresh_token" in body


def test_login_wrong_password_rejected(client, db_session):
    make_user(db_session, "wrongpw@example.com", "CorrectPass123!")
    resp = client.post("/api/auth/login", json={"email": "wrongpw@example.com", "password": "WrongPass!"})
    assert resp.status_code == 401


def test_login_unknown_email_rejected(client):
    resp = client.post("/api/auth/login", json={"email": "nobody@example.com", "password": "whatever123"})
    assert resp.status_code == 401


def test_inactive_user_cannot_login(client, db_session):
    make_user(db_session, "inactive@example.com", "CorrectPass123!", is_active=False)
    resp = client.post("/api/auth/login", json={"email": "inactive@example.com", "password": "CorrectPass123!"})
    assert resp.status_code == 403


def test_refresh_token_issues_new_access_token(client, db_session):
    make_user(db_session, "refresh@example.com", "CorrectPass123!")
    login = client.post("/api/auth/login", json={"email": "refresh@example.com", "password": "CorrectPass123!"})
    refresh_token = login.json()["refresh_token"]

    resp = client.post("/api/auth/refresh", json={"refresh_token": refresh_token})
    assert resp.status_code == 200
    assert "access_token" in resp.json()


def test_refresh_rejects_access_token_used_as_refresh(client, db_session):
    make_user(db_session, "wrongtype@example.com", "CorrectPass123!")
    login = client.post("/api/auth/login", json={"email": "wrongtype@example.com", "password": "CorrectPass123!"})
    access_token = login.json()["access_token"]

    resp = client.post("/api/auth/refresh", json={"refresh_token": access_token})
    assert resp.status_code == 401


def test_refresh_rejects_garbage_token(client):
    resp = client.post("/api/auth/refresh", json={"refresh_token": "not-a-real-token"})
    assert resp.status_code == 401


def test_refresh_respects_role_change_since_token_was_issued(client, db_session):
    user = make_user(db_session, "promoted@example.com", "CorrectPass123!", role=RoleEnum.EMPLOYEE)
    login = client.post("/api/auth/login", json={"email": "promoted@example.com", "password": "CorrectPass123!"})
    refresh_token = login.json()["refresh_token"]

    user.role = RoleEnum.ADMINISTRATOR
    db_session.commit()

    resp = client.post("/api/auth/refresh", json={"refresh_token": refresh_token})
    assert resp.status_code == 200
    new_access = resp.json()["access_token"]

    me = client.get("/api/users/me", headers={"Authorization": f"Bearer {new_access}"})
    assert me.status_code == 200
    assert me.json()["role"] == "administrator"


def test_logout_requires_auth_and_is_recorded(client, db_session):
    make_user(db_session, "logout@example.com", "CorrectPass123!")
    login = client.post("/api/auth/login", json={"email": "logout@example.com", "password": "CorrectPass123!"})
    token = login.json()["access_token"]

    unauth = client.post("/api/auth/logout")
    assert unauth.status_code == 401

    resp = client.post("/api/auth/logout", headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 200
