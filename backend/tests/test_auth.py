import pytest
from fastapi.testclient import TestClient


def test_register_employee_success(client: TestClient) -> None:
    res = client.post(
        "/api/v1/auth/register",
        json={
            "email": "new_user@example.com",
            "password": "SecurePassword123!",
            "full_name": "New User",
            "job_title": "Software Engineer",
            "department": "Engineering",
            "phone": "+1-555-9999",
        },
    )
    assert res.status_code == 201
    data = res.json()
    assert data["email"] == "new_user@example.com"
    assert data["role"]["code"] == "employee"
    assert data["profile"]["full_name"] == "New User"


def test_register_duplicate_email_fails(client: TestClient) -> None:
    payload = {
        "email": "duplicate@example.com",
        "password": "SecurePassword123!",
        "full_name": "Duplicate User",
    }
    r1 = client.post("/api/v1/auth/register", json=payload)
    assert r1.status_code == 201

    r2 = client.post("/api/v1/auth/register", json=payload)
    assert r2.status_code == 409
    assert "already registered" in r2.json()["message"]


def test_login_success_and_me(client: TestClient) -> None:
    email = "login_test@example.com"
    pwd = "MySecretPassword123!"
    client.post(
        "/api/v1/auth/register",
        json={"email": email, "password": pwd, "full_name": "Login Tester"},
    )

    login_res = client.post(
        "/api/v1/auth/login",
        json={"email": email, "password": pwd},
    )
    assert login_res.status_code == 200
    token_data = login_res.json()
    assert "access_token" in token_data
    assert "refresh_token" in token_data

    # Test /me endpoint
    headers = {"Authorization": f"Bearer {token_data['access_token']}"}
    me_res = client.get("/api/v1/auth/me", headers=headers)
    assert me_res.status_code == 200
    assert me_res.json()["email"] == email


def test_login_invalid_password(client: TestClient) -> None:
    res = client.post(
        "/api/v1/auth/login",
        json={"email": "login_test@example.com", "password": "WrongPassword!"},
    )
    assert res.status_code == 401


def test_refresh_token(client: TestClient) -> None:
    email = "refresh_test@example.com"
    pwd = "MySecretPassword123!"
    client.post("/api/v1/auth/register", json={"email": email, "password": pwd, "full_name": "Refresh User"})
    login_res = client.post("/api/v1/auth/login", json={"email": email, "password": pwd})
    refresh_tok = login_res.json()["refresh_token"]

    ref_res = client.post("/api/v1/auth/refresh", json={"refresh_token": refresh_tok})
    assert ref_res.status_code == 200
    assert "access_token" in ref_res.json()
