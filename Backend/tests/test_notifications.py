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


async def _create_and_submit(client, tokens, title="Test decision"):
    resp = await client.post(
        "/api/v1/decisions",
        json={"title": title, "problem_statement": "Test problem"},
        headers=_auth_headers(tokens),
    )
    assert resp.status_code == 201
    decision = resp.json()
    resp = await client.post(
        f"/api/v1/decisions/{decision['id']}/submit",
        headers=_auth_headers(tokens),
    )
    assert resp.status_code == 200
    return decision


async def test_submission_notifies_reviewers_and_owner_sees_nothing(client, db_session):
    reviewer_tokens = await _register_and_login(client, email="reviewer@test.com", name="Reviewer")
    await _promote(db_session, "reviewer@test.com", UserRole.REVIEWER)
    reviewer_tokens = await _register_and_login(client, email="reviewer@test.com", name="Reviewer")

    owner_tokens = await _register_and_login(client, email="owner@test.com", name="Owner")
    decision = await _create_and_submit(client, owner_tokens)

    resp = await client.get("/api/v1/notifications/unread-count", headers=_auth_headers(reviewer_tokens))
    assert resp.json()["count"] == 1

    resp = await client.get("/api/v1/notifications", headers=_auth_headers(reviewer_tokens))
    data = resp.json()
    assert data["total"] == 1
    assert data["unread_count"] == 1
    assert data["notifications"][0]["decision_id"] == decision["id"]
    assert data["notifications"][0]["notification_type"] == "approval_requested"
    assert data["notifications"][0]["is_read"] is False

    resp = await client.get("/api/v1/notifications", headers=_auth_headers(owner_tokens))
    assert resp.json()["total"] == 0


async def test_reviewer_approval_notifies_manager_and_owner(client, db_session):
    reviewer_tokens = await _register_and_login(client, email="reviewer2@test.com", name="Reviewer Two")
    await _promote(db_session, "reviewer2@test.com", UserRole.REVIEWER)
    reviewer_tokens = await _register_and_login(client, email="reviewer2@test.com", name="Reviewer Two")

    manager_tokens = await _register_and_login(client, email="manager2@test.com", name="Manager Two")
    await _promote(db_session, "manager2@test.com", UserRole.MANAGER)
    manager_tokens = await _register_and_login(client, email="manager2@test.com", name="Manager Two")

    owner_tokens = await _register_and_login(client, email="owner2@test.com", name="Owner Two")
    decision = await _create_and_submit(client, owner_tokens)

    resp = await client.post(
        f"/api/v1/decisions/{decision['id']}/approve",
        headers=_auth_headers(reviewer_tokens),
    )
    assert resp.status_code == 200

    resp = await client.get("/api/v1/notifications/unread-count", headers=_auth_headers(manager_tokens))
    assert resp.json()["count"] == 1
    resp = await client.get("/api/v1/notifications", headers=_auth_headers(manager_tokens))
    notice = resp.json()["notifications"][0]
    assert notice["notification_type"] == "approval_requested"
    assert notice["decision_id"] == decision["id"]

    resp = await client.get("/api/v1/notifications", headers=_auth_headers(owner_tokens))
    notice = resp.json()["notifications"][0]
    assert notice["notification_type"] == "approval_moved"


async def test_manager_approval_notifies_owner(client, db_session):
    reviewer_tokens = await _register_and_login(client, email="reviewer3@test.com", name="Reviewer Three")
    await _promote(db_session, "reviewer3@test.com", UserRole.REVIEWER)
    reviewer_tokens = await _register_and_login(client, email="reviewer3@test.com", name="Reviewer Three")

    manager_tokens = await _register_and_login(client, email="manager3@test.com", name="Manager Three")
    await _promote(db_session, "manager3@test.com", UserRole.MANAGER)
    manager_tokens = await _register_and_login(client, email="manager3@test.com", name="Manager Three")

    owner_tokens = await _register_and_login(client, email="owner3@test.com", name="Owner Three")
    decision = await _create_and_submit(client, owner_tokens)
    await client.post(
        f"/api/v1/decisions/{decision['id']}/approve",
        headers=_auth_headers(reviewer_tokens),
    )
    await client.post(
        f"/api/v1/decisions/{decision['id']}/approve",
        headers=_auth_headers(manager_tokens),
    )

    resp = await client.get("/api/v1/notifications", headers=_auth_headers(owner_tokens))
    data = resp.json()
    assert data["total"] == 2
    assert data["notifications"][0]["notification_type"] == "decision_approved"


