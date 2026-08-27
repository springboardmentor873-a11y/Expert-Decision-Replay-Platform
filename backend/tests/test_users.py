"""User management: profile access/update, admin listing, role changes, deactivation."""
from app.models import RoleEnum
from tests.conftest import make_user, auth_headers


def test_get_my_profile(client, db_session):
    make_user(db_session, "me@example.com", "CorrectPass123!")
    headers = auth_headers(client, "me@example.com", "CorrectPass123!")
    resp = client.get("/api/users/me", headers=headers)
    assert resp.status_code == 200
    assert resp.json()["email"] == "me@example.com"


def test_get_my_profile_requires_auth(client):
    resp = client.get("/api/users/me")
    assert resp.status_code == 401


def test_update_my_profile_allows_safe_fields(client, db_session):
    make_user(db_session, "update@example.com", "CorrectPass123!")
    headers = auth_headers(client, "update@example.com", "CorrectPass123!")
    resp = client.put("/api/users/me", json={"job_title": "Senior Analyst", "department": "Finance"}, headers=headers)
    assert resp.status_code == 200
    assert resp.json()["job_title"] == "Senior Analyst"


def test_update_my_profile_cannot_change_role_or_active(client, db_session):
    make_user(db_session, "escalate@example.com", "CorrectPass123!")
    headers = auth_headers(client, "escalate@example.com", "CorrectPass123!")
    # role/is_active aren't part of UserUpdate's schema, so FastAPI ignores them
    # rather than erroring — the point is the value can never actually change.
    resp = client.put("/api/users/me", json={"role": "administrator", "is_active": False}, headers=headers)
    assert resp.status_code == 200
    assert resp.json()["role"] == "employee"
    assert resp.json()["is_active"] is True


def test_list_users_forbidden_for_employee(client, db_session):
    make_user(db_session, "plainuser@example.com", "CorrectPass123!", role=RoleEnum.EMPLOYEE)
    headers = auth_headers(client, "plainuser@example.com", "CorrectPass123!")
    resp = client.get("/api/users", headers=headers)
    assert resp.status_code == 403


def test_list_users_allowed_for_manager_and_administrator(client, db_session):
    make_user(db_session, "somebody@example.com", "CorrectPass123!", role=RoleEnum.EMPLOYEE)
    make_user(db_session, "manager@example.com", "CorrectPass123!", role=RoleEnum.MANAGER)
    make_user(db_session, "admin@example.com", "CorrectPass123!", role=RoleEnum.ADMINISTRATOR)

    for email in ("manager@example.com", "admin@example.com"):
        headers = auth_headers(client, email, "CorrectPass123!")
        resp = client.get("/api/users", headers=headers)
        assert resp.status_code == 200
        assert len(resp.json()) == 3


def test_get_user_by_id_forbidden_for_reviewer(client, db_session):
    target = make_user(db_session, "target@example.com", "CorrectPass123!")
    make_user(db_session, "reviewer@example.com", "CorrectPass123!", role=RoleEnum.REVIEWER)
    headers = auth_headers(client, "reviewer@example.com", "CorrectPass123!")
    resp = client.get(f"/api/users/{target.id}", headers=headers)
    assert resp.status_code == 403


def test_change_role_administrator_only(client, db_session):
    target = make_user(db_session, "promote-me@example.com", "CorrectPass123!", role=RoleEnum.EMPLOYEE)
    make_user(db_session, "manager2@example.com", "CorrectPass123!", role=RoleEnum.MANAGER)
    make_user(db_session, "admin2@example.com", "CorrectPass123!", role=RoleEnum.ADMINISTRATOR)

    manager_headers = auth_headers(client, "manager2@example.com", "CorrectPass123!")
    forbidden = client.patch(f"/api/users/{target.id}/role", json={"role": "reviewer"}, headers=manager_headers)
    assert forbidden.status_code == 403

    admin_headers = auth_headers(client, "admin2@example.com", "CorrectPass123!")
    ok = client.patch(f"/api/users/{target.id}/role", json={"role": "reviewer"}, headers=admin_headers)
    assert ok.status_code == 200
    assert ok.json()["role"] == "reviewer"


def test_deactivate_user_administrator_only(client, db_session):
    target = make_user(db_session, "deactivate-me@example.com", "CorrectPass123!")
    make_user(db_session, "admin3@example.com", "CorrectPass123!", role=RoleEnum.ADMINISTRATOR)
    headers = auth_headers(client, "admin3@example.com", "CorrectPass123!")

    resp = client.patch(f"/api/users/{target.id}/deactivate", headers=headers)
    assert resp.status_code == 200
    assert resp.json()["is_active"] is False


def test_deactivated_user_cannot_login(client, db_session):
    target = make_user(db_session, "getskicked@example.com", "CorrectPass123!")
    make_user(db_session, "admin4@example.com", "CorrectPass123!", role=RoleEnum.ADMINISTRATOR)
    headers = auth_headers(client, "admin4@example.com", "CorrectPass123!")
    client.patch(f"/api/users/{target.id}/deactivate", headers=headers)

    resp = client.post("/api/auth/login", json={"email": "getskicked@example.com", "password": "CorrectPass123!"})
    assert resp.status_code == 403


def test_administrator_cannot_deactivate_self(client, db_session):
    make_user(db_session, "selfdeactivate@example.com", "CorrectPass123!", role=RoleEnum.ADMINISTRATOR)
    headers = auth_headers(client, "selfdeactivate@example.com", "CorrectPass123!")
    me = client.get("/api/users/me", headers=headers).json()

    resp = client.patch(f"/api/users/{me['id']}/deactivate", headers=headers)
    assert resp.status_code == 400


def test_get_nonexistent_user_returns_404(client, db_session):
    make_user(db_session, "admin5@example.com", "CorrectPass123!", role=RoleEnum.ADMINISTRATOR)
    headers = auth_headers(client, "admin5@example.com", "CorrectPass123!")
    resp = client.get("/api/users/00000000-0000-0000-0000-000000000000", headers=headers)
    assert resp.status_code == 404
