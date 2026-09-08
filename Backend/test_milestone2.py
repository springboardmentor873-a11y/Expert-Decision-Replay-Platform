import json
import io
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_full_milestone2_flow():
    print("\n--- Running Milestone 2 Comprehensive Verification ---")

    # 1. Login
    login_res = client.post("/login", json={"email": "ipsita@company.com", "password": "password123"})
    assert login_res.status_code == 200, f"Login failed: {login_res.text}"
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    print("[PASS] User Authentication (JWT) verified.")

    # 2. Verify Profile
    me_res = client.get("/me", headers=headers)
    assert me_res.status_code == 200
    user_info = me_res.json()
    assert user_info["name"] == "Ipsita Priyadarshini"
    print(f"[PASS] User Profile retrieved: {user_info['name']} ({user_info['role_name']}).")

    # 3. Decision Management: Create Decision
    new_decision_data = {
        "title": "API Gateway Migration to Envoy",
        "problem_statement": "Evaluate replacing legacy NGINX reverse proxies with modern Envoy-based Gateway API for gRPC streaming and dynamic rate limiting.",
        "objective": "Achieve sub-5ms proxy overhead and native gRPC routing.",
        "context": "Microservices migration requires dynamic route discovery and OpenTelemetry distributed tracing.",
        "category": "Architecture",
        "priority": "High",
        "initial_alternatives": [
            {
                "title": "Option 1: Envoy Proxy with Istio Control Plane",
                "description": "Full service mesh with automated sidecar injection.",
                "pros": ["Advanced traffic splitting", "Mutual TLS by default", "Distributed tracing"],
                "cons": ["Memory footprint of sidecars", "Steep learning curve"],
                "cost_estimate": "$2,200/mo compute overhead",
                "feasibility_score": 7,
                "risk_level": "Medium",
                "mitigation_plan": "Staged rollout starting with non-critical services."
            },
            {
                "title": "Option 2: Standalone Kong Enterprise Gateway",
                "description": "Centralized API gateway cluster with Lua/Go plugins.",
                "pros": ["Proven enterprise support", "Turnkey developer portal", "Low memory footprint"],
                "cons": ["Enterprise licensing cost", "Plugin customization latency"],
                "cost_estimate": "$35,000/year license",
                "feasibility_score": 9,
                "risk_level": "Low",
                "mitigation_plan": "Negotiate multi-year volume pricing."
            }
        ]
    }
    create_res = client.post("/decisions", headers=headers, json=new_decision_data)
    assert create_res.status_code == 200, f"Decision creation failed: {create_res.text}"
    decision_id = create_res.json()["decision"]["id"]
    print(f"[PASS] Decision Created with ID #{decision_id}: '{new_decision_data['title']}'.")

    # 4. Alternative Management: Add 3rd Alternative
    alt3_data = {
        "title": "Option 3: Cloud Native AWS API Gateway HTTP APIs",
        "description": "Fully managed serverless API gateway.",
        "pros": ["Zero infrastructure management", "Direct integration with IAM and Lambdas"],
        "cons": ["10MB payload limit", "Limited custom plugin support"],
        "cost_estimate": "$1.00 per million requests",
        "feasibility_score": 8,
        "risk_level": "Low",
        "mitigation_plan": "Use S3 pre-signed URLs for oversized payloads."
    }
    add_alt_res = client.post(f"/decisions/{decision_id}/alternatives", headers=headers, json=alt3_data)
    assert add_alt_res.status_code == 200
    alt3_id = add_alt_res.json()["alternative"]["id"]
    print(f"[PASS] Alternative Option 3 added (ID #{alt3_id}).")

    # 5. Alternative Analysis: Select Solution & Rationale
    select_res = client.post(
        f"/decisions/{decision_id}/select-alternative",
        headers=headers,
        json={
            "selected_alternative_id": alt3_id,
            "decision_rationale": "Option 3 provides seamless serverless scaling with minimum operational overhead for our current transaction volume."
        }
    )
    assert select_res.status_code == 200
    print("[PASS] Solution Alternative selected and official rationale recorded.")

    # 6. Status Workflow Progression
    status_res = client.patch(
        f"/decisions/{decision_id}/status",
        headers=headers,
        json={"status": "Under Review"}
    )
    assert status_res.status_code == 200
    assert status_res.json()["decision"]["status"] == "Under Review"

    status_appr = client.patch(
        f"/decisions/{decision_id}/status",
        headers=headers,
        json={"status": "Approved"}
    )
    assert status_appr.status_code == 200
    assert status_appr.json()["decision"]["status"] == "Approved"
    print("[PASS] Decision status transitioned: Draft -> Under Review -> Approved.")

    # 7. Collaboration: Post Comment and Formal Meeting Note
    comm_res = client.post(
        f"/decisions/{decision_id}/comments",
        headers=headers,
        json={"content": "Evaluated latency test results. Option 3 p99 is 4.2ms."}
    )
    assert comm_res.status_code == 200
    print("[PASS] Discussion comment posted.")

    note_res = client.post(
        f"/decisions/{decision_id}/meeting-notes",
        headers=headers,
        json={
            "content": "Architecture Review Committee signed off on AWS HTTP API migration.",
            "meeting_attendees": "Ipsita Priyadarshini, Sarah Khan, Vikram Singh"
        }
    )
    assert note_res.status_code == 200
    print("[PASS] Formal Meeting Note with attendees recorded.")

    # 8. Document Upload & Association
    sample_file_content = b"Benchmark Evaluation Data for Gateway Migration: Envoy vs Kong vs AWS HTTP API."
    files = {
        "file": ("Gateway_Benchmark_Evaluation.pdf", io.BytesIO(sample_file_content), "application/pdf")
    }
    data = {
        "title": "Gateway Benchmark Evaluation.pdf",
        "category": "Architecture",
        "tags": '["Architecture", "Benchmark", "Gateway"]',
        "description": "Empirical latency and throughput benchmarks.",
        "decision_id": str(decision_id)
    }
    upload_res = client.post("/documents/upload", headers=headers, data=data, files=files)
    assert upload_res.status_code == 200, f"Upload failed: {upload_res.text}"
    uploaded_doc_id = upload_res.json()["document"]["id"]
    print(f"[PASS] Document uploaded and linked to decision #{decision_id} (Doc ID: #{uploaded_doc_id}).")

    # 9. Document Download
    download_res = client.get(f"/documents/{uploaded_doc_id}/download")
    assert download_res.status_code == 200
    assert download_res.content == sample_file_content
    print("[PASS] Document downloaded and verified byte-for-byte.")

    # 10. Version Tracking Audit
    versions_res = client.get(f"/decisions/{decision_id}/versions")
    assert versions_res.status_code == 200
    versions = versions_res.json()
    assert len(versions) >= 3, f"Expected at least 3 versions, got {len(versions)}"
    print(f"[PASS] Audit Version History tracked {len(versions)} sequential snapshots.")

    # 11. Knowledge Repository & Graph Endpoints
    stats_res = client.get("/knowledge-repository/stats")
    assert stats_res.status_code == 200
    stats = stats_res.json()
    print(f"[PASS] Knowledge Repository Stats: {stats['total_documents']} docs, {stats['total_decisions']} decisions.")

    graph_res = client.get("/knowledge-repository/graph")
    assert graph_res.status_code == 200
    graph = graph_res.json()
    assert len(graph["nodes"]) > 0
    assert len(graph["links"]) > 0
    print(f"[PASS] Knowledge Graph generated {len(graph['nodes'])} nodes and {len(graph['links'])} edges.")

    insights_res = client.get("/knowledge-repository/insights")
    assert insights_res.status_code == 200
    print("[PASS] Related Insights endpoint responsive.")

    print("\n>>> ALL MILESTONE 2 VERIFICATION TESTS PASSED SUCCESSFULLY! <<<\n")

if __name__ == "__main__":
    test_full_milestone2_flow()
