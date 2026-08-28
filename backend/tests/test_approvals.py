import pytest
from fastapi.testclient import TestClient


def test_full_approval_workflow_lifecycle(
    client: TestClient,
    employee_user: tuple,
    reviewer_user: tuple,
    manager_user: tuple,
) -> None:
    _, _, emp_headers = employee_user
    _, _, rev_headers = reviewer_user
    _, _, mgr_headers = manager_user

    # 1. Employee creates a decision and adds an alternative
    d_res = client.post(
        "/api/v1/decisions",
        json={
            "title": "Approval Pipeline End-to-End Test Case",
            "problem_statement": "Validating multi-tier approval state transitions from draft to approved.",
        },
        headers=emp_headers,
    )
    decision_id = d_res.json()["id"]

    client.post(
        f"/api/v1/decisions/{decision_id}/alternatives",
        json={"title": "Primary Proposed Option", "description": "Candidate architecture"},
        headers=emp_headers,
    )

    # 2. Employee submits for review (draft -> in_review)
    sub_res = client.post(f"/api/v1/decisions/{decision_id}/submit", headers=emp_headers)
    assert sub_res.status_code == 200
    assert sub_res.json()["current_status"] == "in_review"

    # Step 1 must be pending (Reviewer), Step 2 waiting (Manager)
    steps = sub_res.json()["steps"]
    assert len(steps) == 2
    assert steps[0]["status"] == "pending"
    assert steps[1]["status"] == "waiting"

    # 3. Non-reviewer (Employee) cannot approve step 1
    bad_appr = client.post(
        f"/api/v1/decisions/{decision_id}/approve",
        json={"comment": "Attempting illegal self-approval"},
        headers=emp_headers,
    )
    assert bad_appr.status_code == 403

    # 4. Reviewer approves step 1 (in_review -> in_approval)
    rev_appr = client.post(
        f"/api/v1/decisions/{decision_id}/approve",
        json={"comment": "Technical review verified and approved."},
        headers=rev_headers,
    )
    assert rev_appr.status_code == 200
    assert rev_appr.json()["current_status"] == "in_approval"
    steps2 = rev_appr.json()["steps"]
    assert steps2[0]["status"] == "approved"
    assert steps2[1]["status"] == "pending"

    # 5. Manager approves step 2 (in_approval -> approved)
    mgr_appr = client.post(
        f"/api/v1/decisions/{decision_id}/approve",
        json={"comment": "Executive budget authorized."},
        headers=mgr_headers,
    )
    assert mgr_appr.status_code == 200
    assert mgr_appr.json()["current_status"] == "approved"
    steps3 = mgr_appr.json()["steps"]
    assert steps3[0]["status"] == "approved"
    assert steps3[1]["status"] == "approved"

    # Verify decision state
    dec_check = client.get(f"/api/v1/decisions/{decision_id}", headers=emp_headers)
    assert dec_check.json()["status"] == "approved"
    assert dec_check.json()["implementation_status"] == "in_progress"


def test_rejection_workflow(
    client: TestClient,
    employee_user: tuple,
    reviewer_user: tuple,
) -> None:
    _, _, emp_headers = employee_user
    _, _, rev_headers = reviewer_user

    d_res = client.post(
        "/api/v1/decisions",
        json={
            "title": "Rejection Test Case",
            "problem_statement": "Testing rejection workflow transition.",
        },
        headers=emp_headers,
    )
    decision_id = d_res.json()["id"]
    client.post(f"/api/v1/decisions/{decision_id}/alternatives", json={"title": "Alt 1"}, headers=emp_headers)
    client.post(f"/api/v1/decisions/{decision_id}/submit", headers=emp_headers)

    rej_res = client.post(
        f"/api/v1/decisions/{decision_id}/reject",
        json={"comment": "Insufficient evidence of scalability."},
        headers=rev_headers,
    )
    assert rej_res.status_code == 200
    assert rej_res.json()["current_status"] == "rejected"
