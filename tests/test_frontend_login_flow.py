import os
import sys
import json
import urllib.request
import urllib.error
import subprocess
import time

test_env = os.environ.copy()
test_env["DATABASE_URL"] = "sqlite:///./test_login_verification.db"

proc = subprocess.Popen(
    [sys.executable, "-m", "uvicorn", "app.main:app", "--host", "127.0.0.1", "--port", "8897"],
    cwd="backend",
    env=test_env
)

base_url = "http://127.0.0.1:8897"

# Wait for server
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
    raise RuntimeError("Server failed to start on port 8897 within timeout.")

def make_req(path, method="GET", body=None, token=None):
    url = f"{base_url}{path}"
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    data = json.dumps(body).encode("utf-8") if body is not None else None
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
    print("1. REGISTERING USER VIA POST /auth/register")
    print("==========================================================")
    reg_payload = {
        "full_name": "Login Test User",
        "email": "logintest@company.com",
        "password": "Password123!",
        "role": "Reviewer"
    }
    status, reg_res = make_req("/auth/register", method="POST", body=reg_payload)
    print(f"Registration Status: {status}")
    print(f"Created User: ID={reg_res['id']}, Email={reg_res['email']}, Role={reg_res['role']['name']}")
    assert status == 201

    print("\n==========================================================")
    print("2. TESTING LOGIN VIA POST /auth/login (Exact JSON Payload)")
    print("==========================================================")
    login_payload = {
        "email": "logintest@company.com",
        "password": "Password123!"
    }
    status, login_res = make_req("/auth/login", method="POST", body=login_payload)
    print(f"Login Status: {status}")
    print(f"Token Type: {login_res.get('token_type')}")
    print(f"Access Token: {login_res.get('access_token')[:25]}...")
    assert status == 200
    assert "access_token" in login_res
    access_token = login_res["access_token"]

    print("\n==========================================================")
    print("3. TESTING GET /auth/me WITH BEARER TOKEN")
    print("==========================================================")
    status, me_res = make_req("/auth/me", method="GET", token=access_token)
    print(f"GET /auth/me Status: {status}")
    print(f"Authenticated User Profile: {me_res['full_name']} ({me_res['email']})")
    print(f"Role: {me_res['role']['name']}, Active: {me_res['is_active']}")
    assert status == 200
    assert me_res["email"] == "logintest@company.com"
    assert me_res["role"]["name"] == "Reviewer"

    print("\n==========================================================")
    print("4. TESTING INVALID PASSWORD REJECTION")
    print("==========================================================")
    status, err_res = make_req("/auth/login", method="POST", body={"email": "logintest@company.com", "password": "WrongPassword"})
    print(f"Invalid Password Status: {status} -> {err_res}")
    assert status == 401

    print("\n==========================================================")
    print("5. TESTING NON-EXISTENT EMAIL REJECTION")
    print("==========================================================")
    status, err_res2 = make_req("/auth/login", method="POST", body={"email": "nonexistent@company.com", "password": "Password123!"})
    print(f"Invalid Email Status: {status} -> {err_res2}")
    assert status == 401

    print("\n==========================================================")
    print("ALL LOGIN & AUTHENTICATION ENDPOINT TESTS PASSED 100%!")
    print("==========================================================")

finally:
    proc.terminate()
    proc.wait()
    if os.path.exists("backend/test_login_verification.db"):
        try:
            os.remove("backend/test_login_verification.db")
        except Exception:
            pass