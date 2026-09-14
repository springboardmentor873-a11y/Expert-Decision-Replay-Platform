import datetime

import pytest
from sqlalchemy import update

from app.models.approval import Approval, ApprovalAction, ApprovalStage
from app.models.decision import Decision, DecisionStatus
from app.models.user import User, UserRole

pytestmark = pytest.mark.asyncio


async def _register_and_login(client, email, name):
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


async def _insert_user(db_session, email, name, role=UserRole.EMPLOYEE):
    user = User(email=email, full_name=name, hashed_password="x", role=role)
    db_session.add(user)
    await db_session.flush()
    return user


async def _insert_decision(db_session, *, created_by, status, created_at):
    decision = Decision(
        title=f"Decision {created_at.isoformat()}",
        problem_statement="Test problem",
        created_by=created_by,
        status=status,
        created_at=created_at,
    )
    db_session.add(decision)
    await db_session.flush()
    return decision


async def _insert_approval(db_session, *, decision_id, user_id, action, stage, created_at):
    db_session.add(
        Approval(
            decision_id=decision_id,
            user_id=user_id,
            action=action,
            approval_stage=stage,
            created_at=created_at,
        )
    )
    await db_session.flush()


async def _create_and_submit(client, tokens, title):
    resp = await client.post(
        "/api/v1/decisions",
        json={"title": title, "problem_statement": "Test problem"},
        headers=_auth_headers(tokens),
    )
    assert resp.status_code == 201
    decision_id = resp.json()["id"]
    resp = await client.post(f"/api/v1/decisions/{decision_id}/submit", headers=_auth_headers(tokens))
    assert resp.status_code == 200
    return decision_id


async def _reports(client, tokens, path, **params):
    query = "&".join(f"{k}={v}" for k, v in params.items())
    resp = await client.get(f"/api/v1/reports/{path}?{query}", headers=_auth_headers(tokens))
    return resp


# ---------------------------------------------------------------------------
# Authorization
# ---------------------------------------------------------------------------


async def test_reports_restricted_to_manager_and_admin(client, db_session):
    employee_tokens = await _register_and_login(client, "emp@test.com", "Employee")
    reviewer_tokens = await _register_and_login(client, "rev@test.com", "Reviewer")
    await _promote(db_session, "rev@test.com", UserRole.REVIEWER)
    manager_tokens = await _register_and_login(client, "mgr@test.com", "Manager")
    await _promote(db_session, "mgr@test.com", UserRole.MANAGER)
    admin_tokens = await _register_and_login(client, "adm@test.com", "Admin")
    await _promote(db_session, "adm@test.com", UserRole.ADMINISTRATOR)

    for path in ("summary", "status-breakdown", "activity", "users"):
        resp = await _reports(client, employee_tokens, path)
        assert resp.status_code == 403, f"{path} should be forbidden for employees"
        resp = await _reports(client, reviewer_tokens, path)
        assert resp.status_code == 403, f"{path} should be forbidden for reviewers"

    for tokens in (manager_tokens, admin_tokens):
        for path in ("summary", "status-breakdown", "activity", "users"):
            resp = await _reports(client, tokens, path)
            assert resp.status_code == 200, f"{path} should be allowed for managers/admins"


async def test_reports_empty_database(client, db_session):
    manager_tokens = await _register_and_login(client, "mgr-empty@test.com", "Manager Empty")
    await _promote(db_session, "mgr-empty@test.com", UserRole.MANAGER)
    manager_tokens = await _register_and_login(client, "mgr-empty@test.com", "Manager Empty")

    resp = await _reports(client, manager_tokens, "summary")
    assert resp.status_code == 200
    data = resp.json()
    assert data["total_decisions"] == 0
    assert data["total_approvals"] == 0
    assert data["total_rejections"] == 0
    assert data["pending_review"] == 0
    assert all(s["count"] == 0 for s in data["by_status"])
    assert data["by_reviewer"] == {"approvals": 0, "rejections": 0}
    assert data["by_manager"] == {"approvals": 0, "rejections": 0}

    resp = await _reports(client, manager_tokens, "status-breakdown")
    assert resp.json()["total"] == 0
    resp = await _reports(client, manager_tokens, "activity")
    activity = resp.json()
    assert activity["points"] == []
    assert activity["total_decisions_created"] == 0
    assert activity["total_approvals_actioned"] == 0
    resp = await _reports(client, manager_tokens, "users")
    assert resp.json()["total_users"] == 1  # just the manager


