import pytest
from fastapi.testclient import TestClient


def test_dashboard_and_analytics_endpoints(
    client: TestClient,
    employee_user: tuple,
    admin_user: tuple,
) -> None:
    _, _, emp_headers = employee_user
    _, _, admin_headers = admin_user

    # Test Employee Dashboard
    emp_dash = client.get("/api/v1/dashboard/stats", headers=emp_headers)
    assert emp_dash.status_code == 200
    assert emp_dash.json()["role"] == "employee"
    assert "my_decisions_count" in emp_dash.json()["metrics"]

    # Test Admin Dashboard
    admin_dash = client.get("/api/v1/dashboard/stats", headers=admin_headers)
    assert admin_dash.status_code == 200
    assert admin_dash.json()["role"] == "administrator"
    assert "total_users" in admin_dash.json()["metrics"]

    # Test Analytics Overview
    analytics_res = client.get("/api/v1/analytics/overview", headers=admin_headers)
    assert analytics_res.status_code == 200
    data = analytics_res.json()
    assert "decisions_by_status" in data
    assert "decisions_over_time" in data


def test_pdf_and_excel_reports(
    client: TestClient,
    employee_user: tuple,
) -> None:
    _, _, headers = employee_user

    # 1. Create a decision with alternative
    d_res = client.post(
        "/api/v1/decisions",
        json={"title": "Export Report Test Decision", "problem_statement": "Testing report generation in PDF and Excel formats."},
        headers=headers,
    )
    decision_id = d_res.json()["id"]

    client.post(
        f"/api/v1/decisions/{decision_id}/alternatives",
        json={"title": "Option Alpha", "description": "Candidate A"},
        headers=headers,
    )

    # 2. Test PDF Download
    pdf_res = client.get(f"/api/v1/reports/decision/{decision_id}/pdf", headers=headers)
    assert pdf_res.status_code == 200
    assert pdf_res.headers["content-type"] == "application/pdf"
    assert len(pdf_res.content) > 100

    # 3. Test Excel Download
    excel_res = client.get(f"/api/v1/reports/decision/{decision_id}/excel", headers=headers)
    assert excel_res.status_code == 200
    assert "openxmlformats" in excel_res.headers["content-type"]
    assert len(excel_res.content) > 100
