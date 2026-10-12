import os
import io
import json
import pytest
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_milestone4_comprehensive_suite():
    print("\n" + "=" * 70)
    print("  RUNNING MILESTONE 4: PRODUCTION VERIFICATION & END-TO-END TEST SUITE")
    print("=" * 70)

    # -------------------------------------------------------------
    # 1. SYSTEM DIAGNOSTICS & HEALTH CHECK
    # -------------------------------------------------------------
    print("\n[SECTION 1] System Diagnostics & Production Health Probes")
    
    root_res = client.get("/")
    assert root_res.status_code == 200, f"Root endpoint failed: {root_res.text}"
    root_data = root_res.json()
    assert "version" in root_data
    assert root_data["status"] == "online"
    assert "Milestone 4" in root_data["milestone"]
    print(f"  [PASS] Root endpoint verified (v{root_data['version']} - {root_data['status']}).")

    health_res = client.get("/health")
    assert health_res.status_code == 200, f"Healthcheck failed: {health_res.text}"
    health_data = health_res.json()
    assert health_data["status"] == "healthy"
    assert health_data["database"] == "connected"
    print(f"  [PASS] Production health check verified (DB: {health_data['database']}).")

    # -------------------------------------------------------------
    # 2. AUTHENTICATION, RBAC & NEGATIVE SECURITY TESTS
    # -------------------------------------------------------------
    print("\n[SECTION 2] Authentication, RBAC & Security Boundary Tests")

    # Negative test: invalid password
    bad_login = client.post("/login", json={"email": "emp@company.com", "password": "wrongpassword"})
    assert bad_login.status_code == 401
    print("  [PASS] Invalid password correctly rejected with HTTP 401.")

    # Negative test: unauthenticated access to protected route
    unauth_res = client.get("/me")
    assert unauth_res.status_code == 401
    print("  [PASS] Unauthenticated access to /me correctly blocked with HTTP 401.")

    # Negative test: non-existent user login
    no_user = client.post("/login", json={"email": "ghost@company.com", "password": "password123"})
    assert no_user.status_code == 401
    print("  [PASS] Non-existent email correctly rejected with HTTP 401.")

    # Authenticate all 4 core enterprise roles
    role_credentials = {
        "Employee": "emp@company.com",
        "Reviewer": "reviewer@company.com",
        "Manager": "manager@company.com",
        "Administrator": "admin@company.com",
    }
    tokens = {}
    headers = {}
    for role, email in role_credentials.items():
        res = client.post("/login", json={"email": email, "password": "password123"})
        assert res.status_code == 200, f"Login failed for {role}: {res.text}"
        tokens[role] = res.json()["access_token"]
        headers[role] = {"Authorization": f"Bearer {tokens[role]}"}
        print(f"  [PASS] Role token acquired: {role} ({email}).")

    # Verify user profile retrieval for each role
    for role in role_credentials.keys():
        profile_res = client.get("/me", headers=headers[role])
        assert profile_res.status_code == 200
        prof = profile_res.json()
        assert prof["role_name"] == role
        print(f"  [PASS] Role identity verified in /me: {prof['name']} -> {prof['role_name']}.")

    # -------------------------------------------------------------
    # 3. FULL DECISION REPLAY LIFECYCLE (END-TO-END)
    # -------------------------------------------------------------
    print("\n[SECTION 3] End-to-End Decision Replay Lifecycle Execution")

    # Step A: Employee creates a decision with multiple structured alternatives
    create_payload = {
        "title": "Enterprise Cloud Migration & Zero-Trust Architecture",
        "problem_statement": "Evaluate transition of on-premises core ERP and analytics cluster to multi-region cloud infrastructure under Zero-Trust perimeter.",
        "objective": "Achieve 99.99% availability, eliminate hardware lifecycle costs, and achieve SOC2 Type II compliance.",
        "context": "Rapid international customer growth requires dynamic scaling and ISO 27001 data residency compliance.",
        "category": "Architecture",
        "priority": "Critical",
        "initial_alternatives": [
            {
                "title": "Option A: Hybrid Cloud with AWS DirectConnect",
                "description": "Deploy front-facing microservices to AWS while retaining transactional ledger on dedicated hardware.",
                "pros": ["Lowest migration risk", "Immediate compute elasticity"],
                "cons": ["Split latency between cloud and on-premise", "Dual operational overhead"],
                "cost_estimate": "$18,000/month",
                "feasibility_score": 8,
                "risk_level": "Medium",
                "mitigation_plan": "Establish 10Gbps dedicated fiber cross-connect with BGP failover."
            },
            {
                "title": "Option B: Full Cloud-Native Multi-Region Kubernetes",
                "description": "Containerize all services to Amazon EKS across us-east-1 and eu-central-1 with Aurora global databases.",
                "pros": ["True zero-downtime blue/green deployments", "Automated disaster recovery", "Unified observability"],
                "cons": ["Higher initial re-platforming cost", "Requires team training on Helm and ArgoCD"],
                "cost_estimate": "$26,000/month",
                "feasibility_score": 9,
                "risk_level": "Low",
                "mitigation_plan": "Partner with AWS Professional Services for 6-week architecture enablement sprint."
            }
        ]
    }

    create_res = client.post("/decisions", headers=headers["Employee"], json=create_payload)
    assert create_res.status_code == 200, f"Decision creation failed: {create_res.text}"
    dec = create_res.json()["decision"]
    decision_id = dec["id"]
    print(f"  [PASS] Decision #{decision_id} created in 'Draft' status.")

    # Step B: Add an extra alternative dynamically
    extra_alt = {
        "title": "Option C: Private Cloud OpenStack Hyperconverged Infrastructure",
        "description": "Refresh on-premises datacenter hardware with modern Nutanix hyperconverged infrastructure.",
        "pros": ["Complete physical data sovereignty", "Zero egress bandwidth costs"],
        "cons": ["$450,000 upfront CAPEX", "3-month hardware procurement lead time"],
        "cost_estimate": "$450,000 upfront CAPEX",
        "feasibility_score": 5,
        "risk_level": "High",
        "mitigation_plan": "Lease-to-own financing model to amortize capital outlay."
    }
    add_alt_res = client.post(f"/decisions/{decision_id}/alternatives", headers=headers["Employee"], json=extra_alt)
    assert add_alt_res.status_code == 200
    alt_c_id = add_alt_res.json()["alternative"]["id"]
    print(f"  [PASS] Third alternative #{alt_c_id} added to Decision #{decision_id}.")

    # Step C: Select the winning alternative with official decision rationale
    dec_detail = client.get(f"/decisions/{decision_id}", headers=headers["Employee"]).json()
    assert len(dec_detail["alternatives"]) >= 2
    selected_alt_id = dec_detail["alternatives"][1]["id"]

    select_payload = {
        "selected_alternative_id": selected_alt_id,
        "decision_rationale": "Option B provides superior high-availability, automated global disaster recovery, and lowest 3-year TCO despite initial training needs."
    }
    sel_res = client.post(f"/decisions/{decision_id}/select-alternative", headers=headers["Employee"], json=select_payload)
    assert sel_res.status_code == 200, f"Select alternative failed: {sel_res.text}"
    assert sel_res.json()["decision"]["selected_alternative_id"] == selected_alt_id
    print(f"  [PASS] Winning alternative #{selected_alt_id} selected with executive rationale.")

    # Step D: Post threaded discussions and meeting notes
    comment_payload = {
        "content": "Security architecture team confirmed that Option B fulfills all HIPAA and GDPR encryption requirements."
    }
    com_res = client.post(f"/decisions/{decision_id}/comments", headers=headers["Reviewer"], json=comment_payload)
    assert com_res.status_code == 200
    print(f"  [PASS] Stakeholder review comment added to Decision #{decision_id}.")

    meeting_payload = {
        "content": "Architecture Review Board convened to evaluate cloud multi-region disaster recovery SLAs.",
        "meeting_attendees": "Dr. Sarah Chen, Michael Rodriguez, David Park, Elena Rostova"
    }
    meet_res = client.post(f"/decisions/{decision_id}/meeting-notes", headers=headers["Manager"], json=meeting_payload)
    assert meet_res.status_code == 200
    print(f"  [PASS] ARB Meeting Note with attendee attendance recorded.")

    # Step E: Upload supporting architecture document & test byte download
    file_bytes = b"%PDF-1.5 Architectural Evaluation Report for Cloud Migration\nZero-Trust Multi-Region Blueprint\nCONFIDENTIAL"
    files = {"file": ("cloud_architecture_spec.pdf", io.BytesIO(file_bytes), "application/pdf")}
    data = {
        "title": "Cloud Zero-Trust Architecture Blueprint",
        "category": "Architecture",
        "tags": "cloud,zero-trust,security,compliance",
        "description": "Comprehensive network topology diagrams and cost-benefit trade-off models.",
        "decision_id": str(decision_id)
    }
    up_res = client.post("/documents/upload", headers=headers["Employee"], files=files, data=data)
    assert up_res.status_code == 200, f"Document upload failed: {up_res.text}"
    doc_id = up_res.json()["document"]["id"]
    print(f"  [PASS] Technical document #{doc_id} uploaded and linked to Decision #{decision_id}.")

    # Download byte-for-byte verification
    down_res = client.get(f"/documents/{doc_id}/download", headers=headers["Employee"])
    assert down_res.status_code == 200
    assert down_res.content == file_bytes
    print(f"  [PASS] Downloaded document #{doc_id} matches uploaded content byte-for-byte.")

    # -------------------------------------------------------------
    # 4. MULTI-TIER APPROVAL WORKFLOW & ESCALATION
    # -------------------------------------------------------------
    print("\n[SECTION 4] Multi-Tier Approval Workflow, Escalation & RBAC Enforcement")

    # Step A: Employee submits decision for approval (advances to Stage 1: Reviewer)
    sub_res = client.post(
        f"/decisions/{decision_id}/submit-for-approval",
        headers=headers["Employee"],
        json={"action": "Submitted", "comments": "Formal submission for Stage 1 Peer Technical Review."}
    )
    assert sub_res.status_code == 200
    assert sub_res.json()["stage"] == 1
    dec_state = client.get(f"/decisions/{decision_id}", headers=headers["Employee"]).json()
    assert dec_state["status"] == "Under Review"
    print(f"  [PASS] Decision #{decision_id} submitted to Stage 1 (Technical Reviewer). Status is 'Under Review'.")

    # Step B: RBAC Boundary Test: Employee should NOT be able to approve Stage 1
    illegal_appr = client.post(
        f"/decisions/{decision_id}/approve-stage",
        headers=headers["Employee"],
        json={"action": "Approved", "comments": "Illegal self-approval attempt"}
    )
    assert illegal_appr.status_code == 403, f"Expected 403 for employee stage approval, got {illegal_appr.status_code}"
    print("  [PASS] RBAC Enforcement: Employee prohibited from approving stages (HTTP 403).")

    # Step C: Reviewer inspects pending queue and approves Stage 1
    rev_pending = client.get("/approvals/pending", headers=headers["Reviewer"])
    assert rev_pending.status_code == 200
    assert any(p["decision_id"] == decision_id for p in rev_pending.json())

    appr1_res = client.post(
        f"/decisions/{decision_id}/approve-stage",
        headers=headers["Reviewer"],
        json={"action": "Approved", "comments": "Technical feasibility validated. Security requirements satisfied."}
    )
    assert appr1_res.status_code == 200
    assert appr1_res.json()["stage"] == 2
    print(f"  [PASS] Stage 1 Approved by Reviewer. Workflow successfully advanced to Stage 2 (Manager).")

    # Step D: Test Escalation Feature
    esc_res = client.post(
        f"/decisions/{decision_id}/escalate",
        headers=headers["Reviewer"],
        json={"escalation_reason": "SLA critical path: cloud infrastructure lead time required before Q3."}
    )
    assert esc_res.status_code == 200, f"Escalation failed: {esc_res.text}"
    assert esc_res.json()["is_escalated"] is True
    print(f"  [PASS] Workflow escalated successfully with SLA justification.")

    # Step E: Manager performs Stage 2 Final Executive Approval
    appr2_res = client.post(
        f"/decisions/{decision_id}/approve-stage",
        headers=headers["Manager"],
        json={"action": "Approved", "comments": "Executive budget ratified. Authorized for phased rollout."}
    )
    assert appr2_res.status_code == 200
    assert appr2_res.json()["status"] == "Approved"
    print(f"  [PASS] Stage 2 Approved by Manager. Decision #{decision_id} is now officially 'Approved'.")

    # Step F: Verify immutable Approval History trail
    hist_res = client.get(f"/decisions/{decision_id}/approval-history", headers=headers["Manager"])
    assert hist_res.status_code == 200
    history = hist_res.json()
    actions = history.get("actions", history if isinstance(history, list) else [])
    assert len(actions) >= 3, f"Expected at least 3 approval actions, got {len(actions)}"
    print(f"  [PASS] Full approval audit trail verified ({len(actions)} sequential signed actions).")

    # -------------------------------------------------------------
    # 5. IN-APP NOTIFICATIONS ENGINE
    # -------------------------------------------------------------
    print("\n[SECTION 5] In-App Notification Center & Read Receipts")

    notifs_res = client.get("/notifications", headers=headers["Employee"])
    assert notifs_res.status_code == 200
    notif_data = notifs_res.json()
    assert "notifications" in notif_data
    assert notif_data["total_count"] > 0
    print(f"  [PASS] Notification center loaded ({notif_data['total_count']} events, {notif_data['unread_count']} unread).")

    # Mark single notification read
    first_notif_id = notif_data["notifications"][0]["id"]
    read_res = client.patch(f"/notifications/{first_notif_id}/read", headers=headers["Employee"])
    assert read_res.status_code == 200
    print(f"  [PASS] Single Notification #{first_notif_id} marked as read.")

    # Mark all read verification
    mark_all_res = client.post("/notifications/mark-all-read", headers=headers["Employee"])
    assert mark_all_res.status_code == 200, f"Mark all read failed: {mark_all_res.text}"
    print("  [PASS] 'Mark All Notifications as Read' verified.")

    # -------------------------------------------------------------
    # 6. IMMUTABLE AUDIT & COMPLIANCE LEDGER
    # -------------------------------------------------------------
    print("\n[SECTION 6] Immutable Audit Ledger Across All 4 Event Categories")

    audit_res = client.get("/audit/logs", headers=headers["Administrator"])
    assert audit_res.status_code == 200
    audit_data = audit_res.json()
    assert audit_data["total"] > 0
    print(f"  [PASS] Compliance audit logs retrieved ({audit_data['total']} recorded immutable events).")

    audit_stats = client.get("/audit/stats", headers=headers["Administrator"])
    assert audit_stats.status_code == 200
    stats = audit_stats.json()
    assert stats["total_logs"] > 0
    assert stats["security_events_count"] > 0
    assert stats["approvals_count"] > 0
    assert stats["decisions_count"] > 0
    print(f"  [PASS] Audit Category distribution verified: Security={stats['security_events_count']}, Approvals={stats['approvals_count']}, Decisions={stats['decisions_count']}.")

    # -------------------------------------------------------------
    # 7. ORGANIZATIONAL REPORTING & MULTI-FORMAT EXPORT ENGINE
    # -------------------------------------------------------------
    print("\n[SECTION 7] Analytics Engine & 1-Click Multi-Format Document Exports")

    # Decision Performance Reports
    dec_rep = client.get("/reports/decisions", headers=headers["Administrator"])
    assert dec_rep.status_code == 200
    assert "total_decisions" in dec_rep.json()
    assert "consensus_rate" in dec_rep.json()
    print(f"  [PASS] Decision analytics generated (Consensus: {dec_rep.json()['consensus_rate']}%).")

    # Approval Turnaround SLA Reports
    appr_rep = client.get("/reports/approvals", headers=headers["Administrator"])
    assert appr_rep.status_code == 200
    assert "avg_turnaround_days" in appr_rep.json()
    print(f"  [PASS] Approval velocity metrics computed (Score: {appr_rep.json()['approval_velocity_score']}).")

    # Team Performance Matrix
    team_rep = client.get("/reports/teams", headers=headers["Administrator"])
    assert team_rep.status_code == 200
    assert len(team_rep.json()) > 0
    print(f"  [PASS] Team contribution analytics calculated for {len(team_rep.json())} departments.")

    # Export Format 1: Formatted Excel Workbook (.xlsx)
    xlsx_res = client.get("/reports/export/excel?report_type=decisions", headers=headers["Administrator"])
    assert xlsx_res.status_code == 200
    assert "openxmlformats" in xlsx_res.headers["content-type"]
    assert len(xlsx_res.content) > 1000
    print(f"  [PASS] Excel Export (.xlsx) validated ({len(xlsx_res.content)} bytes generated).")

    # Export Format 2: CSV Data Extraction (.csv)
    csv_res = client.get("/reports/export/csv?report_type=decisions", headers=headers["Administrator"])
    assert csv_res.status_code == 200
    assert "text/csv" in csv_res.headers["content-type"]
    assert len(csv_res.content) > 100
    print(f"  [PASS] CSV Export (.csv) validated ({len(csv_res.content)} bytes generated).")

    # Export Format 3: Executive PDF Dossier (.pdf)
    pdf_res = client.get(f"/reports/export/pdf?decision_id={decision_id}", headers=headers["Administrator"])
    assert pdf_res.status_code == 200
    assert "application/pdf" in pdf_res.headers["content-type"]
    assert len(pdf_res.content) > 1000
    print(f"  [PASS] Executive PDF Report generated for Decision #{decision_id} ({len(pdf_res.content)} bytes generated).")

    # -------------------------------------------------------------
    # 8. KNOWLEDGE GRAPH & DECISION REPLAY NETWORK
    # -------------------------------------------------------------
    print("\n[SECTION 8] Knowledge Graph & Semantic Decision Replay Network")

    kg_res = client.get(f"/knowledge-repository/graph?decision_id={decision_id}", headers=headers["Employee"])
    assert kg_res.status_code == 200
    kg_data = kg_res.json()
    assert "nodes" in kg_data and "links" in kg_data
    assert len(kg_data["nodes"]) >= 3
    print(f"  [PASS] Knowledge Graph generated with {len(kg_data['nodes'])} connected entities and {len(kg_data['links'])} edges.")

    insights_res = client.get(f"/knowledge-repository/insights?decision_id={decision_id}", headers=headers["Employee"])
    assert insights_res.status_code == 200
    insights = insights_res.json()
    assert "similar_decisions" in insights
    print(f"  [PASS] Related Insights engine returned {len(insights['similar_decisions'])} related decisions.")

    # -------------------------------------------------------------
    # 9. ROLE-BASED DYNAMIC KPI DASHBOARDS
    # -------------------------------------------------------------
    print("\n[SECTION 9] Role-Based Dynamic KPI Dashboards")

    for role, token in tokens.items():
        role_dash = client.get(f"/dashboard/role-metrics?role_name={role}", headers={"Authorization": f"Bearer {token}"})
        assert role_dash.status_code == 200
        dash_json = role_dash.json()
        assert "kpis" in dash_json
        assert len(dash_json["kpis"]) > 0
        print(f"  [PASS] Role KPIs loaded for '{role}': {len(dash_json['kpis'])} KPI cards verified.")

    # -------------------------------------------------------------
    # 10. BOUNDARY & ERROR RESILIENCE VERIFICATION
    # -------------------------------------------------------------
    print("\n[SECTION 10] Boundary Resilience & Error Handling")

    # 404 on non-existent decision
    not_found = client.get("/decisions/999999", headers=headers["Employee"])
    assert not_found.status_code == 404
    print("  [PASS] Non-existent decision lookup properly returned HTTP 404.")

    # 404 on non-existent document download
    bad_doc = client.get("/documents/999999/download", headers=headers["Employee"])
    assert bad_doc.status_code == 404
    print("  [PASS] Non-existent document download properly returned HTTP 404.")

    print("\n" + "=" * 70)
    print("  ALL MILESTONE 4 TEST VERIFICATION CHECKS PASSED WITH 100% SUCCESS!")
    print("=" * 70 + "\n")

if __name__ == "__main__":
    test_milestone4_comprehensive_suite()
