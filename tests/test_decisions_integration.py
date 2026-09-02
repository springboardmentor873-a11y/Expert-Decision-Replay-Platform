import os
import sys
import json
import urllib.request
import urllib.error
import subprocess
import time

# Set SQLite test database in env for test server
test_env = os.environ.copy()
test_env["DATABASE_URL"] = "sqlite:///./test_decisions_live.db"

# Start uvicorn server in backend folder
proc = subprocess.Popen(
    [sys.executable, "-m", "uvicorn", "app.main:app", "--host", "127.0.0.1", "--port", "8899"],
    cwd="backend",
    env=test_env
)

base_url = "http://127.0.0.1:8899"

# Wait for server to be responsive
ready = False
for _ in range(30):
    try:
        with urllib.request.urlopen(f"{base_url}/health", timeout=1) as r:
            if r.status == 200:
                ready = True
                break
    except Exception:
        time.sleep(0.3)

if not ready:
    proc.terminate()
    raise RuntimeError("Server failed to start on port 8899 within timeout.")

def make_request(path, method="GET", body=None, token=None):
    url = f"{base_url}{path}"
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    data = json.dumps(body).encode("utf-8") if body else None
    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req) as response:
            res_data = response.read().decode("utf-8")
            return response.status, json.loads(res_data) if res_data else None
    except urllib.error.HTTPError as e:
        error_content = e.read().decode("utf-8")
        try:
            return e.code, json.loads(error_content)
        except Exception:
            return e.code, error_content