# ---------------------------------------------------------------------------
# Summary calculations
# ---------------------------------------------------------------------------


async def test_summary_counts_and_status_grouping(client, db_session):
    owner_tokens = await _register_and_login(client, "owner@test.com", "Owner")
    reviewer_tokens = await _register_and_login(client, "rev-sum@test.com", "Reviewer")
    await _promote(db_session, "rev-sum@test.com", UserRole.REVIEWER)
    reviewer_tokens = await _register_and_login(client, "rev-sum@test.com", "Reviewer")
    manager_tokens = await _register_and_login(client, "mgr-sum@test.com", "Manager")
    await _promote(db_session, "mgr-sum@test.com", UserRole.MANAGER)
    manager_tokens = await _register_and_login(client, "mgr-sum@test.com", "Manager")

    # A: fully approved
    a = await _create_and_submit(client, owner_tokens, "Approved one")
    resp = await client.post(f"/api/v1/decisions/{a}/approve", headers=_auth_headers(reviewer_tokens))
    assert resp.status_code == 200
    resp = await client.post(f"/api/v1/decisions/{a}/approve", headers=_auth_headers(manager_tokens))
    assert resp.status_code == 200

    # B: approved by reviewer, rejected by manager
    b = await _create_and_submit(client, owner_tokens, "Rejected one")
    resp = await client.post(f"/api/v1/decisions/{b}/approve", headers=_auth_headers(reviewer_tokens))
    assert resp.status_code == 200
    resp = await client.post(
        f"/api/v1/decisions/{b}/reject",
        json={"reason": "Nope"},
        headers=_auth_headers(manager_tokens),
    )
    assert resp.status_code == 200

    # C: left as a draft
    await client.post(
        "/api/v1/decisions",
        json={"title": "Draft one", "problem_statement": "p"},
        headers=_auth_headers(owner_tokens),
    )

    # D: submitted, left in review
    await _create_and_submit(client, owner_tokens, "In review")

    resp = await _reports(client, manager_tokens, "summary")
    assert resp.status_code == 200
    data = resp.json()

    assert data["total_decisions"] == 4
    assert data["total_approvals"] == 3  # reviewer(A) + manager(A) + reviewer(B)
    assert data["total_rejections"] == 1  # manager(B)
    assert data["pending_review"] == 1  # decision D

    by_status = {s["status"]: s["count"] for s in data["by_status"]}
    assert by_status == {
        "draft": 1,
        "under_review": 1,
        "pending_manager_review": 0,
        "approved": 1,
        "rejected": 1,
        "archived": 0,
    }

    assert data["by_reviewer"] == {"approvals": 2, "rejections": 0}
    assert data["by_manager"] == {"approvals": 1, "rejections": 1}

    assert data["users"]["total_users"] == 3
    assert data["users"]["active_users"] == 3
    roles = {r["role"]: r["count"] for r in data["users"]["by_role"]}
    assert roles["employee"] == 1
    assert roles["reviewer"] == 1
    assert roles["manager"] == 1
    assert roles["administrator"] == 0

    # User report aggregates
    resp = await _reports(client, manager_tokens, "users")
    users = {u["full_name"]: u for u in resp.json()["users"]}
    assert users["Owner"]["decisions_created"] == 4
    assert users["Reviewer"]["approvals"] == 2
    assert users["Manager"]["approvals"] == 1
    assert users["Manager"]["rejections"] == 1


# ---------------------------------------------------------------------------
# Status breakdown & activity
# ---------------------------------------------------------------------------


