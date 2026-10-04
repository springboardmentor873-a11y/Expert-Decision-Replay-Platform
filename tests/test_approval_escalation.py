from tests.conftest import login, auth_headers, make_user


def create_decision(client, token):
    r = client.post("/decisions", headers=auth_headers(token), json={
        "title": "Decision for escalation",
        "problem_statement": "Problem",
        "category": "Process",
    })
    return r.json()


def test_escalate_pending_approval_to_new_reviewer(client, employee, manager, reviewer, db_session):
    emp_token = login(client, employee.email)
    mgr_token = login(client, manager.email)

    new_reviewer = make_user(
        db_session, email="backup-reviewer@example.com", employee_id="REVB1", role="Reviewer"
    )
    new_rev_token = login(client, new_reviewer.email)

    decision = create_decision(client, emp_token)

    r = client.post(
        "/approvals",
        headers=auth_headers(mgr_token),
        json={"decision_id": decision["id"], "reviewer_id": reviewer.id, "approval_level": 1},
    )
    original_approval_id = r.json()["id"]

    r = client.post(
        f"/approvals/{original_approval_id}/escalate",
        headers=auth_headers(mgr_token),
        json={"new_reviewer_id": new_reviewer.id, "reason": "Out of office"},
    )
    assert r.status_code == 201, r.text
    new_approval = r.json()
    assert new_approval["status"] == "Pending"
    assert new_approval["escalated_from_id"] == original_approval_id

    original = client.get(f"/approvals/{original_approval_id}", headers=auth_headers(mgr_token)).json()
    assert original["status"] == "Escalated"

    # Original reviewer can no longer act on the escalated approval.
    r = client.patch(
        f"/approvals/{original_approval_id}",
        headers=auth_headers(login(client, reviewer.email)),
        json={"status": "Approved"},
    )
    assert r.status_code == 409

    # New reviewer got notified and can approve.
    r = client.get("/notifications", headers=auth_headers(new_rev_token))
    assert any(n["notification_type"] == "APPROVAL_REQUESTED" for n in r.json())

    r = client.patch(
        f"/approvals/{new_approval['id']}",
        headers=auth_headers(new_rev_token),
        json={"status": "Approved"},
    )
    assert r.status_code == 200

    r = client.get(f"/decisions/{decision['id']}", headers=auth_headers(mgr_token))
    assert r.json()["status"] == "Approved"


def test_only_manager_or_admin_can_escalate(client, employee, manager, reviewer):
    emp_token = login(client, employee.email)
    mgr_token = login(client, manager.email)
    rev_token = login(client, reviewer.email)

    decision = create_decision(client, emp_token)
    r = client.post(
        "/approvals",
        headers=auth_headers(mgr_token),
        json={"decision_id": decision["id"], "reviewer_id": reviewer.id, "approval_level": 1},
    )
    approval_id = r.json()["id"]

    r = client.post(
        f"/approvals/{approval_id}/escalate",
        headers=auth_headers(rev_token),
        json={"new_reviewer_id": reviewer.id},
    )
    assert r.status_code == 403


def test_multi_level_approval_sequencing(client, employee, manager, reviewer, db_session):
    emp_token = login(client, employee.email)
    mgr_token = login(client, manager.email)
    rev_token = login(client, reviewer.email)

    level2_reviewer = make_user(
        db_session, email="level2-reviewer@example.com", employee_id="REVL2", role="Reviewer"
    )

    decision = create_decision(client, emp_token)

    # Cannot request level 2 before level 1 is approved.
    r = client.post(
        "/approvals",
        headers=auth_headers(mgr_token),
        json={"decision_id": decision["id"], "reviewer_id": level2_reviewer.id, "approval_level": 2},
    )
    assert r.status_code == 400

    # Level 1 requested and approved.
    r = client.post(
        "/approvals",
        headers=auth_headers(mgr_token),
        json={"decision_id": decision["id"], "reviewer_id": reviewer.id, "approval_level": 1},
    )
    level1_id = r.json()["id"]
    client.patch(f"/approvals/{level1_id}", headers=auth_headers(rev_token), json={"status": "Approved"})

    # Now level 2 can be requested.
    r = client.post(
        "/approvals",
        headers=auth_headers(mgr_token),
        json={"decision_id": decision["id"], "reviewer_id": level2_reviewer.id, "approval_level": 2},
    )
    assert r.status_code == 201, r.text
