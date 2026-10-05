def test_approval_workflow_notifications_and_audit(
    client, employee_headers, manager_token, auth_headers
):
    create = client.post(
        "/decisions",
        json={
            "title": "Milestone 3 workflow decision",
            "category": "Security",
            "problem_statement": "Need a controlled approval path.",
        },
        headers=employee_headers,
    )
    assert create.status_code == 201
    decision_id = create.json()["id"]

    submit = client.post(f"/decisions/{decision_id}/submit", headers=employee_headers)
    assert submit.status_code == 200
    assert submit.json()["status"] == "Under Review"

    manager_headers = {"Authorization": f"Bearer {manager_token}"}
    approve = client.post(f"/decisions/{decision_id}/approve", headers=manager_headers)
    assert approve.status_code == 200
    assert approve.json()["status"] == "Approved"

    repeat = client.post(f"/decisions/{decision_id}/reject", headers=manager_headers)
    assert repeat.status_code == 400

    employee_notifications = client.get("/notifications", headers=employee_headers)
    assert employee_notifications.status_code == 200
    assert any(
        item["decision_id"] == decision_id and "approved" in item["message"]
        for item in employee_notifications.json()
    )

    manager_notifications = client.get("/notifications", headers=manager_headers)
    assert manager_notifications.status_code == 200
    assert any(item["decision_id"] == decision_id for item in manager_notifications.json())

    audit = client.get(f"/audit-logs?decision_id={decision_id}", headers=auth_headers)
    assert audit.status_code == 200
    actions = {item["action"] for item in audit.json()}
    assert {"decision_created", "decision_submitted", "decision_approved"}.issubset(actions)


def test_approval_permissions_and_invalid_transition(client, employee_headers, manager_token):
    create = client.post(
        "/decisions",
        json={"title": "Draft transition check", "category": "Process"},
        headers=employee_headers,
    )
    decision_id = create.json()["id"]
    manager_headers = {"Authorization": f"Bearer {manager_token}"}

    assert client.post(f"/decisions/{decision_id}/approve", headers=manager_headers).status_code == 400
    assert client.post(f"/decisions/{decision_id}/submit", headers=manager_headers).status_code == 403


def test_decision_report(client, auth_headers):
    response = client.get("/reports/decisions", headers=auth_headers)
    assert response.status_code == 200
    report = response.json()
    assert report["total"] >= 1
    assert set(report["by_status"]) == {"Draft", "Under Review", "Approved", "Rejected", "Archived"}
    assert "Security" in report["by_category"] or "Process" in report["by_category"]