async def test_status_breakdown(client, db_session):
    manager_tokens = await _register_and_login(client, "mgr-sb@test.com", "Manager SB")
    await _promote(db_session, "mgr-sb@test.com", UserRole.MANAGER)
    manager_tokens = await _register_and_login(client, "mgr-sb@test.com", "Manager SB")

    reviewer = await _insert_user(db_session, "reviewer-sb@test.com", "Reviewer SB", UserRole.REVIEWER)
    owner = await _insert_user(db_session, "sb@test.com", "SB Owner")
    await db_session.commit()

    d1 = await _insert_decision(
        db_session, created_by=owner.id, status=DecisionStatus.DRAFT,
        created_at=datetime.datetime(2026, 9, 1, 10, 0, 0),
    )
    await _insert_decision(
        db_session, created_by=owner.id, status=DecisionStatus.DRAFT,
        created_at=datetime.datetime(2026, 9, 2, 10, 0, 0),
    )
    await _insert_decision(
        db_session, created_by=owner.id, status=DecisionStatus.APPROVED,
        created_at=datetime.datetime(2026, 9, 3, 10, 0, 0),
    )
    await _insert_approval(
        db_session, decision_id=d1.id, user_id=reviewer.id,
        action=ApprovalAction.APPROVE, stage=ApprovalStage.REVIEWER,
        created_at=datetime.datetime(2026, 9, 4, 10, 0, 0),
    )
    await db_session.commit()

    resp = await _reports(client, manager_tokens, "status-breakdown")
    data = resp.json()
    assert data["total"] == 3
    by_status = {s["status"]: s["count"] for s in data["by_status"]}
    assert by_status["draft"] == 2
    assert by_status["approved"] == 1


async def test_activity_grouped_by_day(client, db_session):
    manager_tokens = await _register_and_login(client, "mgr-act@test.com", "Manager ACT")
    await _promote(db_session, "mgr-act@test.com", UserRole.MANAGER)
    manager_tokens = await _register_and_login(client, "mgr-act@test.com", "Manager ACT")

    reviewer = await _insert_user(db_session, "rev-act@test.com", "Reviewer ACT", UserRole.REVIEWER)
    owner = await _insert_user(db_session, "act@test.com", "ACT Owner")
    await db_session.commit()

    day1 = await _insert_decision(
        db_session, created_by=owner.id, status=DecisionStatus.DRAFT,
        created_at=datetime.datetime(2026, 9, 1, 8, 0, 0),
    )
    await _insert_decision(
        db_session, created_by=owner.id, status=DecisionStatus.DRAFT,
        created_at=datetime.datetime(2026, 9, 1, 15, 0, 0),
    )
    await _insert_decision(
        db_session, created_by=owner.id, status=DecisionStatus.DRAFT,
        created_at=datetime.datetime(2026, 9, 3, 8, 0, 0),
    )
    await _insert_approval(
        db_session, decision_id=day1.id, user_id=reviewer.id,
        action=ApprovalAction.REJECT, stage=ApprovalStage.REVIEWER,
        created_at=datetime.datetime(2026, 9, 2, 8, 0, 0),
    )
    await db_session.commit()

    resp = await _reports(client, manager_tokens, "activity")
    data = resp.json()
    assert data["total_decisions_created"] == 3
    assert data["total_approvals_actioned"] == 1
    by_day = {p["date"]: p for p in data["points"]}
    assert by_day["2026-09-01"]["decisions_created"] == 2
    assert by_day["2026-09-03"]["decisions_created"] == 1
    assert by_day["2026-09-02"]["approvals_actioned"] == 1
    assert by_day["2026-09-02"]["decisions_created"] == 0


# ---------------------------------------------------------------------------
# Date range filtering
# ---------------------------------------------------------------------------


