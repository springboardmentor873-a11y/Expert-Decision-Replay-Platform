import json
import io
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_full_milestone3_flow():
    print("\n=======================================================")
    print("  RUNNING MILESTONE 3 AUTOMATED VERIFICATION SUITE")
    print("=======================================================")

    # 1. Test Login for All 4 Roles
    roles = [
        ("Employee", "emp@company.com"),
        ("Reviewer", "reviewer@company.com"),
        ("Manager", "manager@company.com"),
        ("Administrator", "admin@company.com"),
    ]
    tokens = {}
    for role_name, email in roles:
        res = client.post("/login", json={"email": email, "password": "password123"})
        assert res.status_code == 200, f"Login failed for {email}: {res.text}"
        tokens[role_name] = res.json()["access_token"]
        print(f"[PASS] {role_name} Authentication ({email}) verified.")

    emp_headers = {"Authorization": f"Bearer {tokens['Employee']}"}
    rev_headers = {"Authorization": f"Bearer {tokens['Reviewer']}"}
    mgr_headers = {"Authorization": f"Bearer {tokens['Manager']}"}
    adm_headers = {"Authorization": f"Bearer {tokens['Administrator']}"}

    # 2. Test Multi-Level Approval Workflow Pipeline
    # Step A: Employee creates a new decision in Draft
    new_dec_payload = {
        "title": "Quantum Safe Post-Quantum Cryptography (PQC) Transition",
        "problem_statement": "Evaluate NIST-standardized Kyber/Dilithium algorithms to safeguard organizational data against future decryption.",
        "objective": "Transition high-assurance internal TLS endpoints to hybrid post-quantum cipher suites.",
        "context": "Federal compliance mandates compliance for banking and health records by 2027.",
        "category": "Security",
        "priority": "Critical",
        "initial_alternatives": [
            {
                "title": "Hybrid X25519 + ML-KEM-768 (Kyber)",
                "description": "Dual key exchange offering classical security with post-quantum defense.",
                "pros": ["Zero classical compromise risk", "NIST recommended standard"],
                "cons": ["Slightly larger handshake payload (1.2KB)"],
                "cost_estimate": "$4,000 one-time upgrade",
                "feasibility_score": 9,
                "risk_level": "Low",
                "mitigation_plan": "Staged canary rollout across microservices."
            }
        ]
    }
    create_res = client.post("/decisions", headers=emp_headers, json=new_dec_payload)
    assert create_res.status_code == 200, f"Decision creation failed: {create_res.text}"
    dec_id = create_res.json()["decision"]["id"]
    print(f"[PASS] Decision #{dec_id} ('{new_dec_payload['title']}') created in Draft state.")

    # Step B: Employee submits Decision for Approval
    submit_res = client.post(
        f"/decisions/{dec_id}/submit-for-approval",
        headers=emp_headers,
        json={"action": "Submitted", "comments": "Formal submission for Stage 1 security peer review."}
    )
    assert submit_res.status_code == 200, f"Submit failed: {submit_res.text}"
    assert submit_res.json()["stage"] == 1
    print(f"[PASS] Decision #{dec_id} successfully submitted to Stage 1 (Reviewer).")

    # Step C: Reviewer views Pending Approvals queue
    pending_res = client.get("/approvals/pending", headers=rev_headers)
    assert pending_res.status_code == 200
    pending_list = pending_res.json()
    assert any(p["decision_id"] == dec_id and p["stage"] == 1 for p in pending_list)
    print(f"[PASS] Decision #{dec_id} visible in Reviewer Pending Approvals queue ({len(pending_list)} pending).")

    # Step D: Reviewer approves Stage 1 (advances to Stage 2: Manager)
    appr1_res = client.post(
        f"/decisions/{dec_id}/approve-stage",
        headers=rev_headers,
        json={"action": "Approved", "comments": "Kyber benchmark verified. Recommended for Manager executive signoff."}
    )
    assert appr1_res.status_code == 200
    assert appr1_res.json()["stage"] == 2
    print(f"[PASS] Stage 1 Approved by Reviewer. Workflow advanced to Stage 2 (Manager Approval).")

    # Step E: Manager views Pending Approvals queue
    mgr_pending = client.get("/approvals/pending", headers=mgr_headers)
    assert mgr_pending.status_code == 200
    assert any(p["decision_id"] == dec_id and p["stage"] == 2 for p in mgr_pending.json())
    print(f"[PASS] Decision #{dec_id} visible in Manager Stage 2 Approval queue.")

    # Step F: Manager approves Stage 2 (Decision becomes fully Approved)
    appr2_res = client.post(
        f"/decisions/{dec_id}/approve-stage",
        headers=mgr_headers,
        json={"action": "Approved", "comments": "Executive budget and compliance timeline ratified."}
    )
    assert appr2_res.status_code == 200
    assert appr2_res.json()["status"] == "Approved"
    print(f"[PASS] Stage 2 Approved by Manager. Decision #{dec_id} status is now 'Approved'.")

    # Step G: Verify Approval History Timeline
    hist_res = client.get(f"/decisions/{dec_id}/approval-history", headers=emp_headers)
    assert hist_res.status_code == 200
    history = hist_res.json()
    assert len(history["actions"]) >= 3
    print(f"[PASS] Approval History verified with {len(history['actions'])} sequential actions.")

    # 3. Test Escalation Trigger
    esc_res = client.post(
        f"/decisions/{dec_id}/escalate",
        headers=emp_headers,
        json={"escalation_reason": "Expedited review required for board meeting presentation."}
    )
    assert esc_res.status_code == 200
    assert esc_res.json()["is_escalated"] == True
    print(f"[PASS] Escalation triggered successfully for Decision #{dec_id}.")

    # 4. Test In-App Notification System
    notif_res = client.get("/notifications", headers=emp_headers)
    assert notif_res.status_code == 200
    notif_data = notif_res.json()
    assert notif_data["total_count"] > 0
    print(f"[PASS] Notifications retrieved for Employee: {notif_data['total_count']} items (Unread: {notif_data['unread_count']}).")

    # Mark single notification as read
    first_notif_id = notif_data["notifications"][0]["id"]
    read_res = client.patch(f"/notifications/{first_notif_id}/read", headers=emp_headers)
    assert read_res.status_code == 200
    print(f"[PASS] Notification #{first_notif_id} marked as read.")

    # Mark all notifications read
    all_read_res = client.post("/notifications/mark-all-read", headers=emp_headers)
    assert all_read_res.status_code == 200
    print("[PASS] Mark all notifications as read verified.")

    # 5. Test Audit & Compliance Logging
    audit_res = client.get("/audit/logs", headers=adm_headers)
    assert audit_res.status_code == 200
    audit_data = audit_res.json()
    assert audit_data["total"] > 0
    print(f"[PASS] Audit Logs retrieved: {audit_data['total']} total immutable compliance events.")

    audit_stats = client.get("/audit/stats", headers=adm_headers)
    assert audit_stats.status_code == 200
    assert audit_stats.json()["total_logs"] > 0
    print(f"[PASS] Audit Statistics verified: {audit_stats.json()['total_logs']} events recorded across Security, Approvals, & Decisions.")

    # 6. Test Reports & Analytics Endpoints
    rep_dec = client.get("/reports/decisions", headers=adm_headers)
    assert rep_dec.status_code == 200
    assert "consensus_rate" in rep_dec.json()
    print(f"[PASS] Decision Reports calculated (Consensus Rate: {rep_dec.json()['consensus_rate']}%).")

    rep_appr = client.get("/reports/approvals", headers=adm_headers)
    assert rep_appr.status_code == 200
    assert "avg_turnaround_days" in rep_appr.json()
    print(f"[PASS] Approval Turnaround Reports calculated (Velocity: {rep_appr.json()['approval_velocity_score']}).")

    rep_teams = client.get("/reports/teams", headers=adm_headers)
    assert rep_teams.status_code == 200
    assert len(rep_teams.json()) > 0
    print(f"[PASS] Team Performance Reports calculated for {len(rep_teams.json())} teams.")

    # 7. Test Export Endpoints (Excel, CSV, PDF)
    # Excel
    excel_res = client.get("/reports/export/excel?report_type=decisions", headers=adm_headers)
    assert excel_res.status_code == 200
    assert len(excel_res.content) > 1000
    assert "openxmlformats" in excel_res.headers["content-type"]
    print(f"[PASS] Excel Export (.xlsx) generated successfully ({len(excel_res.content)} bytes).")

    # CSV
    csv_res = client.get("/reports/export/csv?report_type=decisions", headers=adm_headers)
    assert csv_res.status_code == 200
    assert "text/csv" in csv_res.headers["content-type"]
    print(f"[PASS] CSV Export (.csv) generated successfully ({len(csv_res.content)} bytes).")

    # PDF Summary
    pdf_res = client.get(f"/reports/export/pdf?decision_id={dec_id}", headers=adm_headers)
    assert pdf_res.status_code == 200
    assert len(pdf_res.content) > 500
    assert "application/pdf" in pdf_res.headers["content-type"]
    print(f"[PASS] Executive PDF Report generated successfully for Decision #{dec_id} ({len(pdf_res.content)} bytes).")

    # 8. Test Role-Based Dashboard Metrics
    for role_name, token in tokens.items():
        headers = {"Authorization": f"Bearer {token}"}
        dash_res = client.get(f"/dashboard/role-metrics?role_name={role_name}", headers=headers)
        assert dash_res.status_code == 200
        assert "kpis" in dash_res.json()
        print(f"[PASS] Dynamic Dashboard metrics loaded for role '{role_name}'.")

    print("\n=======================================================")
    print("  ALL MILESTONE 3 BACKEND TESTS PASSED SUCCESSFULLY! ")
    print("=======================================================\n")

if __name__ == "__main__":
    test_full_milestone3_flow()
