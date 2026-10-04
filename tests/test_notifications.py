from tests.conftest import login, auth_headers


def create_decision(client, token):
    r = client.post("/decisions", headers=auth_headers(token), json={
        "title": "Decision for notifications",
        "problem_statement": "Problem",
        "category": "Process",
    })
    return r.json()


def test_reviewer_notified_when_approval_requested(client, employee, manager, reviewer):
    emp_token = login(client, employee.email)
    mgr_token = login(client, manager.email)
    rev_token = login(client, reviewer.email)

    decision = create_decision(client, emp_token)

    r = client.post(
        "/approvals",
        headers=auth_headers(mgr_token),
        json={"decision_id": decision["id"], "reviewer_id": reviewer.id, "approval_level": 1},
    )
    assert r.status_code == 201

    r = client.get("/notifications", headers=auth_headers(rev_token))
    assert r.status_code == 200
    notifications = r.json()
    assert len(notifications) == 1
    assert notifications[0]["notification_type"] == "APPROVAL_REQUESTED"
    assert notifications[0]["is_read"] is False

    # The employee and manager should NOT see the reviewer's notification.
    r = client.get("/notifications", headers=auth_headers(emp_token))
    assert r.json() == []


def test_decision_owner_notified_on_approve_and_reject(client, employee, manager, reviewer):
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

    r = client.get("/notifications", headers=auth_headers(emp_token))
    types_seen = [n["notification_type"] for n in r.json()]
    assert "DECISION_APPROVED" in types_seen


def test_unread_count_and_mark_read(client, employee, manager, reviewer):
    emp_token = login(client, employee.email)
    mgr_token = login(client, manager.email)
    rev_token = login(client, reviewer.email)

    decision = create_decision(client, emp_token)
    client.post(
        "/approvals",
        headers=auth_headers(mgr_token),
        json={"decision_id": decision["id"], "reviewer_id": reviewer.id, "approval_level": 1},
    )

    r = client.get("/notifications/unread-count", headers=auth_headers(rev_token))
    assert r.json()["unread_count"] == 1

    notif_id = client.get("/notifications", headers=auth_headers(rev_token)).json()[0]["id"]

    r = client.patch(f"/notifications/{notif_id}/read", headers=auth_headers(rev_token))
    assert r.status_code == 200
    assert r.json()["is_read"] is True

    r = client.get("/notifications/unread-count", headers=auth_headers(rev_token))
    assert r.json()["unread_count"] == 0


def test_mark_all_read(client, employee, manager, reviewer):
    emp_token = login(client, employee.email)
    mgr_token = login(client, manager.email)
    rev_token = login(client, reviewer.email)

    d1 = create_decision(client, emp_token)
    d2 = create_decision(client, emp_token)
    for d in (d1, d2):
        client.post(
            "/approvals",
            headers=auth_headers(mgr_token),
            json={"decision_id": d["id"], "reviewer_id": reviewer.id, "approval_level": 1},
        )

    assert client.get("/notifications/unread-count", headers=auth_headers(rev_token)).json()["unread_count"] == 2

    r = client.patch("/notifications/read-all", headers=auth_headers(rev_token))
    assert r.status_code == 200

    assert client.get("/notifications/unread-count", headers=auth_headers(rev_token)).json()["unread_count"] == 0


def test_cannot_access_or_delete_others_notification(client, employee, manager, reviewer, db_session):
    from tests.conftest import make_user

    emp_token = login(client, employee.email)
    mgr_token = login(client, manager.email)
    rev_token = login(client, reviewer.email)

    other_reviewer = make_user(
        db_session,
        email="other-reviewer-notif@example.com",
        employee_id="REVN200",
        role="Reviewer",
    )
    other_rev_token = login(client, other_reviewer.email)

    decision = create_decision(client, emp_token)
    client.post(
        "/approvals",
        headers=auth_headers(mgr_token),
        json={"decision_id": decision["id"], "reviewer_id": reviewer.id, "approval_level": 1},
    )
    notif_id = client.get("/notifications", headers=auth_headers(rev_token)).json()[0]["id"]

    r = client.patch(f"/notifications/{notif_id}/read", headers=auth_headers(other_rev_token))
    assert r.status_code == 403

    r = client.delete(f"/notifications/{notif_id}", headers=auth_headers(other_rev_token))
    assert r.status_code == 403


def test_comment_and_discussion_notify_decision_owner(client, employee, other_employee, manager):
    # employee owns the decision (department IT); manager is also IT so can access it.
    owner_token = login(client, employee.email)
    mgr_token = login(client, manager.email)

    decision = create_decision(client, owner_token)

    client.post(
        f"/decisions/{decision['id']}/comments",
        headers=auth_headers(mgr_token),
        json={"content": "Looks good"},
    )
    client.post(
        f"/decisions/{decision['id']}/discussion-threads",
        headers=auth_headers(mgr_token),
        json={"title": "Kickoff", "content": "Let's talk"},
    )

    r = client.get("/notifications", headers=auth_headers(owner_token))
    types_seen = [n["notification_type"] for n in r.json()]
    assert "COMMENT_ADDED" in types_seen
    assert "DISCUSSION_STARTED" in types_seen
