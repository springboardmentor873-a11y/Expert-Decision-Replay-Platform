"""Role-based access control across all four roles, plus audit trail coverage."""
import pytest
from app.models import RoleEnum
from tests.conftest import make_user, auth_headers

ADMIN_ONLY_ENDPOINTS = [
    ("GET", "/api/audit"),
]


@pytest.mark.parametrize("role", [RoleEnum.EMPLOYEE, RoleEnum.REVIEWER, RoleEnum.MANAGER])
def test_non_admin_roles_cannot_read_audit_log(client, db_session, role):
    make_user(db_session, f"{role.value}@example.com", "CorrectPass123!", role=role)
    headers = auth_headers(client, f"{role.value}@example.com", "CorrectPass123!")
    resp = client.get("/api/audit", headers=headers)
    assert resp.status_code == 403


def test_administrator_can_read_audit_log(client, db_session):
    make_user(db_session, "auditor@example.com", "CorrectPass123!", role=RoleEnum.ADMINISTRATOR)
    headers = auth_headers(client, "auditor@example.com", "CorrectPass123!")
    client.post("/api/auth/logout", headers=headers)  # generates at least one audit row

    resp = client.get("/api/audit", headers=headers)
    assert resp.status_code == 200
    assert isinstance(resp.json(), list)
    assert len(resp.json()) >= 1


def test_reviewer_cannot_perform_administrator_actions(client, db_session):
    target = make_user(db_session, "reviewtarget@example.com", "CorrectPass123!")
    make_user(db_session, "reviewer2@example.com", "CorrectPass123!", role=RoleEnum.REVIEWER)
    headers = auth_headers(client, "reviewer2@example.com", "CorrectPass123!")

    resp = client.patch(f"/api/users/{target.id}/role", json={"role": "manager"}, headers=headers)
    assert resp.status_code == 403


def test_manager_cannot_perform_administrator_only_actions(client, db_session):
    target = make_user(db_session, "mgrtarget@example.com", "CorrectPass123!")
    make_user(db_session, "manager8@example.com", "CorrectPass123!", role=RoleEnum.MANAGER)
    headers = auth_headers(client, "manager8@example.com", "CorrectPass123!")

    resp = client.patch(f"/api/users/{target.id}/deactivate", headers=headers)
    assert resp.status_code == 403


def test_administrator_can_perform_administrator_actions(client, db_session):
    target = make_user(db_session, "admintarget@example.com", "CorrectPass123!")
    make_user(db_session, "topadmin@example.com", "CorrectPass123!", role=RoleEnum.ADMINISTRATOR)
    headers = auth_headers(client, "topadmin@example.com", "CorrectPass123!")

    resp = client.patch(f"/api/users/{target.id}/role", json={"role": "manager"}, headers=headers)
    assert resp.status_code == 200


def test_invalid_or_missing_token_rejected(client):
    resp = client.get("/api/users/me", headers={"Authorization": "Bearer garbage.token.value"})
    assert resp.status_code == 401


def test_audit_log_records_registration_and_login(client, db_session):
    make_user(db_session, "watcher@example.com", "CorrectPass123!", role=RoleEnum.ADMINISTRATOR)
    headers = auth_headers(client, "watcher@example.com", "CorrectPass123!")

    client.post("/api/auth/register", json={
        "full_name": "New Person", "email": "newperson@example.com", "password": "CorrectPass123!",
    })
    client.post("/api/auth/login", json={"email": "newperson@example.com", "password": "CorrectPass123!"})

    logs = client.get("/api/audit", headers=headers).json()
    actions = {row["action"] for row in logs}
    assert "user_registered" in actions
    assert "login" in actions


def test_audit_log_records_role_change_and_deactivation(client, db_session):
    target = make_user(db_session, "watched@example.com", "CorrectPass123!")
    make_user(db_session, "watcher2@example.com", "CorrectPass123!", role=RoleEnum.ADMINISTRATOR)
    headers = auth_headers(client, "watcher2@example.com", "CorrectPass123!")

    client.patch(f"/api/users/{target.id}/role", json={"role": "reviewer"}, headers=headers)
    client.patch(f"/api/users/{target.id}/deactivate", headers=headers)

    logs = client.get("/api/audit", headers=headers).json()
    actions = {row["action"] for row in logs}
    assert "role_changed" in actions
    assert "user_deactivated" in actions
