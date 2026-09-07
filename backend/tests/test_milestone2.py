import io
import pytest
from app.models import DecisionStatus, CommentType

# ==============================================================================
# TEST 1: Decision Lifecycle & Automated Version History Snapshotting
# ==============================================================================

def test_decision_lifecycle_and_automated_versioning(client, auth_headers):
    headers = auth_headers["admin"]

    # 1. Create a Decision
    create_payload = {
        "title": "Migrate Monolith to Distributed Cloud Microservices",
        "problem_statement": "The monolith backend experiences database lock contention under high concurrent loads.",
        "category": "Infrastructure",
        "status": "Draft"
    }
    res = client.post("/api/v1/decisions", json=create_payload, headers=headers)
    assert res.status_code == 201, res.text
    decision = res.json()
    decision_id = decision["id"]
    assert decision["title"] == create_payload["title"]
    assert decision["status"] == "Draft"
    assert decision["version_count"] == 1

    # Verify Version 1 snapshot was automatically persisted
    ver_res = client.get(f"/api/v1/decisions/{decision_id}/versions", headers=headers)
    assert ver_res.status_code == 200
    versions = ver_res.json()
    assert len(versions) == 1
    assert versions[0]["version_number"] == 1
    assert versions[0]["change_summary"] == "Initial decision created."
    assert versions[0]["snapshot_data"]["title"] == create_payload["title"]

    # 2. Modify the Decision (Title, Status, and Problem Statement)
    update_payload = {
        "title": "Migrate Monolith to Event-Driven Microservices on Kubernetes",
        "problem_statement": "Updated problem statement: Legacy database bottleneck plus high message queue latency.",
        "category": "Infrastructure",
        "status": "Under Review",
        "change_summary": "Refined architecture scope to include Kubernetes and event bus."
    }
    update_res = client.put(f"/api/v1/decisions/{decision_id}", json=update_payload, headers=headers)
    assert update_res.status_code == 200
    updated = update_res.json()
    assert updated["title"] == update_payload["title"]
    assert updated["status"] == "Under Review"

    # 3. Verify Version 2 snapshot was automatically created
    ver_res2 = client.get(f"/api/v1/decisions/{decision_id}/versions", headers=headers)
    assert ver_res2.status_code == 200
    versions2 = ver_res2.json()
    assert len(versions2) == 2

    # Latest version is version 2
    v2 = versions2[0]
    assert v2["version_number"] == 2
    assert v2["change_summary"] == update_payload["change_summary"]
    assert v2["snapshot_data"]["status"] == "Under Review"
    assert v2["snapshot_data"]["title"] == update_payload["title"]

    # Retrieve specific snapshot by version number
    v1_lookup = client.get(f"/api/v1/decisions/{decision_id}/versions/1", headers=headers)
    assert v1_lookup.status_code == 200
    assert v1_lookup.json()["snapshot_data"]["status"] == "Draft"
    assert v1_lookup.json()["snapshot_data"]["title"] == create_payload["title"]

# ==============================================================================
# TEST 2: Alternatives CRUD & Side-by-Side Comparison Matrix
# ==============================================================================

