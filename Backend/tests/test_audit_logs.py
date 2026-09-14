import pytest
from sqlalchemy import update

from app.models.user import User, UserRole

pytestmark = pytest.mark.asyncio


async def _register_and_login(client, email="test@example.com", name="Test"):
    await client.post(
        "/api/v1/auth/register",
        json={"full_name": name, "email": email, "password": "password123"},
    )
    resp = await client.post("/api/v1/auth/login", json={"email": email, "password": "password123"})
    return resp.json()


def _auth_headers(tokens):
    return {"Authorization": f"Bearer {tokens['access_token']}"}


async def _promote(db_session, email, role):
    await db_session.execute(update(User).where(User.email == email).values(role=role))
    await db_session.commit()


async def _me(client, tokens):
    resp = await client.get("/api/v1/auth/me", headers=_auth_headers(tokens))
    assert resp.status_code == 200
    return resp.json()


async def _create_decision(client, tokens, title="Test decision"):
    resp = await client.post(
        "/api/v1/decisions",
        json={"title": title, "problem_statement": "Test problem"},
        headers=_auth_headers(tokens),
    )
    assert resp.status_code == 201
    return resp.json()


async def _submit(client, tokens, decision_id):
    resp = await client.post(
        f"/api/v1/decisions/{decision_id}/submit",
        headers=_auth_headers(tokens),
    )
    assert resp.status_code == 200
    return resp.json()


async def _audit_logs(client, tokens, **params):
    query = "&".join(f"{k}={v}" for k, v in params.items())
    resp = await client.get(f"/api/v1/audit-logs?{query}", headers=_auth_headers(tokens))
    return resp


async def test_decision_created_and_updated_are_logged(client, db_session):
    admin_tokens = await _register_and_login(client, email="admin1@test.com", name="Admin One")
    await _promote(db_session, "admin1@test.com", UserRole.ADMINISTRATOR)
    admin_tokens = await _register_and_login(client, email="admin1@test.com", name="Admin One")

    owner_tokens = await _register_and_login(client, email="owner1@test.com", name="Owner One")
    decision = await _create_decision(client, owner_tokens)
    resp = await client.patch(
        f"/api/v1/decisions/{decision['id']}",
        json={"category": "Finance"},
        headers=_auth_headers(owner_tokens),
    )
    assert resp.status_code == 200

    resp = await _audit_logs(client, admin_tokens)
    assert resp.status_code == 200
    data = resp.json()
    actions = [log["action"] for log in data["logs"] if log["decision_id"] == decision["id"]]
    assert "decision_created" in actions
    assert "decision_updated" in actions
    assert data["logs"][0]["decision_title"] == "Test decision"
    assert data["logs"][0]["actor_name"] == "Owner One"


async def test_submission_is_logged(client, db_session):
    admin_tokens = await _register_and_login(client, email="admin2@test.com", name="Admin Two")
    await _promote(db_session, "admin2@test.com", UserRole.ADMINISTRATOR)
    admin_tokens = await _register_and_login(client, email="admin2@test.com", name="Admin Two")

    owner_tokens = await _register_and_login(client, email="owner2@test.com", name="Owner Two")
    decision = await _create_decision(client, owner_tokens)
    await _submit(client, owner_tokens, decision["id"])

    resp = await _audit_logs(client, admin_tokens, decision_id=decision["id"])
    actions = [log["action"] for log in resp.json()["logs"]]
    assert "decision_submitted" in actions


async def test_reviewer_and_manager_approvals_are_logged(client, db_session):
    reviewer_tokens = await _register_and_login(client, email="reviewer1@test.com", name="Reviewer One")
    await _promote(db_session, "reviewer1@test.com", UserRole.REVIEWER)
    reviewer_tokens = await _register_and_login(client, email="reviewer1@test.com", name="Reviewer One")

    manager_tokens = await _register_and_login(client, email="manager1@test.com", name="Manager One")
    await _promote(db_session, "manager1@test.com", UserRole.MANAGER)
    manager_tokens = await _register_and_login(client, email="manager1@test.com", name="Manager One")

    owner_tokens = await _register_and_login(client, email="owner3@test.com", name="Owner Three")
    decision = await _create_decision(client, owner_tokens)
    await _submit(client, owner_tokens, decision["id"])

    resp = await client.post(
        f"/api/v1/decisions/{decision['id']}/approve",
        headers=_auth_headers(reviewer_tokens),
    )
    assert resp.status_code == 200
    resp = await client.post(
        f"/api/v1/decisions/{decision['id']}/approve",
        headers=_auth_headers(manager_tokens),
    )
    assert resp.status_code == 200

    resp = await _audit_logs(client, manager_tokens, decision_id=decision["id"])
    actions = [log["action"] for log in resp.json()["logs"]]
    assert "reviewer_approved" in actions
    assert "manager_approved" in actions