try:
    print("==========================================================")
    print("1. REGISTERING TEST USERS (EMPLOYEE & ADMIN)")
    print("==========================================================")
    
    # 1. Register Employee
    ts = int(time.time())
    emp_email = f"emp_{ts}@company.com"
    emp_reg = {
        "full_name": "Decision Engineer",
        "email": emp_email,
        "password": "Password123!",
        "role": "Employee"
    }
    status, res = make_request("/auth/register", method="POST", body=emp_reg)
    assert status == 201
    
    # Login Employee
    status, login_res = make_request("/auth/login", method="POST", body={"email": emp_email, "password": "Password123!"})
    assert status == 200
    emp_token = login_res["access_token"]
    print(f"Employee logged in. Token: {emp_token[:20]}...")

    # 2. Register Admin
    admin_email = f"admin_{ts}@company.com"
    admin_reg = {
        "full_name": "Platform Admin",
        "email": admin_email,
        "password": "Password123!",
        "role": "Administrator"
    }
    status, res = make_request("/auth/register", method="POST", body=admin_reg)
    assert status == 201

    # Login Admin
    status, admin_login_res = make_request("/auth/login", method="POST", body={"email": admin_email, "password": "Password123!"})
    assert status == 200
    admin_token = admin_login_res["access_token"]
    print(f"Admin logged in. Token: {admin_token[:20]}...")

    print("\n==========================================================")
    print("2. TESTING DECISION CREATION (POST /decisions)")
    print("==========================================================")
    new_decision_body = {
        "title": "Migrate Event Bus to Apache Kafka",
        "problem_statement": "RabbitMQ cannot sustain peak 100k events/sec throughput.",
        "context": "Financial transaction analytics platform handling millions of events daily.",
        "decision_taken": "Adopt managed Kafka cluster with SASL/SCRAM authentication.",
        "reasoning": "Kafka provides high-throughput log partitioning, replay capabilities, and strong persistence.",
        "expected_outcome": "Support 250k events/sec with < 5ms p99 latency.",
        "actual_outcome": None
    }
    status, d_created = make_request("/decisions", method="POST", body=new_decision_body, token=emp_token)
    print(f"POST /decisions: Status {status}")
    print(f"  -> Decision ID: {d_created['id']}, Status: {d_created['status']}, Title: {d_created['title']}")
    assert status == 201
    assert d_created["status"] == "Draft"
    assert d_created["title"] == new_decision_body["title"]
    assert d_created["created_by"] is not None
    decision_id = d_created["id"]

    print("\n==========================================================")
    print("3. TESTING DECISION RETRIEVAL (GET /decisions & GET /decisions/{id})")
    print("==========================================================")
    # List decisions
    status, d_list = make_request("/decisions", method="GET", token=emp_token)
    print(f"GET /decisions: Status {status}, Count: {len(d_list)}")
    assert status == 200
    assert len(d_list) >= 1
    assert d_list[0]["id"] == decision_id

    # Single decision
    status, d_single = make_request(f"/decisions/{decision_id}", method="GET", token=emp_token)
    print(f"GET /decisions/{decision_id}: Status {status}, Title: {d_single['title']}")
    assert status == 200
    assert d_single["id"] == decision_id

    print("\n==========================================================")
    print("4. TESTING DECISION UPDATE (PATCH /decisions/{id})")
    print("==========================================================")
    patch_body = {
        "title": "Migrate Event Bus to Apache Kafka Cluster",
        "expected_outcome": "Support 300k events/sec with < 3ms p99 latency."
    }
    status, d_patched = make_request(f"/decisions/{decision_id}", method="PATCH", body=patch_body, token=emp_token)
    print(f"PATCH /decisions/{decision_id}: Status {status}, New Title: {d_patched['title']}")
    assert status == 200
    assert d_patched["title"] == "Migrate Event Bus to Apache Kafka Cluster"
    assert d_patched["expected_outcome"] == "Support 300k events/sec with < 3ms p99 latency."

    print("\n==========================================================")
    print("5. TESTING DECISION SUBMISSION (POST /decisions/{id}/submit)")
    print("==========================================================")
    status, d_submitted = make_request(f"/decisions/{decision_id}/submit", method="POST", token=emp_token)
    print(f"POST /decisions/{decision_id}/submit: Status {status}, Status: {d_submitted['status']}")
    assert status == 200
    assert d_submitted["status"] == "Submitted"

    # Try modifying core fields after submission (must be blocked for standard user)
    status, blocked_patch = make_request(f"/decisions/{decision_id}", method="PATCH", body={"title": "Hacked After Submit"}, token=emp_token)
    print(f"PATCH /decisions/{decision_id} after submit (Employee): Status {status} -> {blocked_patch}")
    assert status == 400

    print("\n==========================================================")
    print("6. TESTING ADMIN ACCESS & APPROVAL (PATCH /decisions/{id})")
    print("==========================================================")
    admin_patch = {
        "status": "Approved",
        "actual_outcome": "Successfully achieved 320k events/sec in load testing."
    }
    status, d_approved = make_request(f"/decisions/{decision_id}", method="PATCH", body=admin_patch, token=admin_token)
    print(f"Admin Approval PATCH: Status {status}, Final Status: {d_approved['status']}")
    assert status == 200
    assert d_approved["status"] == "Approved"
    assert d_approved["actual_outcome"] == admin_patch["actual_outcome"]

    print("\n==========================================================")
    print("7. TESTING UNAUTHENTICATED & UNAUTHORIZED RESTRICTIONS")
    print("==========================================================")
    # Unauthenticated create
    status, unauth_res = make_request("/decisions", method="POST", body=new_decision_body)
    print(f"POST /decisions (No token): Status {status}")
    assert status == 401

    # Unauthenticated get
    status, unauth_get = make_request(f"/decisions/{decision_id}", method="GET")
    print(f"GET /decisions/{decision_id} (No token): Status {status}")
    assert status == 401

    print("\n==========================================================")
    print("ALL LIVE DECISION API INTEGRATION TESTS PASSED 100%!")
    print("==========================================================")

finally:
    proc.terminate()
    proc.wait()
    if os.path.exists("backend/test_decisions_live.db"):
        try:
            os.remove("backend/test_decisions_live.db")
        except Exception:
            pass