def test_alternatives_crud_and_comparison_matrix(client, auth_headers):
    headers = auth_headers["manager"]

    # 1. Create a Decision
    d_res = client.post("/api/v1/decisions", json={
        "title": "Choose Primary Search and Indexing Engine",
        "problem_statement": "Full-text search queries over 10M records take > 5 seconds on PostgreSQL LIKE operators.",
        "category": "Data Architecture",
        "status": "Draft"
    }, headers=headers)
    decision_id = d_res.json()["id"]

    # 2. Add Alternative 1 (Elasticsearch)
    alt1_payload = {
        "title": "Elasticsearch Managed Cluster",
        "description": "Deploy AWS OpenSearch/Elasticsearch cluster with automated sharding.",
        "pros": ["Extremely mature ecosystem", "Rich aggregation capabilities", "Sub-millisecond query latency"],
        "cons": ["High memory consumption", "High monthly operational cost"],
        "estimated_cost": 8500.0,
        "feasibility_score": 9,
        "risk_assessment": "Low technical risk, proven stack."
    }
    alt1_res = client.post(f"/api/v1/decisions/{decision_id}/alternatives", json=alt1_payload, headers=headers)
    assert alt1_res.status_code == 201
    alt1 = alt1_res.json()
    assert alt1["title"] == "Elasticsearch Managed Cluster"
    assert len(alt1["pros"]) == 3
    assert alt1["feasibility_score"] == 9
    assert alt1["estimated_cost"] == 8500.0

    # 3. Add Alternative 2 (Meilisearch)
    alt2_payload = {
        "title": "Meilisearch Self-Hosted Instance",
        "description": "Deploy lightweight Rust-based Meilisearch on existing compute nodes.",
        "pros": ["Low RAM footprint", "Typo-tolerance out of the box", "Minimal configuration needed"],
        "cons": ["Less suitable for complex analytical aggregations", "Smaller enterprise community"],
        "estimated_cost": 1200.0,
        "feasibility_score": 7,
        "risk_assessment": "Moderate risk for non-standard analytics queries."
    }
    alt2_res = client.post(f"/api/v1/decisions/{decision_id}/alternatives", json=alt2_payload, headers=headers)
    assert alt2_res.status_code == 201
    alt2 = alt2_res.json()
    assert alt2["title"] == "Meilisearch Self-Hosted Instance"

    # 4. Fetch Side-by-Side Comparison Matrix
    comp_res = client.get(f"/api/v1/decisions/{decision_id}/alternatives/compare", headers=headers)
    assert comp_res.status_code == 200
    comp_data = comp_res.json()
    assert comp_data["decision_id"] == decision_id
    assert len(comp_data["alternatives"]) == 2

    metrics = comp_data["metrics"]
    assert metrics["total_alternatives"] == 2
    assert "Elasticsearch" in metrics["highest_feasibility_alternative"]
    assert "Meilisearch" in metrics["lowest_cost_alternative"]
    assert metrics["total_estimated_cost"] == 9700.0
    assert metrics["average_feasibility"] == 8.0

# ==============================================================================
# TEST 3: Document Attachment Upload & Secure Download Streaming
# ==============================================================================

def test_document_attachment_upload_and_download(client, auth_headers):
    headers = auth_headers["admin"]

    # 1. Create a Decision
    d_res = client.post("/api/v1/decisions", json={
        "title": "Zero Trust Security Implementation Framework",
        "problem_statement": "Transition all perimeter security models to identity-aware micro-segmentation.",
        "category": "Security",
        "status": "Draft"
    }, headers=headers)
    decision_id = d_res.json()["id"]

    # 2. Upload Document Attachment
    file_content = b"Security Architecture Whitepaper: Zero Trust Policy 2026. Confidential."
    file_tuple = ("zero_trust_spec.txt", io.BytesIO(file_content), "text/plain")

    upload_res = client.post(
        f"/api/v1/decisions/{decision_id}/attachments",
        files={"file": file_tuple},
        headers=headers
    )
    assert upload_res.status_code == 201, upload_res.text
    attachment = upload_res.json()
    file_id = attachment["id"]
    assert attachment["file_name"] == "zero_trust_spec.txt"
    assert attachment["file_size"] == len(file_content)
    assert attachment["mime_type"] == "text/plain"
    assert f"/api/v1/decisions/{decision_id}/attachments/{file_id}/download" in attachment["download_url"]

    # 3. List attachments
    list_res = client.get(f"/api/v1/decisions/{decision_id}/attachments", headers=headers)
    assert list_res.status_code == 200
    assert len(list_res.json()) == 1

    # 4. Download file and verify content
    dl_res = client.get(f"/api/v1/decisions/{decision_id}/attachments/{file_id}/download", headers=headers)
    assert dl_res.status_code == 200
    assert dl_res.content == file_content

# ==============================================================================
# TEST 4: Discussion Engine - Threaded Comments & Rationale Tagging
# ==============================================================================

