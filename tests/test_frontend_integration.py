import os
import sys
import json
import urllib.request
import urllib.error
import subprocess
import time

# Set SQLite test database in env for test server
test_env = os.environ.copy()
test_env["DATABASE_URL"] = "sqlite:///./test_integration_frontend.db"

# Start uvicorn server in backend folder
proc = subprocess.Popen(
    [sys.executable, "-m", "uvicorn", "app.main:app", "--host", "127.0.0.1", "--port", "8765"],
    cwd="backend",
    env=test_env
)

base_url = "http://127.0.0.1:8765"

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
    raise RuntimeError("Server failed to start on port 8765 within timeout.")

def make_request(path, method="GET", body=None, token=None):
    url = f"{base_url}{path}"
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    data = json.dumps(body).encode("utf-8") if body else None
    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req) as response:
            return response.status, json.loads(response.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        error_content = e.read().decode("utf-8")
        try:
            return e.code, json.loads(error_content)
        except Exception:
            return e.code, error_content

try:
    print("=== 1. Testing Health Endpoint ===")
    status, res = make_request("/health")
    print(f"GET /health: {status} -> {res}")
    assert status == 200

    print("\n=== 2. Testing User Registration (Flow 1-3) ===")
    reg_body = {
        "full_name": "Frontend Test User",
        "email": f"frontend_{int(time.time())}@example.com",
        "password": "FrontendPassword123",
        "role": "Manager"
    }
    status, reg_res = make_request("/auth/register", method="POST", body=reg_body)
    print(f"POST /auth/register: {status} -> ID: {reg_res.get('id')}, Role: {reg_res.get('role', {}).get('name')}")
    assert status == 201
    assert reg_res["email"] == reg_body["email"]
    assert reg_res["role"]["name"] == "Manager"
    assert "hashed_password" not in reg_res

    print("\n=== 3. Testing User Login (Flow 4-6) ===")
    login_body = {
        "email": reg_body["email"],
        "password": "FrontendPassword123"
    }
    status, login_res = make_request("/auth/login", method="POST", body=login_body)
    print(f"POST /auth/login: {status} -> token_type: {login_res.get('token_type')}, token: {login_res.get('access_token')[:25]}...")
    assert status == 200
    assert login_res["token_type"] == "bearer"
    jwt_token = login_res["access_token"]

    print("\n=== 4. Testing Authenticated GET /auth/me (Flow 7-10) ===")
    status, me_res = make_request("/auth/me", method="GET", token=jwt_token)
    print(f"GET /auth/me: {status} -> Name: {me_res.get('full_name')}, Email: {me_res.get('email')}, Role: {me_res.get('role', {}).get('name')}, Active: {me_res.get('is_active')}")
    assert status == 200
    assert me_res["full_name"] == "Frontend Test User"
    assert me_res["email"] == reg_body["email"]
    assert me_res["role"]["name"] == "Manager"
    assert me_res["is_active"] is True
    assert "hashed_password" not in me_res

    print("\n=== 5. Testing Unauthenticated Request to GET /auth/me (Flow 13-14) ===")
    status, unauth_res = make_request("/auth/me", method="GET")
    print(f"GET /auth/me (no token): {status} -> {unauth_res}")
    assert status == 401

    print("\n=== 6. Testing Invalid Login Credentials (Flow 15) ===")
    status, bad_login = make_request("/auth/login", method="POST", body={"email": reg_body["email"], "password": "WrongPassword"})
    print(f"POST /auth/login (bad password): {status} -> {bad_login}")
    assert status == 401

    print("\n=== 7. Testing Invalid Registration Input (Flow 16) ===")
    status, bad_reg = make_request("/auth/register", method="POST", body={"full_name": "", "email": "not-an-email", "password": "123", "role": "FakeRole"})
    print(f"POST /auth/register (invalid data): {status} -> {bad_reg}")
    assert status in (400, 422)

    print("\n=======================================================")
    print("ALL FRONTEND-BACKEND INTEGRATION TESTS PASSED 100%!")
    print("=======================================================")
finally:
    proc.terminate()
    proc.wait()
    if os.path.exists("backend/test_integration_frontend.db"):
        try:
            os.remove("backend/test_integration_frontend.db")
        except Exception:
            pass