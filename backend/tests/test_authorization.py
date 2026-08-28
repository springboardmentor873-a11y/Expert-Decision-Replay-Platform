import pytest
from fastapi.testclient import TestClient


def test_employee_cannot_access_audit_logs(
    client: TestClient,
    employee_user: tuple,
) -> None:
    _, _, headers = employee_user
    res = client.get("/api/v1/audit", headers=headers)
    assert res.status_code == 403


def test_admin_can_access_audit_logs(
    client: TestClient,
    admin_user: tuple,
) -> None:
    _, _, headers = admin_user
    res = client.get("/api/v1/audit", headers=headers)
    assert res.status_code == 200
    assert isinstance(res.json(), list)


def test_admin_can_assign_roles(
    client: TestClient,
    admin_user: tuple,
) -> None:
    _, _, admin_headers = admin_user

    # Register a new test user
    reg_res = client.post(
        "/api/v1/auth/register",
        json={"email": "role_target@edrp.org", "password": "Password123!", "full_name": "Target User"},
    )
    assert reg_res.status_code == 201
    target_id = reg_res.json()["id"]

    res = client.patch(
        f"/api/v1/users/{target_id}/role",
        json={"role_code": "reviewer"},
        headers=admin_headers,
    )
    assert res.status_code == 200
    assert res.json()["role"]["code"] == "reviewer"


def test_employee_cannot_assign_roles(
    client: TestClient,
    employee_user: tuple,
) -> None:
    emp_user, _, emp_headers = employee_user

    res = client.patch(
        f"/api/v1/users/{emp_user.id}/role",
        json={"role_code": "administrator"},
        headers=emp_headers,
    )
    assert res.status_code == 403