def test_discussion_engine_threaded_comments_and_rationale(client, auth_headers):
    headers_emp = auth_headers["employee"]
    headers_rev = auth_headers["reviewer"]

    # 1. Create a Decision
    d_res = client.post("/api/v1/decisions", json={
        "title": "Migrate Frontend from Webpack to Vite",
        "problem_statement": "Webpack development build cold-start takes > 90 seconds, slowing team velocity.",
        "category": "Frontend Architecture",
        "status": "Draft"
    }, headers=headers_emp)
    decision_id = d_res.json()["id"]

    # 2. Post Top-level Meeting Note Comment
    meeting_note_payload = {
        "comment_type": "meeting_note",
        "content": "Frontend Engineering Standup: Team tested Vite HMR with React 19. Average reload reduced to 40ms."
    }
    c1_res = client.post(f"/api/v1/decisions/{decision_id}/comments", json=meeting_note_payload, headers=headers_emp)
    assert c1_res.status_code == 201
    c1 = c1_res.json()
    parent_comment_id = c1["id"]
    assert c1["comment_type"] == "meeting_note"

    # 3. Post Threaded Reply with Architectural Rationale
    rationale_payload = {
        "comment_type": "rationale",
        "content": "Rationale: Vite leverages native ESM modules and esbuild under the hood, solving our bundler bottlenecks.",
        "parent_id": parent_comment_id
    }
    c2_res = client.post(f"/api/v1/decisions/{decision_id}/comments", json=rationale_payload, headers=headers_rev)
    assert c2_res.status_code == 201
    c2 = c2_res.json()
    assert c2["parent_id"] == parent_comment_id
    assert c2["comment_type"] == "rationale"

    # 4. Fetch Discussion Tree and verify parent-child nesting
    thread_res = client.get(f"/api/v1/decisions/{decision_id}/comments", headers=headers_emp)
    assert thread_res.status_code == 200
    tree = thread_res.json()
    assert len(tree) == 1  # 1 top-level thread
    root_comment = tree[0]
    assert root_comment["id"] == parent_comment_id
    assert len(root_comment["replies"]) == 1
    assert root_comment["replies"][0]["id"] == c2["id"]
    assert root_comment["replies"][0]["comment_type"] == "rationale"

# ==============================================================================
# TEST 5: Role-based permissions & Comprehensive Decision Detail View
# ==============================================================================

def test_decision_detail_view_and_permissions(client, auth_headers):
    headers_emp = auth_headers["employee"]
    headers_admin = auth_headers["admin"]

    # 1. Employee creates a decision
    d_res = client.post("/api/v1/decisions", json={
        "title": "Adopt OpenTelemetry for Distributed Tracing",
        "problem_statement": "Need standardized APM tracing across 15+ backend microservices.",
        "category": "Observability",
        "status": "Draft"
    }, headers=headers_emp)
    decision_id = d_res.json()["id"]

    # 2. Add an alternative
    client.post(f"/api/v1/decisions/{decision_id}/alternatives", json={
        "title": "OpenTelemetry with Grafana Tempo",
        "pros": ["Open source standard", "Zero vendor lock-in"],
        "cons": ["Requires internal hosting setup"],
        "estimated_cost": 2400.0,
        "feasibility_score": 8
    }, headers=headers_emp)

    # 3. Post a comment
    client.post(f"/api/v1/decisions/{decision_id}/comments", json={
        "comment_type": "general_comment",
        "content": "Grafana Tempo integrates cleanly with our existing Loki logs."
    }, headers=headers_emp)

    # 4. Fetch Full Decision Details view
    detail_res = client.get(f"/api/v1/decisions/{decision_id}", headers=headers_admin)
    assert detail_res.status_code == 200
    detail = detail_res.json()
    assert detail["id"] == decision_id
    assert len(detail["alternatives"]) == 1
    assert len(detail["comments"]) == 1
    assert len(detail["versions"]) >= 1

    # 5. Delete decision (Admin has permission)
    del_res = client.delete(f"/api/v1/decisions/{decision_id}", headers=headers_admin)
    assert del_res.status_code == 204

    # 6. Verify 404 after deletion
    get_res = client.get(f"/api/v1/decisions/{decision_id}", headers=headers_admin)
    assert get_res.status_code == 404
