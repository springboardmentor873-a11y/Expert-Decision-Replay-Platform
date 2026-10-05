def _create_decision(client, employee_headers, title):
    response = client.post(
        "/decisions",
        json={"title": title, "category": "Security"},
        headers=employee_headers,
    )
    assert response.status_code == 201
    return response.json()["id"]


def _decision_versions(client, decision_id, headers):
    response = client.get(f"/decisions/{decision_id}/versions", headers=headers)
    assert response.status_code == 200
    return sorted(response.json(), key=lambda version: version["version"])


def test_submission_and_approval_write_versions_audits_and_notifications(
    client, employee_headers, manager_token, auth_headers
):
    decision_id = _create_decision(client, employee_headers, "Approval version regression")

    submit = client.post(f"/decisions/{decision_id}/submit", headers=employee_headers)
    assert submit.status_code == 200
    assert submit.json()["status"] == "Under Review"

    manager_headers = {"Authorization": f"Bearer {manager_token}"}
    manager_notifications = client.get("/notifications", headers=manager_headers)
    assert any(
        item["decision_id"] == decision_id and "submitted for review" in item["message"]
        for item in manager_notifications.json()
    )
    admin_notifications = client.get("/notifications", headers=auth_headers)
    assert any(
        item["decision_id"] == decision_id and "submitted for review" in item["message"]
        for item in admin_notifications.json()
    )

    approve = client.post(f"/decisions/{decision_id}/approve", headers=manager_headers)
    assert approve.status_code == 200
    assert approve.json()["status"] == "Approved"

    versions = _decision_versions(client, decision_id, auth_headers)
    assert [version["status"] for version in versions] == [
        "Draft",
        "Under Review",
        "Approved",
    ]
    assert [version["version"] for version in versions] == [1, 2, 3]

    audit = client.get(f"/audit-logs?decision_id={decision_id}", headers=auth_headers)
    actions = {entry["action"] for entry in audit.json()}
    assert {"decision_submitted", "decision_approved"}.issubset(actions)

    employee_notifications = client.get("/notifications", headers=employee_headers)
    assert any(
        item["decision_id"] == decision_id and "approved" in item["message"]
        for item in employee_notifications.json()
    )


def test_rejection_writes_version_audit_and_notification(
    client, employee_headers, manager_token, auth_headers
):
    decision_id = _create_decision(client, employee_headers, "Rejection version regression")
    assert client.post(f"/decisions/{decision_id}/submit", headers=employee_headers).status_code == 200

    manager_headers = {"Authorization": f"Bearer {manager_token}"}
    reject = client.post(f"/decisions/{decision_id}/reject", headers=manager_headers)
    assert reject.status_code == 200
    assert reject.json()["status"] == "Rejected"

    versions = _decision_versions(client, decision_id, auth_headers)
    assert [version["status"] for version in versions] == [
        "Draft",
        "Under Review",
        "Rejected",
    ]
    assert [version["version"] for version in versions] == [1, 2, 3]

    audit = client.get(f"/audit-logs?decision_id={decision_id}", headers=auth_headers)
    assert "decision_rejected" in {entry["action"] for entry in audit.json()}

    employee_notifications = client.get("/notifications", headers=employee_headers)
    assert any(
        item["decision_id"] == decision_id and "rejected" in item["message"]
        for item in employee_notifications.json()
    )


def test_generic_status_update_remains_compatible_and_is_audited(
    client, employee_headers, manager_token, auth_headers
):
    decision_id = _create_decision(client, employee_headers, "Generic status update regression")
    manager_headers = {"Authorization": f"Bearer {manager_token}"}

    update = client.put(
        f"/decisions/{decision_id}",
        json={"status": "Approved", "change_summary": "Approved through existing update API"},
        headers=manager_headers,
    )
    assert update.status_code == 200
    assert update.json()["status"] == "Approved"
    assert update.json()["version"] == 2

    versions = _decision_versions(client, decision_id, auth_headers)
    assert len(versions) == 2
    assert versions[-1]["status"] == "Approved"
    assert versions[-1]["change_summary"] == "Approved through existing update API"

    audit = client.get(f"/audit-logs?decision_id={decision_id}", headers=auth_headers)
    assert "decision_status_updated" in {entry["action"] for entry in audit.json()}


def test_comment_deletion_is_audited_without_changing_delete_response(
    client, employee_headers, auth_headers
):
    decision_id = _create_decision(client, employee_headers, "Comment deletion audit regression")
    comment = client.post(
        f"/decisions/{decision_id}/comments",
        json={"content": "Temporary comment"},
        headers=employee_headers,
    )
    assert comment.status_code == 201

    deleted = client.delete(
        f"/decisions/{decision_id}/comments/{comment.json()['id']}",
        headers=employee_headers,
    )
    assert deleted.status_code == 204

    audit = client.get(f"/audit-logs?decision_id={decision_id}", headers=auth_headers)
    assert "comment_deleted" in {entry["action"] for entry in audit.json()}


def test_team_activity_includes_audited_actions_for_assigned_team(
    client, employee_headers, auth_headers
):
    team = client.post("/teams", json={"name": "M3 activity regression team"}, headers=auth_headers)
    assert team.status_code in (200, 201)
    employee = client.get("/me", headers=employee_headers).json()
    assignment = client.put(
        f"/teams/assign/{employee['id']}",
        json={"team_id": team.json()["id"]},
        headers=auth_headers,
    )
    assert assignment.status_code == 200

    decision_id = _create_decision(client, employee_headers, "Team activity regression")
    activity = client.get("/reports/team-activity", headers=auth_headers)
    assert activity.status_code == 200
    assert any(
        item["team_id"] == team.json()["id"] and item["decision_id"] == decision_id
        for item in activity.json()
    )