async def test_reviewer_rejection_is_logged_with_reason(client, db_session):
    reviewer_tokens = await _register_and_login(client, email="reviewer2@test.com", name="Reviewer Two")
    await _promote(db_session, "reviewer2@test.com", UserRole.REVIEWER)
    reviewer_tokens = await _register_and_login(client, email="reviewer2@test.com", name="Reviewer Two")

    admin_tokens = await _register_and_login(client, email="admin3@test.com", name="Admin Three")
    await _promote(db_session, "admin3@test.com", UserRole.ADMINISTRATOR)
    admin_tokens = await _register_and_login(client, email="admin3@test.com", name="Admin Three")

    owner_tokens = await _register_and_login(client, email="owner4@test.com", name="Owner Four")
    decision = await _create_decision(client, owner_tokens)
    await _submit(client, owner_tokens, decision["id"])

    resp = await client.post(
        f"/api/v1/decisions/{decision['id']}/reject",
        json={"reason": "Needs more detail"},
        headers=_auth_headers(reviewer_tokens),
    )
    assert resp.status_code == 200

    resp = await _audit_logs(client, admin_tokens, decision_id=decision["id"], action="reviewer_rejected")
    logs = resp.json()["logs"]
    assert len(logs) == 1
    assert "Needs more detail" in logs[0]["details"]


async def test_manager_rejection_is_logged(client, db_session):
    reviewer_tokens = await _register_and_login(client, email="reviewer3@test.com", name="Reviewer Three")
    await _promote(db_session, "reviewer3@test.com", UserRole.REVIEWER)
    reviewer_tokens = await _register_and_login(client, email="reviewer3@test.com", name="Reviewer Three")

    manager_tokens = await _register_and_login(client, email="manager2@test.com", name="Manager Two")
    await _promote(db_session, "manager2@test.com", UserRole.MANAGER)
    manager_tokens = await _register_and_login(client, email="manager2@test.com", name="Manager Two")

    owner_tokens = await _register_and_login(client, email="owner5@test.com", name="Owner Five")
    decision = await _create_decision(client, owner_tokens)
    await _submit(client, owner_tokens, decision["id"])
    await client.post(
        f"/api/v1/decisions/{decision['id']}/approve",
        headers=_auth_headers(reviewer_tokens),
    )
    resp = await client.post(
        f"/api/v1/decisions/{decision['id']}/reject",
        json={"reason": "Out of budget"},
        headers=_auth_headers(manager_tokens),
    )
    assert resp.status_code == 200

    resp = await _audit_logs(client, manager_tokens, decision_id=decision["id"])
    actions = [log["action"] for log in resp.json()["logs"]]
    assert "manager_rejected" in actions


async def test_archive_is_logged_and_restricted(client, db_session):
    manager_tokens = await _register_and_login(client, email="manager3@test.com", name="Manager Three")
    await _promote(db_session, "manager3@test.com", UserRole.MANAGER)
    manager_tokens = await _register_and_login(client, email="manager3@test.com", name="Manager Three")

    owner_tokens = await _register_and_login(client, email="owner6@test.com", name="Owner Six")
    decision = await _create_decision(client, owner_tokens)

    resp = await client.post(
        f"/api/v1/decisions/{decision['id']}/archive",
        headers=_auth_headers(owner_tokens),
    )
    assert resp.status_code == 403
    resp = await client.post(
        f"/api/v1/decisions/{decision['id']}/archive",
        headers=_auth_headers(manager_tokens),
    )
    assert resp.status_code == 409  # still a draft — cannot archive

    await _submit(client, owner_tokens, decision["id"])
    resp = await client.post(
        f"/api/v1/decisions/{decision['id']}/archive",
        headers=_auth_headers(manager_tokens),
    )
    assert resp.status_code == 200
    assert resp.json()["status"] == "archived"

    resp = await _audit_logs(client, manager_tokens, decision_id=decision["id"])
    actions = [log["action"] for log in resp.json()["logs"]]
    assert "decision_archived" in actions

    resp = await client.post(
        f"/api/v1/decisions/{decision['id']}/archive",
        headers=_auth_headers(manager_tokens),
    )
    assert resp.status_code == 409  # already archived


