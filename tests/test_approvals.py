from tests.conftest import login, auth_headers


def create_decision(client, token):
    r = client.post("/decisions", headers=auth_headers(token), json={
        "title": "Decision needing approval",
        "problem_statement": "Problem",
        "category": "Process",
    })
    return r.json()


def test_full_approval_workflow_approve(client, employee, manager, reviewer):
    emp_token = login(client, employee.email)
    mgr_token = login(client, manager.email)
    rev_token = login(client, reviewer.email)

    decision = create_decision(client, emp_token)

    r = client.post(
        "/approvals",
        headers=auth_headers(mgr_token),
        json={"decision_id": decision["id"], "reviewer_id": reviewer.id, "approval_level": 1},
    )
    assert r.status_code == 201, r.text
    approval_id = r.json()["id"]

    r = client.get(f"/decisions/{decision['id']}", headers=auth_headers(mgr_token))
    assert r.json()["status"] == "Under Review"

    r = client.patch(
        f"/approvals/{approval_id}",
        headers=auth_headers(rev_token),
        json={"status": "Approved"},
    )
    assert r.status_code == 200

    r = client.get(f"/decisions/{decision['id']}", headers=auth_headers(mgr_token))
    assert r.json()["status"] == "Approved"


def test_full_approval_workflow_reject(client, employee, manager, reviewer):
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

    r = client.patch(
        f"/approvals/{approval_id}",
        headers=auth_headers(rev_token),
        json={"status": "Rejected"},
    )
    assert r.status_code == 200

    r = client.get(f"/decisions/{decision['id']}", headers=auth_headers(mgr_token))
    assert r.json()["status"] == "Rejected"


def test_employee_cannot_create_approval(client, employee, reviewer):
    emp_token = login(client, employee.email)
    decision = create_decision(client, emp_token)

    r = client.post(
        "/approvals",
        headers=auth_headers(emp_token),
        json={"decision_id": decision["id"], "reviewer_id": reviewer.id, "approval_level": 1},
    )
    assert r.status_code == 403


def test_unassigned_reviewer_cannot_approve(client, employee, manager, reviewer, db_session):
    from tests.conftest import make_user

    emp_token = login(client, employee.email)
    mgr_token = login(client, manager.email)

    other_reviewer = make_user(
        db_session,
        email="other-reviewer@example.com",
        employee_id="REV200",
        role="Reviewer",
    )
    other_rev_token = login(client, other_reviewer.email)

    decision = create_decision(client, emp_token)

    r = client.post(
        "/approvals",
        headers=auth_headers(mgr_token),
        json={"decision_id": decision["id"], "reviewer_id": reviewer.id, "approval_level": 1},
    )
    approval_id = r.json()["id"]

    r = client.patch(
        f"/approvals/{approval_id}",
        headers=auth_headers(other_rev_token),
        json={"status": "Approved"},
    )
    assert r.status_code == 403


def test_cannot_approve_twice(client, employee, manager, reviewer):
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

    client.patch(
        f"/approvals/{approval_id}",
        headers=auth_headers(rev_token),
        json={"status": "Approved"},
    )

    r = client.patch(
        f"/approvals/{approval_id}",
        headers=auth_headers(rev_token),
        json={"status": "Rejected"},
    )
    assert r.status_code == 409
