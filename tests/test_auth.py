from tests.conftest import login, auth_headers


def test_register_creates_employee(client):
    r = client.post("/auth/register", json={
        "full_name": "New Person",
        "email": "newperson@example.com",
        "password": "SecurePass1",
        "employee_id": "REG001",
        "department": "IT",
        "designation": "Analyst",
        "phone_number": "9998887777",
    })
    assert r.status_code == 201
    body = r.json()
    assert body["role"] == "Employee"
    assert "password" not in body


def test_register_duplicate_email_conflict(client):
    payload = {
        "full_name": "Dup",
        "email": "dup@example.com",
        "password": "SecurePass1",
        "employee_id": "REG002",
        "department": "IT",
        "designation": "Analyst",
        "phone_number": "9998887778",
    }
    r1 = client.post("/auth/register", json=payload)
    assert r1.status_code == 201
    payload["employee_id"] = "REG003"
    r2 = client.post("/auth/register", json=payload)
    assert r2.status_code == 409


def test_login_success(client, employee):
    token = login(client, employee.email)
    assert token


def test_login_wrong_password(client, employee):
    r = client.post("/auth/login", data={
        "username": employee.email,
        "password": "WrongPassword",
    })
    assert r.status_code == 401


def test_login_nonexistent_user(client):
    r = client.post("/auth/login", data={
        "username": "nobody@example.com",
        "password": "whatever",
    })
    assert r.status_code == 401


def test_protected_endpoint_without_token(client):
    r = client.get("/users/me")
    assert r.status_code == 401


def test_protected_endpoint_invalid_token(client):
    r = client.get("/users/me", headers=auth_headers("not-a-real-token"))
    assert r.status_code == 401


def test_get_my_profile(client, employee):
    token = login(client, employee.email)
    r = client.get("/users/me", headers=auth_headers(token))
    assert r.status_code == 200
    assert r.json()["email"] == employee.email
