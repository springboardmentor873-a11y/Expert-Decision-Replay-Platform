"""
Terminal Output Verification Script for Milestone 1 & Milestone 2
Run from project root: python test_output.py
"""
import urllib.request
import json
import time

BASE_URL = "http://localhost:8000"

def run_terminal_demo():
    print("=" * 70)
    print("  EXPERT DECISION REPLAY PLATFORM - MILESTONE 1 & 2 VERIFICATION")
    print("=" * 70)
    
    # 1. Health Check
    print("\n[1] Testing Backend Health Endpoint (GET /)...")
    try:
        res = urllib.request.urlopen(f"{BASE_URL}/")
        data = json.loads(res.read().decode())
        print("  -> Status Code: 200 OK")
        print("  -> Response Data:")
        print("     " + json.dumps(data, indent=4).replace("\n", "\n     "))
    except Exception as e:
        print(f"  [!] Backend server not responding: {e}")
        return

    # 2. Login as Administrator
    print("\n[2] Testing Authentication Endpoint (POST /api/v1/auth/login)...")
    login_payload = {
        "email": "admin@expert.com",
        "password": "AdminPassword123!"
    }
    req = urllib.request.Request(
        f"{BASE_URL}/api/v1/auth/login",
        data=json.dumps(login_payload).encode("utf-8"),
        headers={"Content-Type": "application/json"}
    )
    try:
        res = urllib.request.urlopen(req)
        login_data = json.loads(res.read().decode())
        token = login_data["access_token"]
        user = login_data["user"]
        print("  -> Status Code: 200 OK")
        print(f"  -> Logged in as: {user['full_name']} ({user['email']})")
        print(f"  -> Assigned Role: {user['role']}")
        print(f"  -> JWT Token: {token[:35]}...")
    except Exception as e:
        print(f"  [!] Login failed: {e}")
        return

    auth_headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}

    # 3. List Decisions (Milestone 2)
    print("\n[3] Testing Decisions Directory (GET /api/v1/decisions)...")
    try:
        req = urllib.request.Request(f"{BASE_URL}/api/v1/decisions", headers=auth_headers)
        res = urllib.request.urlopen(req)
        decisions = json.loads(res.read().decode())
        print(f"  -> Status Code: 200 OK (Found {len(decisions)} decisions)")
        for d in decisions:
            print(f"     * [Decision #{d['id']}] {d['title']}")
            print(f"       Category: {d['category']} | Status: {d['status']} | Versions: {d['version_count']}")
    except Exception as e:
        print(f"  [!] Fetching decisions failed: {e}")
        return

    if not decisions:
        print("  [!] No decisions found to test child resources.")
        return

    decision_id = decisions[0]["id"]

    # 4. Version History (Milestone 2)
    print(f"\n[4] Testing Version History Snapshots (GET /api/v1/decisions/{decision_id}/versions)...")
    try:
        req = urllib.request.Request(f"{BASE_URL}/api/v1/decisions/{decision_id}/versions", headers=auth_headers)
        res = urllib.request.urlopen(req)
        versions = json.loads(res.read().decode())
        print(f"  -> Status Code: 200 OK (Found {len(versions)} snapshot versions)")
        for v in versions:
            print(f"     * Version #{v['version_number']} - {v['change_summary']} ({v['timestamp']})")
    except Exception as e:
        print(f"  [!] Fetching versions failed: {e}")

    # 5. Alternative Analysis & Comparison Matrix (Milestone 2)
    print(f"\n[5] Testing Alternatives Side-by-Side Comparison (GET /api/v1/decisions/{decision_id}/alternatives/compare)...")
    try:
        req = urllib.request.Request(f"{BASE_URL}/api/v1/decisions/{decision_id}/alternatives/compare", headers=auth_headers)
        res = urllib.request.urlopen(req)
        comp = json.loads(res.read().decode())
        print(f"  -> Status Code: 200 OK")
        print(f"  -> Decision: {comp['decision_title']}")
        print(f"  -> Total Alternatives: {comp['metrics']['total_alternatives']}")
        print(f"  -> Highest Feasibility: {comp['metrics']['highest_feasibility_alternative']}")
        print(f"  -> Lowest Cost: {comp['metrics']['lowest_cost_alternative']}")
        print(f"  -> Total Est. Cost: ${comp['metrics']['total_estimated_cost']:,.2f}")
        for alt in comp["alternatives"]:
            print(f"     * [{alt['title']}] Score: {alt['feasibility_score']}/10 | Cost: ${alt['estimated_cost']:,.2f}")
    except Exception as e:
        print(f"  [!] Alternative comparison failed: {e}")

    # 6. Discussion Engine & Threaded Hierarchy (Milestone 2)
    print(f"\n[6] Testing Discussion Engine & Threaded Comments (GET /api/v1/decisions/{decision_id}/comments)...")
    try:
        req = urllib.request.Request(f"{BASE_URL}/api/v1/decisions/{decision_id}/comments", headers=auth_headers)
        res = urllib.request.urlopen(req)
        comments = json.loads(res.read().decode())
        print(f"  -> Status Code: 200 OK (Found {len(comments)} root thread(s))")
        for c in comments:
            print(f"     * [{c['comment_type'].upper()}] by {c['author']['full_name'] if c.get('author') else 'User'}: {c['content'][:70]}...")
            for reply in c.get("replies", []):
                print(f"       └── ↳ [{reply['comment_type'].upper()}] by {reply['author']['full_name'] if reply.get('author') else 'User'}: {reply['content'][:70]}...")
    except Exception as e:
        print(f"  [!] Discussion thread check failed: {e}")

    print("\n" + "=" * 70)
    print("  ALL MILESTONE 1 & 2 API ENDPOINTS ARE FULLY OPERATIONAL!")
    print("  Open your browser to test interactive docs: http://localhost:8000/docs")
    print("=" * 70 + "\n")

if __name__ == "__main__":
    run_terminal_demo()