async def test_audit_logs_restricted_to_manager_and_admin(client, db_session):
    employee_tokens = await _register_and_login(client, email="employee1@test.com", name="Employee One")
    resp = await client.get("/api/v1/audit-logs", headers=_auth_headers(employee_tokens))
    assert resp.status_code == 403

    reviewer_tokens = await _register_and_login(client, email="reviewer4@test.com", name="Reviewer Four")
    await _promote(db_session, "reviewer4@test.com", UserRole.REVIEWER)
    reviewer_tokens = await _register_and_login(client, email="reviewer4@test.com", name="Reviewer Four")
    resp = await client.get("/api/v1/audit-logs", headers=_auth_headers(reviewer_tokens))
    assert resp.status_code == 403

    manager_tokens = await _register_and_login(client, email="manager4@test.com", name="Manager Four")
    await _promote(db_session, "manager4@test.com", UserRole.MANAGER)
    manager_tokens = await _register_and_login(client, email="manager4@test.com", name="Manager Four")
    resp = await client.get("/api/v1/audit-logs", headers=_auth_headers(manager_tokens))
    assert resp.status_code == 200


async def test_filter_by_actor(client, db_session):
    admin_tokens = await _register_and_login(client, email="admin4@test.com", name="Admin Four")
    await _promote(db_session, "admin4@test.com", UserRole.ADMINISTRATOR)
    admin_tokens = await _register_and_login(client, email="admin4@test.com", name="Admin Four")

    owner_tokens = await _register_and_login(client, email="owner7@test.com", name="Owner Seven")
    owner_id = (await _me(client, owner_tokens))["id"]
    await _create_decision(client, owner_tokens, title="First")
    await _create_decision(client, owner_tokens, title="Second")

    resp = await _audit_logs(client, admin_tokens, actor_id=owner_id)
    data = resp.json()
    assert data["total"] == 2
    assert all(log["actor_id"] == owner_id for log in data["logs"])
    assert all(log["action"] == "decision_created" for log in data["logs"])


async def test_pagination(client, db_session):
    admin_tokens = await _register_and_login(client, email="admin5@test.com", name="Admin Five")
    await _promote(db_session, "admin5@test.com", UserRole.ADMINISTRATOR)
    admin_tokens = await _register_and_login(client, email="admin5@test.com", name="Admin Five")

    owner_tokens = await _register_and_login(client, email="owner8@test.com", name="Owner Eight")
    for i in range(3):
        await _create_decision(client, owner_tokens, title=f"Decision {i}")

    resp = await _audit_logs(client, admin_tokens, action="decision_created", limit=2, offset=0)
    page1 = resp.json()
    assert page1["total"] == 3
    assert len(page1["logs"]) == 2

    resp = await _audit_logs(client, admin_tokens, action="decision_created", limit=2, offset=2)
    page2 = resp.json()
    assert page2["total"] == 3
    assert len(page2["logs"]) == 1

    ids = {log["id"] for log in page1["logs"]} | {log["id"] for log in page2["logs"]}
    assert len(ids) == 3


async def test_no_write_endpoints_on_audit_logs(client, db_session):
    manager_tokens = await _register_and_login(client, email="manager5@test.com", name="Manager Five")
    await _promote(db_session, "manager5@test.com", UserRole.MANAGER)
    manager_tokens = await _register_and_login(client, email="manager5@test.com", name="Manager Five")

    owner_tokens = await _register_and_login(client, email="owner9@test.com", name="Owner Nine")
    decision = await _create_decision(client, owner_tokens)

    resp = await _audit_logs(client, manager_tokens, decision_id=decision["id"])
    log_id = resp.json()["logs"][0]["id"]

    for method in ("patch", "delete", "put"):
        result = await getattr(client, method)(f"/api/v1/audit-logs/{log_id}", headers=_auth_headers(manager_tokens))
        assert result.status_code in (404, 405), f"{method.upper()} should not exist"