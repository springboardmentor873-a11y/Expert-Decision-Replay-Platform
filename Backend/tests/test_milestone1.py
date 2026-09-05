def test_root(client):
    resp = client.get("/")
    assert resp.status_code == 200


def test_register_and_login(client):
    resp = client.post(
        "/register",
        json={
            "full_name": "Regular Employee",
            "email": "regular@edrp-test.com",
            "password": "password123",
            "role_name": "employee",
        },
    )
    assert resp.status_code == 201
    body = resp.json()
    assert body["email"] == "regular@edrp-test.com"
    assert "hashed_password" not in body

    resp = client.post(
        "/login", json={"email": "regular@edrp-test.com", "password": "password123"}
    )
    assert resp.status_code == 200
    assert "access_token" in resp.json()


def test_duplicate_email_rejected(client):
    payload = {
        "full_name": "Dup",
        "email": "dup@edrp-test.com",
        "password": "password123",
        "role_name": "employee",
    }
    first = client.post("/register", json=payload)
    second = client.post("/register", json=payload)
    assert first.status_code == 201
    assert second.status_code == 400


def test_wrong_password_rejected(client):
    client.post(
        "/register",
        json={
            "full_name": "Wrong Pw",
            "email": "wrongpw@edrp-test.com",
            "password": "correctpassword",
            "role_name": "employee",
        },
    )
    resp = client.post(
        "/login", json={"email": "wrongpw@edrp-test.com", "password": "incorrect"}
    )
    assert resp.status_code == 401


def test_me_and_profile_update(client, employee_headers):
    resp = client.get("/me", headers=employee_headers)
    assert resp.status_code == 200
    assert resp.json()["email"] == "employee@edrp-test.com"

    resp = client.put("/me/profile", json={"department": "Engineering"}, headers=employee_headers)
    assert resp.status_code == 200
    assert resp.json()["department"] == "Engineering"


def test_admin_only_user_listing(client, auth_headers, employee_headers):
    resp = client.get("/users", headers=auth_headers)
    assert resp.status_code == 200
    assert len(resp.json()) >= 1

    resp = client.get("/users", headers=employee_headers)
    assert resp.status_code == 403


def test_team_creation_and_assignment(client, auth_headers, employee_headers):
    resp = client.post("/teams", json={"name": "Platform Team"}, headers=auth_headers)
    assert resp.status_code == 201 or resp.status_code == 200
    team_id = resp.json()["id"]

    me = client.get("/me", headers=employee_headers).json()
    resp = client.put(
        f"/teams/assign/{me['id']}", json={"team_id": team_id}, headers=auth_headers
    )
    assert resp.status_code == 200
