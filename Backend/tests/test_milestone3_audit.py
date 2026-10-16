"""Milestone 3 - Audit & Compliance module tests."""


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
    token = resp.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def test_register_and_login_create_audit_entries(client):
    headers = _register_and_login(client, "audit.user@example.com", "employee")

    # Log in as an administrator to read the trail (need one to exist first)
    admin_headers = _register_and_login(client, "audit.admin@example.com", "administrator")

    resp = client.get("/audit-logs", headers=admin_headers)
    assert resp.status_code == 200
    actions = [entry["action"] for entry in resp.json()]
    assert "auth.register" in actions
    assert "auth.login_success" in actions


def test_failed_login_is_logged(client):
    admin_headers = _register_and_login(client, "audit.admin2@example.com", "administrator")
    client.post(
        "/login", json={"email": "audit.admin2@example.com", "password": "wrong-password"}
    )

    resp = client.get("/audit-logs?action=auth.login_failed", headers=admin_headers)
    assert resp.status_code == 200
    assert len(resp.json()) >= 1


def test_non_admin_cannot_read_audit_logs(client):
    headers = _register_and_login(client, "audit.employee@example.com", "employee")
    resp = client.get("/audit-logs", headers=headers)
    assert resp.status_code == 403


def test_decision_lifecycle_is_logged(client):
    manager_headers = _register_and_login(client, "audit.manager@example.com", "manager")
    admin_headers = _register_and_login(client, "audit.admin3@example.com", "administrator")

    create_resp = client.post(
        "/decisions",
        json={
            "title": "Migrate to Kubernetes",
            "problem_statement": "Scaling issues",
            "category": "Infrastructure",
            "rationale": "Better orchestration",
        },
        headers=manager_headers,
    )
    assert create_resp.status_code == 201
    decision_id = create_resp.json()["id"]

    update_resp = client.put(
        f"/decisions/{decision_id}",
        json={"status": "Under Review", "change_summary": "Sending for review"},
        headers=manager_headers,
    )
    assert update_resp.status_code == 200

    trail_resp = client.get(
        f"/audit-logs/entity/decision/{decision_id}", headers=admin_headers
    )
    assert trail_resp.status_code == 200
    actions = [entry["action"] for entry in trail_resp.json()]
    assert "decision.created" in actions
    assert "decision.status_changed" in actions


def test_employee_cannot_create_decision(client):
    headers = _register_and_login(client, "audit.employee2@example.com", "employee")
    resp = client.post(
        "/decisions",
        json={
            "title": "Should fail",
            "category": "Process",
        },
        headers=headers,
    )
    assert resp.status_code == 403


def test_reviewer_cannot_create_decision(client):
    """Finalized rule: only manager/administrator may create decisions."""
    headers = _register_and_login(client, "audit.reviewer@example.com", "reviewer")
    resp = client.post(
        "/decisions",
        json={
            "title": "Should also fail",
            "category": "Process",
        },
        headers=headers,
    )
    assert resp.status_code == 403
