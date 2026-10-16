"""Milestone 3 - Reports & Dashboard tests."""


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
    return {"Authorization": f"Bearer {resp.json()['access_token']}"}


def test_decisions_summary_requires_manager_or_admin(client):
    employee_headers = _register_and_login(client, "rep.employee@example.com", "employee")
    resp = client.get("/reports/decisions/summary", headers=employee_headers)
    assert resp.status_code == 403


def test_decisions_summary_counts_are_sane(client):
    manager_headers = _register_and_login(client, "rep.manager@example.com", "manager")
    client.post(
        "/decisions",
        json={"title": "Report test decision", "category": "Process"},
        headers=manager_headers,
    )
    resp = client.get("/reports/decisions/summary", headers=manager_headers)
    assert resp.status_code == 200
    body = resp.json()
    assert body["total_decisions"] >= 1
    assert "Draft" in body["by_status"]
    assert "Process" in body["by_category"]


def test_decisions_csv_export(client):
    manager_headers = _register_and_login(client, "rep.manager2@example.com", "manager")
    resp = client.get("/reports/decisions/export", headers=manager_headers)
    assert resp.status_code == 200
    assert resp.headers["content-type"].startswith("text/csv")
    assert "ID,Title,Category,Status" in resp.text


def test_audit_export_is_admin_only(client):
    manager_headers = _register_and_login(client, "rep.manager3@example.com", "manager")
    resp = client.get("/reports/audit/export", headers=manager_headers)
    assert resp.status_code == 403

    admin_headers = _register_and_login(client, "rep.admin@example.com", "administrator")
    resp = client.get("/reports/audit/export", headers=admin_headers)
    assert resp.status_code == 200


def test_employee_dashboard_shape(client):
    headers = _register_and_login(client, "dash.employee@example.com", "employee")
    resp = client.get("/dashboard", headers=headers)
    assert resp.status_code == 200
    body = resp.json()
    assert body["role_view"] == "employee"
    assert "my_decisions" in body
    assert "pending_reviews" in body
    assert "recent_activities" in body
    # Registering + logging in themselves should already show up here
    assert len(body["recent_activities"]) >= 1


def test_manager_dashboard_shows_team_decisions(client):
    manager_headers = _register_and_login(client, "dash.manager@example.com", "manager")
    client.post(
        "/decisions",
        json={"title": "Manager dashboard decision", "category": "Architecture"},
        headers=manager_headers,
    )
    resp = client.get("/dashboard", headers=manager_headers)
    assert resp.status_code == 200
    body = resp.json()
    assert body["role_view"] == "manager"
    assert any(d["title"] == "Manager dashboard decision" for d in body["team_decisions"])
    assert "decision_statistics" in body


def test_admin_dashboard_shape(client):
    admin_headers = _register_and_login(client, "dash.admin@example.com", "administrator")
    resp = client.get("/dashboard", headers=admin_headers)
    assert resp.status_code == 200
    body = resp.json()
    assert body["role_view"] == "administrator"
    assert body["system_analytics"]["total_users"] >= 1
    assert "organization_reports" in body
    assert "user_activity" in body
