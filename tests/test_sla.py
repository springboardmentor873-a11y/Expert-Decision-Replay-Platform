from datetime import datetime, timezone, timedelta
from app.models.approval import Approval
from app.models.notification import Notification
from app.services.sla_checker import check_overdue_approvals
from app.core.config import settings
from tests.conftest import login, auth_headers

def create_decision(client, token):
    r = client.post("/decisions", headers=auth_headers(token), json={
        "title": "Decision needing approval",
        "problem_statement": "Problem",
        "category": "Process",
    })
    return r.json()

def test_sla_checker_reminders(client, db_session, employee, manager, reviewer):
    emp_token = login(client, employee.email)
    mgr_token = login(client, manager.email)
    
    decision = create_decision(client, emp_token)
    now = datetime.now(timezone.utc)

    approval = Approval(
        decision_id=decision["id"],
        reviewer_id=reviewer.id,
        approval_level=1,
        status="Pending",
        assigned_at=now - timedelta(days=5),
        due_date=now - timedelta(days=1), # overdue
        reminder_sent_at=None
    )
    db_session.add(approval)
    db_session.commit()

    db_session.query(Notification).delete()
    db_session.commit()

    check_overdue_approvals(db_session)

    db_session.refresh(approval)
    assert approval.reminder_sent_at is not None

    notifications = db_session.query(Notification).filter(Notification.notification_type == "APPROVAL_OVERDUE").all()
    assert len(notifications) == 2

def test_sla_checker_escalation(client, db_session, employee, manager, reviewer):
    emp_token = login(client, employee.email)
    decision = create_decision(client, emp_token)

    now = datetime.now(timezone.utc)
    grace_period_end = now - timedelta(hours=settings.sla_grace_period_hours)
    
    approval = Approval(
        decision_id=decision["id"],
        reviewer_id=reviewer.id,
        approval_level=1,
        status="Pending",
        assigned_at=grace_period_end - timedelta(days=5),
        due_date=grace_period_end - timedelta(days=1), 
        reminder_sent_at=grace_period_end - timedelta(days=1)
    )
    db_session.add(approval)
    db_session.commit()

    original_id = approval.id
    check_overdue_approvals(db_session)

    db_session.refresh(approval)
    assert approval.status == "Escalated"

    new_approval = db_session.query(Approval).filter(Approval.escalated_from_id == original_id).first()
    assert new_approval is not None
    assert new_approval.reviewer_id != reviewer.id
    assert new_approval.status == "Pending"