async def test_reviewer_rejection_notifies_owner(client, db_session):
    reviewer_tokens = await _register_and_login(client, email="reviewer4@test.com", name="Reviewer Four")
    await _promote(db_session, "reviewer4@test.com", UserRole.REVIEWER)
    reviewer_tokens = await _register_and_login(client, email="reviewer4@test.com", name="Reviewer Four")

    owner_tokens = await _register_and_login(client, email="owner4@test.com", name="Owner Four")
    decision = await _create_and_submit(client, owner_tokens)

    resp = await client.post(
        f"/api/v1/decisions/{decision['id']}/reject",
        json={"reason": "Needs more detail"},
        headers=_auth_headers(reviewer_tokens),
    )
    assert resp.status_code == 200

    resp = await client.get("/api/v1/notifications", headers=_auth_headers(owner_tokens))
    notice = resp.json()["notifications"][0]
    assert notice["notification_type"] == "returned_for_revision"
    assert "Needs more detail" in notice["message"]


async def test_manager_rejection_notifies_owner(client, db_session):
    reviewer_tokens = await _register_and_login(client, email="reviewer5@test.com", name="Reviewer Five")
    await _promote(db_session, "reviewer5@test.com", UserRole.REVIEWER)
    reviewer_tokens = await _register_and_login(client, email="reviewer5@test.com", name="Reviewer Five")

    manager_tokens = await _register_and_login(client, email="manager5@test.com", name="Manager Five")
    await _promote(db_session, "manager5@test.com", UserRole.MANAGER)
    manager_tokens = await _register_and_login(client, email="manager5@test.com", name="Manager Five")

    owner_tokens = await _register_and_login(client, email="owner5@test.com", name="Owner Five")
    decision = await _create_and_submit(client, owner_tokens)
    await client.post(
        f"/api/v1/decisions/{decision['id']}/approve",
        headers=_auth_headers(reviewer_tokens),
    )
    await client.post(
        f"/api/v1/decisions/{decision['id']}/reject",
        json={"reason": "Out of budget"},
        headers=_auth_headers(manager_tokens),
    )

    resp = await client.get("/api/v1/notifications", headers=_auth_headers(owner_tokens))
    notice = resp.json()["notifications"][0]
    assert notice["notification_type"] == "decision_rejected"
    assert "Out of budget" in notice["message"]


async def test_mark_read_updates_unread_count(client, db_session):
    reviewer_tokens = await _register_and_login(client, email="reviewer6@test.com", name="Reviewer Six")
    await _promote(db_session, "reviewer6@test.com", UserRole.REVIEWER)
    reviewer_tokens = await _register_and_login(client, email="reviewer6@test.com", name="Reviewer Six")

    owner_tokens = await _register_and_login(client, email="owner6@test.com", name="Owner Six")
    await _create_and_submit(client, owner_tokens)

    resp = await client.get("/api/v1/notifications", headers=_auth_headers(reviewer_tokens))
    notification_id = resp.json()["notifications"][0]["id"]

    resp = await client.patch(
        f"/api/v1/notifications/{notification_id}/read",
        headers=_auth_headers(reviewer_tokens),
    )
    assert resp.status_code == 200
    assert resp.json()["is_read"] is True

    resp = await client.get("/api/v1/notifications/unread-count", headers=_auth_headers(reviewer_tokens))
    assert resp.json()["count"] == 0


async def test_mark_all_read(client, db_session):
    reviewer_tokens = await _register_and_login(client, email="reviewer7@test.com", name="Reviewer Seven")
    await _promote(db_session, "reviewer7@test.com", UserRole.REVIEWER)
    reviewer_tokens = await _register_and_login(client, email="reviewer7@test.com", name="Reviewer Seven")

    owner_tokens = await _register_and_login(client, email="owner7@test.com", name="Owner Seven")
    await _create_and_submit(client, owner_tokens, title="Decision A")
    await _create_and_submit(client, owner_tokens, title="Decision B")

    resp = await client.get("/api/v1/notifications/unread-count", headers=_auth_headers(reviewer_tokens))
    assert resp.json()["count"] == 2

    resp = await client.post("/api/v1/notifications/read-all", headers=_auth_headers(reviewer_tokens))
    assert resp.status_code == 200
    assert resp.json()["count"] == 2

    resp = await client.get("/api/v1/notifications/unread-count", headers=_auth_headers(reviewer_tokens))
    assert resp.json()["count"] == 0


async def test_cannot_mark_another_users_notification_read(client, db_session):
    reviewer_tokens = await _register_and_login(client, email="reviewer8@test.com", name="Reviewer Eight")
    await _promote(db_session, "reviewer8@test.com", UserRole.REVIEWER)
    reviewer_tokens = await _register_and_login(client, email="reviewer8@test.com", name="Reviewer Eight")

    owner_tokens = await _register_and_login(client, email="owner8@test.com", name="Owner Eight")
    await _create_and_submit(client, owner_tokens)

    resp = await client.get("/api/v1/notifications", headers=_auth_headers(reviewer_tokens))
    notification_id = resp.json()["notifications"][0]["id"]

    resp = await client.patch(
        f"/api/v1/notifications/{notification_id}/read",
        headers=_auth_headers(owner_tokens),
    )
    assert resp.status_code == 404