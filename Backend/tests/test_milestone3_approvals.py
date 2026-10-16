"""Milestone 3 - Approval Workflow + Notifications tests."""


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
    return {"Authorization": f"Bearer {resp.json()['access_token']}"}, resp


def _whoami_id(client, headers):
    # No /me endpoint check here to keep this self-contained; fetch via
    # the admin-only user list would require admin — instead decode by
    # re-registering isn't possible, so tests fetch id from decision/step
    # payloads (creator_id / reviewer_id) rather than a dedicated lookup.
    pass


def test_two_level_approval_chain_approves_decision(client):
    manager_headers = _register_and_login(client, "wf.manager@example.com", "manager")[0]
    admin_headers = _register_and_login(client, "wf.admin@example.com", "administrator")[0]

    # Get reviewer user ids by registering them and reading back via admin user list
    reviewer1_headers, _ = _register_and_login(client, "wf.reviewer1@example.com", "reviewer")
    reviewer2_headers, _ = _register_and_login(client, "wf.reviewer2@example.com", "reviewer")

    users_resp = client.get("/users", headers=admin_headers)
    users = users_resp.json()
    reviewer1_id = next(u["id"] for u in users if u["email"] == "wf.reviewer1@example.com")
    reviewer2_id = next(u["id"] for u in users if u["email"] == "wf.reviewer2@example.com")

    create_resp = client.post(
        "/decisions",
        json={"title": "Adopt microservices", "category": "Architecture"},
        headers=manager_headers,
    )
    decision_id = create_resp.json()["id"]

    wf_resp = client.post(
        f"/decisions/{decision_id}/approvals",
        json={"reviewer_ids": [reviewer1_id, reviewer2_id]},
        headers=manager_headers,
    )
    assert wf_resp.status_code == 201
    steps = wf_resp.json()
    assert len(steps) == 2
    step1_id, step2_id = steps[0]["id"], steps[1]["id"]

    # Reviewer 2 cannot act before reviewer 1
    resp = client.post(
        f"/decisions/{decision_id}/approvals/{step2_id}/decide",
        json={"decision": "approve"},
        headers=reviewer2_headers,
    )
    assert resp.status_code == 400

    # Reviewer 1 approves level 1
    resp = client.post(
        f"/decisions/{decision_id}/approvals/{step1_id}/decide",
        json={"decision": "approve", "comment": "Looks solid"},
        headers=reviewer1_headers,
    )
    assert resp.status_code == 200
    assert resp.json()["status"] == "Approved"

    # Reviewer 2 approves the final level -> decision should be Approved
    resp = client.post(
        f"/decisions/{decision_id}/approvals/{step2_id}/decide",
        json={"decision": "approve"},
        headers=reviewer2_headers,
    )
    assert resp.status_code == 200

    decision_resp = client.get(f"/decisions/{decision_id}", headers=manager_headers)
    assert decision_resp.json()["status"] == "Approved"


def test_rejection_at_any_level_rejects_decision_and_skips_rest(client):
    manager_headers = _register_and_login(client, "wf.manager2@example.com", "manager")[0]
    admin_headers = _register_and_login(client, "wf.admin2@example.com", "administrator")[0]
    reviewer1_headers, _ = _register_and_login(client, "wf.reviewer3@example.com", "reviewer")
    _register_and_login(client, "wf.reviewer4@example.com", "reviewer")

    users = client.get("/users", headers=admin_headers).json()
    r1_id = next(u["id"] for u in users if u["email"] == "wf.reviewer3@example.com")
    r2_id = next(u["id"] for u in users if u["email"] == "wf.reviewer4@example.com")

    decision_id = client.post(
        "/decisions",
        json={"title": "Switch cloud provider", "category": "Infrastructure"},
        headers=manager_headers,
    ).json()["id"]

    wf = client.post(
        f"/decisions/{decision_id}/approvals",
        json={"reviewer_ids": [r1_id, r2_id]},
        headers=manager_headers,
    ).json()

    client.post(
        f"/decisions/{decision_id}/approvals/{wf[0]['id']}/decide",
        json={"decision": "reject", "comment": "Too risky"},
        headers=reviewer1_headers,
    )

    decision = client.get(f"/decisions/{decision_id}", headers=manager_headers).json()
    assert decision["status"] == "Rejected"

    steps = client.get(f"/decisions/{decision_id}/approvals", headers=manager_headers).json()
    assert steps[1]["status"] == "Skipped"


def test_only_manager_or_admin_can_create_approval_workflow(client):
    employee_headers, _ = _register_and_login(client, "wf.employee@example.com", "employee")
    manager_headers = _register_and_login(client, "wf.manager3@example.com", "manager")[0]

    decision_id = client.post(
        "/decisions",
        json={"title": "Pick a CI tool", "category": "Process"},
        headers=manager_headers,
    ).json()["id"]

    resp = client.post(
        f"/decisions/{decision_id}/approvals",
        json={"reviewer_ids": [1]},
        headers=employee_headers,
    )
    assert resp.status_code == 403


def test_escalation_reassigns_pending_step_and_notifies(client):
    manager_headers = _register_and_login(client, "wf.manager4@example.com", "manager")[0]
    admin_headers = _register_and_login(client, "wf.admin4@example.com", "administrator")[0]
    _register_and_login(client, "wf.reviewer5@example.com", "reviewer")
    reviewer6_headers, _ = _register_and_login(client, "wf.reviewer6@example.com", "reviewer")

    users = client.get("/users", headers=admin_headers).json()
    r1_id = next(u["id"] for u in users if u["email"] == "wf.reviewer5@example.com")
    r2_id = next(u["id"] for u in users if u["email"] == "wf.reviewer6@example.com")

    decision_id = client.post(
        "/decisions",
        json={"title": "Rewrite auth service", "category": "Security"},
        headers=manager_headers,
    ).json()["id"]

    step = client.post(
        f"/decisions/{decision_id}/approvals",
        json={"reviewer_ids": [r1_id]},
        headers=manager_headers,
    ).json()[0]

    resp = client.post(
        f"/decisions/{decision_id}/approvals/{step['id']}/escalate",
        json={"new_reviewer_id": r2_id, "comment": "Original reviewer OOO"},
        headers=manager_headers,
    )
    assert resp.status_code == 200
    assert resp.json()["reviewer_id"] == r2_id

    notes = client.get("/notifications", headers=reviewer6_headers).json()
    assert any("escalated" in n["message"] for n in notes)


def test_notifications_are_scoped_to_the_recipient(client):
    manager_headers = _register_and_login(client, "wf.manager5@example.com", "manager")[0]
    reviewer_headers, _ = _register_and_login(client, "wf.reviewer7@example.com", "reviewer")
    other_headers, _ = _register_and_login(client, "wf.other@example.com", "employee")

    admin_headers = _register_and_login(client, "wf.admin5@example.com", "administrator")[0]
    users = client.get("/users", headers=admin_headers).json()
    r_id = next(u["id"] for u in users if u["email"] == "wf.reviewer7@example.com")

    decision_id = client.post(
        "/decisions",
        json={"title": "New logging stack", "category": "Infrastructure"},
        headers=manager_headers,
    ).json()["id"]

    client.post(
        f"/decisions/{decision_id}/approvals",
        json={"reviewer_ids": [r_id]},
        headers=manager_headers,
    )

    reviewer_notes = client.get("/notifications", headers=reviewer_headers).json()
    other_notes = client.get("/notifications", headers=other_headers).json()

    assert any(n["entity_id"] == decision_id for n in reviewer_notes)
    assert all(n["entity_id"] != decision_id for n in other_notes)