async def test_date_range_filters_summary_and_activity(client, db_session):
    manager_tokens = await _register_and_login(client, "mgr-dr@test.com", "Manager DR")
    await _promote(db_session, "mgr-dr@test.com", UserRole.MANAGER)
    manager_tokens = await _register_and_login(client, "mgr-dr@test.com", "Manager DR")

    reviewer = await _insert_user(db_session, "rev-dr@test.com", "Reviewer DR", UserRole.REVIEWER)
    owner = await _insert_user(db_session, "dr@test.com", "DR Owner")

    earlier = await _insert_decision(
        db_session, created_by=owner.id, status=DecisionStatus.APPROVED,
        created_at=datetime.datetime(2026, 8, 31, 23, 59, 59),
    )
    in_day1 = await _insert_decision(
        db_session, created_by=owner.id, status=DecisionStatus.DRAFT,
        created_at=datetime.datetime(2026, 9, 1, 0, 0, 0),
    )
    await _insert_decision(
        db_session, created_by=owner.id, status=DecisionStatus.APPROVED,
        created_at=datetime.datetime(2026, 9, 30, 23, 59, 59),
    )
    await _insert_approval(
        db_session, decision_id=earlier.id, user_id=reviewer.id,
        action=ApprovalAction.APPROVE, stage=ApprovalStage.REVIEWER,
        created_at=datetime.datetime(2026, 8, 31, 12, 0, 0),
    )
    await _insert_approval(
        db_session, decision_id=in_day1.id, user_id=reviewer.id,
        action=ApprovalAction.APPROVE, stage=ApprovalStage.REVIEWER,
        created_at=datetime.datetime(2026, 9, 15, 12, 0, 0),
    )
    await db_session.commit()

    resp = await _reports(client, manager_tokens, "summary", start_date="2026-09-01", end_date="2026-09-30")
    data = resp.json()
    assert data["total_decisions"] == 2  # Sep-01 and Sep-30, not Aug-31
    assert data["total_approvals"] == 1  # Sep-15, not Aug-31
    by_status = {s["status"]: s["count"] for s in data["by_status"]}
    assert by_status["draft"] == 1
    assert by_status["approved"] == 1

    resp = await _reports(client, manager_tokens, "activity", start_date="2026-09-01", end_date="2026-09-30")
    data = resp.json()
    dates = {p["date"] for p in data["points"]}
    assert "2026-08-31" not in dates
    assert data["total_decisions_created"] == 2
    assert data["total_approvals_actioned"] == 1

    resp = await _reports(client, manager_tokens, "users", start_date="2026-09-01", end_date="2026-09-30")
    data = resp.json()
    users = {u["full_name"]: u for u in data["users"]}
    assert users["DR Owner"]["decisions_created"] == 2
    assert users["Reviewer DR"]["approvals"] == 1


# ---------------------------------------------------------------------------
# User report ordering & pagination
# ---------------------------------------------------------------------------


async def test_user_report_pagination(client, db_session):
    manager_tokens = await _register_and_login(client, "mgr-pg@test.com", "Manager PG")
    await _promote(db_session, "mgr-pg@test.com", UserRole.MANAGER)
    manager_tokens = await _register_and_login(client, "mgr-pg@test.com", "Manager PG")

    owner1 = await _insert_user(db_session, "pg1@test.com", "Abbott")
    owner2 = await _insert_user(db_session, "pg2@test.com", "Beta")
    reviewer = await _insert_user(db_session, "pg3@test.com", "Charlie", UserRole.REVIEWER)
    await db_session.commit()

    d1 = await _insert_decision(
        db_session, created_by=owner1.id, status=DecisionStatus.APPROVED,
        created_at=datetime.datetime(2026, 9, 1, 8, 0, 0),
    )
    await _insert_decision(
        db_session, created_by=owner1.id, status=DecisionStatus.DRAFT,
        created_at=datetime.datetime(2026, 9, 2, 8, 0, 0),
    )
    await _insert_decision(
        db_session, created_by=owner2.id, status=DecisionStatus.DRAFT,
        created_at=datetime.datetime(2026, 9, 3, 8, 0, 0),
    )
    await _insert_approval(
        db_session, decision_id=d1.id, user_id=reviewer.id,
        action=ApprovalAction.APPROVE, stage=ApprovalStage.REVIEWER,
        created_at=datetime.datetime(2026, 9, 4, 8, 0, 0),
    )
    await _insert_approval(
        db_session, decision_id=d1.id, user_id=reviewer.id,
        action=ApprovalAction.APPROVE, stage=ApprovalStage.REVIEWER,
        created_at=datetime.datetime(2026, 9, 5, 8, 0, 0),
    )
    await db_session.commit()

    resp = await _reports(client, manager_tokens, "users", limit=2, offset=0)
    data = resp.json()
    assert data["total_users"] == 4  # manager + 3 seeded users
    assert [u["full_name"] for u in data["users"]] == ["Abbott", "Beta"]  # by decisions desc

    resp = await _reports(client, manager_tokens, "users", limit=2, offset=2)
    page2 = resp.json()["users"]
    # Charlie has no decisions but 2 approvals -> next in the decisions==0 group
    assert page2[0]["full_name"] == "Charlie"
    assert page2[0]["approvals"] == 2