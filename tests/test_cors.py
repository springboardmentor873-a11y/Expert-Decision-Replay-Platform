import sys
sys.path.insert(0, 'backend')

from app.main import app
from starlette.testclient import TestClient

client = TestClient(app)

for origin in ["http://localhost:5173", "http://127.0.0.1:5173"]:
    print(f"=== Testing CORS for Origin: {origin} ===")
    
    # 1. Preflight OPTIONS
    opt_headers = {
        "Origin": origin,
        "Access-Control-Request-Method": "POST",
        "Access-Control-Request-Headers": "content-type,authorization"
    }
    opt_res = client.options("/auth/register", headers=opt_headers)
    print(f"OPTIONS /auth/register: Status {opt_res.status_code}")
    print(f"  access-control-allow-origin: {opt_res.headers.get('access-control-allow-origin')}")
    print(f"  access-control-allow-credentials: {opt_res.headers.get('access-control-allow-credentials')}")
    print(f"  access-control-allow-methods: {opt_res.headers.get('access-control-allow-methods')}")
    print(f"  access-control-allow-headers: {opt_res.headers.get('access-control-allow-headers')}")
    assert opt_res.status_code == 200
    assert opt_res.headers.get("access-control-allow-origin") == origin
    assert opt_res.headers.get("access-control-allow-credentials") == "true"

    # 2. Actual POST preflight / direct call
    post_res = client.post("/auth/register", json={"full_name": "", "email": "invalid", "password": "123", "role": "Employee"}, headers={"Origin": origin})
    print(f"POST /auth/register: Status {post_res.status_code}")
    print(f"  access-control-allow-origin: {post_res.headers.get('access-control-allow-origin')}")
    assert post_res.headers.get("access-control-allow-origin") == origin

    # 3. GET /health
    health_res = client.get("/health", headers={"Origin": origin})
    print(f"GET /health: Status {health_res.status_code}")
    print(f"  access-control-allow-origin: {health_res.headers.get('access-control-allow-origin')}")
    assert health_res.headers.get("access-control-allow-origin") == origin

print("\n================================================")
print("ALL CORS HEADERS VERIFIED SUCCESSFULLY (100%)!")
print("================================================")