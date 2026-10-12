from app.database import DatabaseCursor


def _rows(query, params=()):
    with DatabaseCursor() as (c, _):
        c.execute(query, params)
        return c.fetchall()


def _row(query, params=()):
    with DatabaseCursor() as (c, _):
        c.execute(query, params)
        return c.fetchone()


def _execute(query, params=()):
    with DatabaseCursor(commit=True) as (c, _):
        c.execute(query, params)
        return c.lastrowid, c.rowcount


def log_audit(user_id, action, module, description, entity_type=None, entity_id=None):
    """Best-effort audit logging so auditing never breaks the main action."""
    try:
        _execute(
            """INSERT INTO audit_logs
               (user_id, action, module, description, entity_type, entity_id)
               VALUES (%s,%s,%s,%s,%s,%s)""",
            (user_id, action, module, description, entity_type, entity_id),
        )
    except Exception:
        pass


def create_notification(user_id, title, message, notification_type="info", decision_id=None):
    return _execute(
        """INSERT INTO notifications
           (user_id, title, message, notification_type, decision_id)
           VALUES (%s,%s,%s,%s,%s)""",
        (user_id, title, message, notification_type, decision_id),
    )[0]


def list_notifications(user_id, unread_only=False):
    clause = " AND n.is_read = 0" if unread_only else ""
    return _rows(
        f"""SELECT n.*, d.title AS decision_title
            FROM notifications n
            LEFT JOIN decisions d ON n.decision_id=d.id
            WHERE n.user_id=%s{clause}
            ORDER BY n.created_at DESC""",
        (user_id,),
    )


def mark_notification_read(notification_id, user_id):
    return _execute(
        "UPDATE notifications SET is_read=1, read_at=NOW() WHERE id=%s AND user_id=%s",
        (notification_id, user_id),
    )[1] > 0


def mark_all_notifications_read(user_id):
    return _execute(
        "UPDATE notifications SET is_read=1, read_at=NOW() WHERE user_id=%s AND is_read=0",
        (user_id,),
    )[1]


def reviewer_users():
    return _rows(
        """SELECT id, full_name, email, role, team_id
           FROM users WHERE role IN ('Reviewer','Manager','Administrator')
           ORDER BY full_name"""
    )


def assign_reviewer(decision_id, reviewer_id, assigned_by, level=1):
    # Keep one active assignment for a reviewer/level combination.
    existing = _row(
        """SELECT id FROM approvals
           WHERE decision_id=%s AND reviewer_id=%s AND approval_level=%s
             AND status='Pending'""",
        (decision_id, reviewer_id, level),
    )
    if existing:
        return existing["id"]
    approval_id = _execute(
        """INSERT INTO approvals
           (decision_id, reviewer_id, assigned_by, approval_level, status)
           VALUES (%s,%s,%s,%s,'Pending')""",
        (decision_id, reviewer_id, assigned_by, level),
    )[0]
    _execute("UPDATE decisions SET status='Under Review' WHERE id=%s", (decision_id,))
    return approval_id


def list_approvals(user, status_filter=None):
    params = []
    where = []
    if user["role"] == "Reviewer":
        where.append("a.reviewer_id=%s")
        params.append(user["id"])
    elif user["role"] == "Employee":
        where.append("d.created_by=%s")
        params.append(user["id"])
    # Manager/Admin can see all approvals.
    if status_filter:
        where.append("a.status=%s")
        params.append(status_filter)
    where_sql = (" WHERE " + " AND ".join(where)) if where else ""
    return _rows(
        f"""SELECT a.*, d.title AS decision_title, d.status AS decision_status,
                   u.full_name AS reviewer_name, cu.full_name AS creator_name,
                   au.full_name AS assigned_by_name
            FROM approvals a
            JOIN decisions d ON a.decision_id=d.id
            JOIN users u ON a.reviewer_id=u.id
            JOIN users cu ON d.created_by=cu.id
            LEFT JOIN users au ON a.assigned_by=au.id
            {where_sql}
            ORDER BY a.assigned_at DESC""",
        tuple(params),
    )


def get_approval(approval_id):
    return _row(
        """SELECT a.*, d.title AS decision_title, d.status AS decision_status,
                  u.full_name AS reviewer_name, cu.full_name AS creator_name, d.created_by AS creator_id
           FROM approvals a
           JOIN decisions d ON a.decision_id=d.id
           JOIN users u ON a.reviewer_id=u.id
           JOIN users cu ON d.created_by=cu.id
           WHERE a.id=%s""",
        (approval_id,),
    )


def review_approval(approval_id, reviewer_id, action, comment=None):
    approval = get_approval(approval_id)
    if not approval:
        return None
    if approval["reviewer_id"] != reviewer_id:
        return False
    if approval["status"] != "Pending":
        return approval

    new_status = "Approved" if action == "approve" else "Rejected"
    with DatabaseCursor(commit=True) as (c, _):
        c.execute(
            """UPDATE approvals
               SET status=%s, review_comment=%s, reviewed_at=NOW()
               WHERE id=%s AND reviewer_id=%s AND status='Pending'""",
            (new_status, comment, approval_id, reviewer_id),
        )
        if c.rowcount == 0:
            return False
        c.execute(
            """INSERT INTO approval_history
               (approval_id, decision_id, reviewer_id, approval_level, action, comment,
                previous_decision_status, new_decision_status)
               VALUES (%s,%s,%s,%s,%s,%s,%s,%s)""",
            (approval_id, approval["decision_id"], reviewer_id, approval["approval_level"],
             new_status, comment, approval["decision_status"],
             "Rejected" if new_status == "Rejected" else "Under Review"),
        )

        if new_status == "Rejected":
            c.execute("UPDATE decisions SET status='Rejected' WHERE id=%s", (approval["decision_id"],))
        else:
            c.execute(
                "SELECT COUNT(*) AS pending FROM approvals WHERE decision_id=%s AND status='Pending'",
                (approval["decision_id"],),
            )
            pending = c.fetchone()["pending"]
            new_decision_status = "Under Review" if pending else "Approved"
            c.execute(
                "UPDATE decisions SET status=%s WHERE id=%s",
                (new_decision_status, approval["decision_id"]),
            )
            c.execute(
                """UPDATE approval_history SET new_decision_status=%s
                   WHERE id=LAST_INSERT_ID()""",
                (new_decision_status,),
            )
    return get_approval(approval_id)


