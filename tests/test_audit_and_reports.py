from tests.conftest import login, auth_headers


def create_decision(client, token):
    r = client.post("/decisions", headers=auth_headers(token), json={
        "title": "Decision for reports",
        "problem_statement": "Problem",
        "category": "Process",
    })
    return r.json()


def test_audit_log_created_on_decision_create(client, employee, administrator):
    token = login(client, employee.email)
    admin_token = login(client, administrator.email)

    create_decision(client, token)

    r = client.get("/audit-logs", headers=auth_headers(admin_token))
    assert r.status_code == 200
    actions = [log["action"] for log in r.json()]
    assert "CREATE" in actions


def test_employee_cannot_read_audit_logs(client, employee):
    token = login(client, employee.email)
    r = client.get("/audit-logs", headers=auth_headers(token))
    assert r.status_code == 403


def test_activity_feed_records_decision_creation(client, employee):
    token = login(client, employee.email)
    create_decision(client, token)

    r = client.get("/activities", headers=auth_headers(token))
    assert r.status_code == 200
    assert len(r.json()) >= 1


def test_excel_report_generation(client, employee):
    token = login(client, employee.email)
    create_decision(client, token)

    r = client.get("/reports/decisions/export/excel", headers=auth_headers(token))
    assert r.status_code == 200
    assert r.headers["content-type"].startswith(
        "application/vnd.openxmlformats"
    )
    assert len(r.content) > 500


def test_pdf_report_generation(client, employee):
    token = login(client, employee.email)
    create_decision(client, token)

    r = client.get("/reports/decisions/export/pdf", headers=auth_headers(token))
    assert r.status_code == 200
    assert r.headers["content-type"] == "application/pdf"
    assert len(r.content) > 200