def pending_reviewers_for_decision(decision_id):
    return _rows(
        """SELECT reviewer_id FROM approvals WHERE decision_id=%s AND status='Pending'""",
        (decision_id,),
    )


def list_decision_approvals(decision_id):
    return _rows(
        """SELECT a.*, d.title AS decision_title, d.status AS decision_status,
                  u.full_name AS reviewer_name, cu.full_name AS creator_name,
                  au.full_name AS assigned_by_name
           FROM approvals a
           JOIN decisions d ON a.decision_id=d.id
           JOIN users u ON a.reviewer_id=u.id
           JOIN users cu ON d.created_by=cu.id
           LEFT JOIN users au ON a.assigned_by=au.id
           WHERE a.decision_id=%s ORDER BY a.approval_level, a.assigned_at DESC""",
        (decision_id,),
    )


def approval_history(decision_id=None):
    params = ()
    where = ""
    if decision_id:
        where = " WHERE h.decision_id=%s"
        params = (decision_id,)
    return _rows(
        f"""SELECT h.*, u.full_name AS reviewer_name, d.title AS decision_title
            FROM approval_history h
            JOIN users u ON h.reviewer_id=u.id
            JOIN decisions d ON h.decision_id=d.id
            {where}
            ORDER BY h.created_at DESC""",
        params,
    )


def audit_logs(user, action_filter=None):
    params = []
    where = []
    if user["role"] not in ("Administrator", "Manager"):
        where.append("a.user_id=%s")
        params.append(user["id"])
    if action_filter:
        where.append("a.action=%s")
        params.append(action_filter)
    where_sql = (" WHERE " + " AND ".join(where)) if where else ""
    return _rows(
        f"""SELECT a.*, u.full_name AS user_name, u.email
            FROM audit_logs a JOIN users u ON a.user_id=u.id
            {where_sql}
            ORDER BY a.created_at DESC LIMIT 500""",
        tuple(params),
    )


def dashboard_summary(user):
    decision_where = "" if user["role"] in ("Administrator", "Manager") else " WHERE d.created_by=%s"
    decision_params = () if not decision_where else (user["id"],)
    counts = _row(
        f"""SELECT COUNT(*) AS total,
                   SUM(status='Draft') AS draft,
                   SUM(status='Under Review') AS review,
                   SUM(status='Approved') AS approved,
                   SUM(status='Rejected') AS rejected
            FROM decisions d{decision_where}""",
        decision_params,
    )
    pending = _row(
        """SELECT COUNT(*) AS count FROM approvals
           WHERE reviewer_id=%s AND status='Pending'""",
        (user["id"],),
    )["count"]
    team_count = _row(
        "SELECT COUNT(*) AS count FROM teams WHERE manager_id=%s", (user["id"],)
    )["count"] if user["role"] == "Manager" else _row(
        "SELECT COUNT(*) AS count FROM users WHERE team_id=%s", (user.get("team_id"),)
    )["count"] if user.get("team_id") else 0
    activities = _rows(
        """SELECT action, module, description, created_at
           FROM audit_logs WHERE user_id=%s ORDER BY created_at DESC LIMIT 8""",
        (user["id"],),
    )
    return {
        **{k: int(counts.get(k) or 0) for k in ("total", "draft", "review", "approved", "rejected")},
        "pending_reviews": int(pending or 0),
        "team_count": int(team_count or 0),
        "activities": activities,
    }


def report_decisions(status_filter=None, category=None):
    where, params = [], []
    if status_filter:
        where.append("d.status=%s"); params.append(status_filter)
    if category:
        where.append("d.category=%s"); params.append(category)
    ws = " WHERE " + " AND ".join(where) if where else ""
    return _rows(
        f"""SELECT d.id, d.title, d.category, d.status, u.full_name AS creator_name,
                   t.team_name, d.created_at, d.updated_at
            FROM decisions d JOIN users u ON d.created_by=u.id
            LEFT JOIN teams t ON u.team_id=t.id{ws}
            ORDER BY d.updated_at DESC""",
        tuple(params),
    )


def report_approvals():
    return _rows(
        """SELECT a.id, d.title AS decision_title, u.full_name AS reviewer_name,
                  a.approval_level, a.status, a.review_comment, a.assigned_at, a.reviewed_at
           FROM approvals a JOIN decisions d ON a.decision_id=d.id
           JOIN users u ON a.reviewer_id=u.id ORDER BY a.assigned_at DESC"""
    )


def report_teams():
    return _rows(
        """SELECT t.team_name, COALESCE(t.manager_name,'—') AS manager_name,
                  COUNT(u.id) AS member_count,
                  COUNT(DISTINCT d.id) AS decision_count
           FROM (SELECT t.id,t.team_name,mu.full_name AS manager_name
                 FROM teams t LEFT JOIN users mu ON t.manager_id=mu.id) t
           LEFT JOIN users u ON u.team_id=t.id
           LEFT JOIN decisions d ON d.created_by=u.id
           GROUP BY t.id,t.team_name,t.manager_name
           ORDER BY t.team_name"""
    )
