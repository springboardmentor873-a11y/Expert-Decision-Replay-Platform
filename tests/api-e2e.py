"""End-to-end API tests against the running Docker stack.

Defaults target http://localhost:8000. Use `localhost`, not `127.0.0.1`: on a
machine with WSL2 or local dev tooling, something else can own 127.0.0.1:8000
and answer with a stale, misconfigured server.

    API_BASE=http://127.0.0.1:5173/api python tests/api-e2e.py   # via nginx
"""

import io
import os
import sys
import time

import requests

BASE = os.getenv("API_BASE", "http://localhost:8000").rstrip("/")
WEB = os.getenv("WEB_BASE", "http://localhost:5173").rstrip("/")
# The SPA origin nginx serves, which reverse-proxies /api to the backend.
# Derived from WEB, not BASE: pointing the suite straight at the backend
# origin must not change what "through nginx" means.
PROXY = f"{WEB}/api"

passed, failed = 0, 0
failures = []


def check(name, condition, extra=""):
    global passed, failed
    if condition:
        passed += 1
        print(f"  PASS  {name}")
    else:
        failed += 1
        failures.append(name)
        print(f"  FAIL  {name} {extra}")


def section(title):
    print(f"\n=== {title} ===")


stamp = int(time.time() * 1000)
emp_email = f"emp{stamp}@example.com"
emp2_email = f"emp2{stamp}@example.com"
mgr_email = f"mgr{stamp}@example.com"

# Maps a user id to the bearer token issued for that account. The test bodies
# keep passing `?user_id=<id>`, and the helpers below translate that into the
# real `Authorization: Bearer` header so the tests exercise the shipped auth.
TOKENS = {}


def _split_user_id(url):
    """Pull `user_id` out of a URL, returning (clean_url, user_id_or_None)."""

    base, sep, query = url.partition("?")
    if not sep:
        return url, None

    kept = []
    user_id = None
    for part in query.split("&"):
        key, _, value = part.partition("=")
        if key == "user_id":
            user_id = value
        else:
            kept.append(part)

    return base + ("?" + "&".join(kept) if kept else ""), user_id


def _prepare(url, kw):
    clean_url, user_id = _split_user_id(url)
    headers = dict(kw.pop("headers", None) or {})

    if user_id is not None:
        token = TOKENS.get(user_id)
        # An unknown or malformed id gets a deliberately invalid token, so the
        # request is rejected by signature verification rather than by luck.
        headers["Authorization"] = f"Bearer {token or 'not-a-valid-token'}"

    return clean_url, {"headers": headers, **kw}


def get(url, **kw):
    clean_url, options = _prepare(url, kw)
    return requests.get(clean_url, timeout=30, **options)


def post(url, **kw):
    clean_url, options = _prepare(url, kw)
    return requests.post(clean_url, timeout=30, **options)


def put(url, **kw):
    clean_url, options = _prepare(url, kw)
    return requests.put(clean_url, timeout=30, **options)


def delete(url, **kw):
    clean_url, options = _prepare(url, kw)
    return requests.delete(clean_url, timeout=30, **options)


def login(email, password="Passw0rd!"):
    r = post(f"{BASE}/login", json={"email": email, "password": password})
    r.raise_for_status()
    data = r.json()
    TOKENS[str(data["user_id"])] = data["access_token"]
    return data


# ----------------------------------------------------------------- 1
section("1. HEALTH & BASICS")
r = get(f"{BASE}/health")
check("GET /health is healthy", r.status_code == 200 and r.json()["status"] == "healthy", r.text)
check("health reports database", r.json().get("database") == "connected")
check("GET / returns message", get(f"{BASE}/").json().get("message") is not None)
check("health reachable through nginx", get(f"{PROXY}/health").status_code == 200)

# ----------------------------------------------------------------- 2
section("2. REGISTRATION & AUTH")
r = post(f"{BASE}/register", json={"name": "Test Employee", "email": emp_email,
                                   "password": "Passw0rd!", "role": "employee"})
check("register employee", r.status_code in (200, 201), r.text)
emp_id = r.json()["user_id"]

r = post(f"{BASE}/register", json={"name": "Test Employee 2", "email": emp2_email,
                                   "password": "Passw0rd!", "role": "employee"})
check("register second employee", r.status_code in (200, 201), r.text)
emp2_id = r.json()["user_id"]

r = post(f"{BASE}/register", json={"name": "Test Manager", "email": mgr_email,
                                   "password": "Passw0rd!", "role": "manager"})
check("register requesting manager role succeeds", r.status_code in (200, 201), r.text)
mgr_id = r.json()["user_id"]
check("self-service manager registration is downgraded to employee",
      r.json()["role"] == "employee", r.text)

check("duplicate email rejected", post(f"{BASE}/register", json={
    "name": "Dup", "email": emp_email, "password": "Passw0rd!", "role": "employee"}
).status_code == 400)

check("invalid role rejected", post(f"{BASE}/register", json={
    "name": "H", "email": f"h{stamp}@example.com", "password": "Passw0rd!", "role": "root"}
).status_code == 422)

check("short password rejected", post(f"{BASE}/register", json={
    "name": "S", "email": f"s{stamp}@example.com", "password": "123", "role": "employee"}
).status_code == 422)

check("invalid email rejected", post(f"{BASE}/register", json={
    "name": "B", "email": "not-an-email", "password": "Passw0rd!", "role": "employee"}
).status_code == 422)

r = login(emp_email)
check("login employee returns a signed access token",
      r.get("token_type") == "bearer" and bool(r.get("access_token")), r)
check("login response carries the user id", r.get("user_id") == emp_id, r)
login(emp2_email)

# A manager has to be promoted by an existing manager; the bootstrap manager is
# seeded through the environment, so the suite promotes through the API using a
# seeded account when one is available.
mgr_token = None
BOOTSTRAP_EMAIL = os.getenv("BOOTSTRAP_MANAGER_EMAIL", "admin@example.com")
BOOTSTRAP_PASSWORD = os.getenv("BOOTSTRAP_MANAGER_PASSWORD", "Admin@12345")

seed_login = post(f"{BASE}/login", json={
    "email": BOOTSTRAP_EMAIL, "password": BOOTSTRAP_PASSWORD})
if seed_login.status_code == 200:
    seed_data = seed_login.json()
    TOKENS[str(seed_data["user_id"])] = seed_data["access_token"]
    r = put(f"{BASE}/users/{mgr_id}/role?user_id={seed_data['user_id']}",
            json={"role": "manager"})
    check("manager promotes another user to manager", r.status_code == 200, r.text)

    check("employee cannot change roles -> 403",
          put(f"{BASE}/users/{emp2_id}/role?user_id={emp_id}",
              json={"role": "manager"}).status_code == 403)
    check("manager cannot change own role -> 400",
          put(f"{BASE}/users/{seed_data['user_id']}/role?user_id={seed_data['user_id']}",
              json={"role": "employee"}).status_code == 400)
    check("invalid target role rejected",
          put(f"{BASE}/users/{emp_id}/role?user_id={seed_data['user_id']}",
              json={"role": "root"}).status_code == 422)
    check("role change on unknown user -> 404",
          put(f"{BASE}/users/999999/role?user_id={seed_data['user_id']}",
              json={"role": "manager"}).status_code == 404)
else:
    check("bootstrap manager available for role tests", False,
          f"login as {BOOTSTRAP_EMAIL} failed: {seed_login.text}")

login(mgr_email)

promoted = get(f"{BASE}/users/me?user_id={mgr_id}")
check("promoted account is a manager after signing in again",
      promoted.status_code == 200 and promoted.json()["role"] == "manager",
      promoted.text)

check("login manager returns a signed access token",
      TOKENS.get(str(mgr_id)) is not None)
check("wrong password -> 401", post(f"{BASE}/login", json={
    "email": emp_email, "password": "nope"}).status_code == 401)
check("unknown user -> 401", post(f"{BASE}/login", json={
    "email": f"nobody{stamp}@example.com", "password": "x"}).status_code == 401)

# ----------------------------------------------------------------- 3
section("3. AUTHORIZATION GUARDS")
check("GET /decisions without a token -> 401", get(f"{BASE}/decisions").status_code == 401)
check("GET /decisions with a forged token -> 401",
      get(f"{BASE}/decisions?user_id=999999").status_code == 401)
check("spoofing another user id in the query string does not grant access",
      requests.get(f"{BASE}/users?user_id={mgr_id}", timeout=30,
                   headers={"Authorization": f"Bearer {TOKENS[str(emp_id)]}"}).status_code == 403)
check("empty bearer token -> 401",
      get(f"{BASE}/decisions", headers={"Authorization": "Bearer "}).status_code == 401)
check("non-bearer scheme -> 401",
      get(f"{BASE}/decisions", headers={"Authorization": "Basic abc"}).status_code == 401)
check("GET /users as employee -> 403", get(f"{BASE}/users?user_id={emp_id}").status_code == 403)
r = get(f"{BASE}/users?user_id={mgr_id}")
check("GET /users as manager -> 200", r.status_code == 200, r.text)
check("GET /users hides password field",
      r.status_code == 200 and all("password" not in u for u in r.json()))

# ----------------------------------------------------------------- 4
section("4. DECISION LIFECYCLE")
r = post(f"{BASE}/decisions?user_id={emp_id}", json={
    "title": "Adopt new CRM", "problem": "Sales team needs a CRM",
    "reasoning": "Evaluate cost and adoption", "category": "Strategy"})
check("employee creates decision", r.status_code in (200, 201) and r.json()["status"] == "Draft", r.text)
dec_id = r.json()["id"]
check("decision exposes created_at", r.json().get("created_at") is not None)

check("manager cannot create decision -> 403", post(f"{BASE}/decisions?user_id={mgr_id}", json={
    "title": "M", "problem": "p", "reasoning": "r"}).status_code == 403)

r = post(f"{BASE}/decisions?user_id={emp_id}", json={
    "title": "No category decision", "problem": "p", "reasoning": "r"})
check("create decision without category", r.status_code in (200, 201) and r.json()["category"] is None)
dec2_id = r.json()["id"]

r = get(f"{BASE}/decisions?user_id={emp_id}")
check("employee sees only own decisions",
      r.status_code == 200 and len(r.json()) == 2 and all(d["user_id"] == emp_id for d in r.json()))

r = get(f"{BASE}/decisions?user_id={mgr_id}")
check("manager sees all decisions", r.status_code == 200 and len(r.json()) >= 2)

check("employee reading another employee's decision -> 403",
      get(f"{BASE}/decisions/{dec_id}?user_id={emp2_id}").status_code == 403)
check("manager reading any decision -> 200",
      get(f"{BASE}/decisions/{dec_id}?user_id={mgr_id}").status_code == 200)
check("missing decision -> 404", get(f"{BASE}/decisions/999999?user_id={mgr_id}").status_code == 404)

check("employee cannot edit decision -> 403", put(f"{BASE}/decisions/{dec_id}/edit?user_id={emp_id}",
      json={"title": "Hacked"}).status_code == 403)
r = put(f"{BASE}/decisions/{dec_id}/edit?user_id={mgr_id}", json={
    "title": "Adopt Salesforce CRM", "problem": "Sales team needs a CRM",
    "reasoning": "Cost/benefit favours Salesforce", "category": "Technology"})
check("manager edits decision",
      r.status_code == 200 and r.json()["title"] == "Adopt Salesforce CRM"
      and r.json()["category"] == "Technology", r.text)

r = get(f"{BASE}/decisions/{dec_id}/history?user_id={mgr_id}")
check("history recorded", r.status_code == 200 and len(r.json()) >= 2, r.text)
r = get(f"{BASE}/decisions/{dec_id}/replay?user_id={mgr_id}")
check("replay endpoint works",
      r.status_code == 200 and r.json()["decision"]["id"] == dec_id and len(r.json()["history"]) >= 2)
check("replay missing decision -> 404",
      get(f"{BASE}/decisions/999999/replay?user_id={mgr_id}").status_code == 404)
check("history without auth -> 401", get(f"{BASE}/decisions/{dec_id}/history").status_code == 401)

# ----------------------------------------------------------------- 5
section("5. ALTERNATIVES / REVIEWS / OUTCOMES")
r = post(f"{BASE}/decisions/{dec_id}/alternatives?user_id={emp_id}",
         json={"name": "Keep in-house", "description": "Build internal tool"})
check("employee adds alternative", r.status_code in (200, 201), r.text)
check("alternatives listed",
      len(get(f"{BASE}/decisions/{dec_id}/alternatives?user_id={emp_id}").json()) == 1)
check("alternatives without auth -> 401",
      get(f"{BASE}/decisions/{dec_id}/alternatives").status_code == 401)
check("outsider cannot add alternative -> 403",
      post(f"{BASE}/decisions/{dec_id}/alternatives?user_id={emp2_id}",
           json={"name": "Sneaky"}).status_code == 403)

alt_id = get(f"{BASE}/decisions/{dec_id}/alternatives?user_id={emp_id}").json()[0]["id"]
check("owner deletes own alternative",
      delete(f"{BASE}/alternatives/{alt_id}?user_id={emp_id}").status_code == 200)

r = post(f"{BASE}/decisions/{dec_id}/reviews?user_id={mgr_id}", json={"comment": "Looks solid."})
check("review created", r.status_code in (200, 201), r.text)
check("reviews listed", len(get(f"{BASE}/decisions/{dec_id}/reviews?user_id={mgr_id}").json()) >= 1)

r = post(f"{BASE}/decisions/{dec_id}/outcome?user_id={emp_id}",
         json={"expected_outcome": "20% faster", "actual_outcome": "25% faster", "result": "Successful"})
check("outcome created", r.status_code == 200 and r.json()["result"] == "Successful", r.text)
outcome_id = r.json()["id"]
r = post(f"{BASE}/decisions/{dec_id}/outcome?user_id={emp_id}",
         json={"expected_outcome": "20% faster", "actual_outcome": "25% faster", "result": "Very successful"})
check("outcome upsert does not duplicate", r.status_code == 200 and r.json()["id"] == outcome_id)
check("outcome fetched",
      get(f"{BASE}/decisions/{dec_id}/outcome?user_id={emp_id}").json()["result"] == "Very successful")
check("outcome missing -> 404",
      get(f"{BASE}/decisions/{dec2_id}/outcome?user_id={emp_id}").status_code == 404)

# ----------------------------------------------------------------- 6
section("6. DISCUSSIONS")
r = post(f"{BASE}/decisions/{dec_id}/comments?user_id={emp_id}",
         json={"content": "Kickoff on Monday.", "is_meeting_note": 1})
check("employee posts comment (0/1 flag accepted)",
      r.status_code in (200, 201) and r.json()["user_id"] == emp_id, r.text)
r = post(f"{BASE}/decisions/{dec_id}/comments?user_id={mgr_id}",
         json={"content": "Approved direction.", "is_meeting_note": False})
check("manager posts comment", r.status_code in (200, 201), r.text)

r = get(f"{BASE}/decisions/{dec_id}/comments?user_id={emp_id}")
check("comments listed", r.status_code == 200 and len(r.json()) == 2)
check("is_meeting_note serialized as boolean", isinstance(r.json()[0]["is_meeting_note"], bool))
check("employee sees only own discussions",
      len(get(f"{BASE}/discussions?user_id={emp_id}").json()) == 1)
r = get(f"{BASE}/discussions?user_id={mgr_id}")
check("manager sees all discussions",
      r.status_code == 200
      and any(d["content"] == "Approved direction." for d in r.json())
      and any(d["decision_id"] == dec_id for d in r.json()), r.text[:200])
check("outsider cannot comment on other decision -> 403",
      post(f"{BASE}/decisions/{dec_id}/comments?user_id={emp2_id}",
           json={"content": "no"}).status_code == 403)
check("empty comment rejected",
      post(f"{BASE}/decisions/{dec_id}/comments?user_id={emp_id}",
           json={"content": "   "}).status_code == 422)

# ----------------------------------------------------------------- 7
section("7. FILE UPLOADS")
pdf = b"%PDF-1.4\nsample upload payload\n"
files = {"file": ("brief.pdf", io.BytesIO(pdf), "application/pdf")}

r = post(f"{BASE}/decisions/{dec_id}/documents?user_id={emp_id}", files=files)
check("employee uploads document", r.status_code in (200, 201), r.text)
doc_id = r.json()["id"]
check("stored path is upload-root relative",
      r.json()["filepath"].startswith(f"{dec_id}/") and ".." not in r.json()["filepath"], r.json()["filepath"])
check("file size recorded", r.json()["file_size"] == len(pdf))

files2 = {"file": ("brief.pdf", io.BytesIO(pdf), "application/pdf")}
r2 = post(f"{BASE}/decisions/{dec_id}/documents?user_id={emp_id}", files=files2)
check("duplicate filename gets unique path", r2.status_code in (200, 201)
      and r2.json()["filepath"] != r.json()["filepath"])

evil = {"file": ("payload.exe", io.BytesIO(b"MZ"), "application/octet-stream")}
check("blocked extension rejected",
      post(f"{BASE}/decisions/{dec_id}/documents?user_id={emp_id}", files=evil).status_code == 400)

unknown = {"file": ("data.xyz", io.BytesIO(b"x"), "application/octet-stream")}
check("unsupported extension rejected",
      post(f"{BASE}/decisions/{dec_id}/documents?user_id={emp_id}", files=unknown).status_code == 400)

check("outsider upload -> 403",
      post(f"{BASE}/decisions/{dec_id}/documents?user_id={emp2_id}",
           files={"file": ("x.pdf", io.BytesIO(pdf), "application/pdf")}).status_code == 403)

r = get(f"{BASE}/decisions/{dec_id}/documents?user_id={emp_id}")
check("documents listed", r.status_code == 200 and len(r.json()) == 2)

r = get(f"{BASE}/documents/{doc_id}/download?user_id={emp_id}")
check("owner downloads document", r.status_code == 200 and r.content == pdf, r.text[:200])
check("download sets attachment filename", "brief.pdf" in r.headers.get("content-disposition", ""))
check("other employee cannot download -> 403",
      get(f"{BASE}/documents/{doc_id}/download?user_id={emp2_id}").status_code == 403)
check("manager can download", get(f"{BASE}/documents/{doc_id}/download?user_id={mgr_id}").status_code == 200)
check("download without auth -> 401", get(f"{BASE}/documents/{doc_id}/download").status_code == 401)

check("employee sees own decision documents",
      len(get(f"{BASE}/documents?user_id={emp_id}").json()) >= 2)
check("manager sees all documents", len(get(f"{BASE}/documents?user_id={mgr_id}").json()) >= 2)

# ----------------------------------------------------------------- 8
section("8. APPROVAL WORKFLOW")
check("employee approvals list is scoped and empty before submitting",
      get(f"{BASE}/approvals?user_id={emp_id}").status_code == 200
      and get(f"{BASE}/approvals?user_id={emp_id}").json() == [])

r = post(f"{BASE}/decisions/{dec_id}/submit-approval?user_id={emp_id}")
check("employee submits for approval",
      r.status_code == 200 and r.json()["decision_status"] == "Under Review", r.text)
approval_id = r.json()["approval_id"]

check("duplicate submission blocked",
      post(f"{BASE}/decisions/{dec_id}/submit-approval?user_id={emp_id}").status_code == 400)
check("manager cannot submit -> 403",
      post(f"{BASE}/decisions/{dec_id}/submit-approval?user_id={mgr_id}").status_code == 403)
check("non-owner cannot submit -> 403",
      post(f"{BASE}/decisions/{dec_id}/submit-approval?user_id={emp2_id}").status_code == 403)

r = get(f"{BASE}/approvals?user_id={mgr_id}&status=Pending")
check("manager sees pending approval",
      r.status_code == 200 and any(a["id"] == approval_id for a in r.json()), r.text)
check("default status filter is Pending",
      len(get(f"{BASE}/approvals?user_id={mgr_id}").json()) >= 1)

r = get(f"{BASE}/approvals?user_id={emp_id}&status=All")
check("employee sees own submitted request",
      r.status_code == 200 and any(a["id"] == approval_id for a in r.json()), r.text)
check("employee cannot see other users' requests",
      all(a["requested_by"] == emp_id for a in r.json()))
r = get(f"{BASE}/approvals?user_id={emp2_id}&status=All")
check("other employee sees none of these requests", r.json() == [], r.text)

r = get(f"{BASE}/decisions/{dec_id}/approval?user_id={emp_id}")
check("employee reads own approval", r.status_code == 200 and r.json()["status"] == "Pending")
check("employee cannot read other's approval -> 403",
      get(f"{BASE}/decisions/{dec_id}/approval?user_id={emp2_id}").status_code == 403)
check("employee cannot approve -> 403",
      put(f"{BASE}/approvals/{approval_id}/approve?user_id={emp_id}").status_code == 403)
check("reject without reason -> 400",
      put(f"{BASE}/approvals/{approval_id}/reject?user_id={mgr_id}",
          json={"comments": ""}).status_code == 400)

r = put(f"{BASE}/approvals/{approval_id}/reject?user_id={mgr_id}",
        json={"comments": "Needs a cost breakdown."})
check("manager rejects with reason",
      r.status_code == 200 and r.json()["decision_status"] == "Rejected", r.text)
check("already-reviewed approval cannot be rejected again",
      put(f"{BASE}/approvals/{approval_id}/reject?user_id={mgr_id}",
          json={"comments": "again"}).status_code == 400)
check("already-reviewed approval cannot be approved",
      put(f"{BASE}/approvals/{approval_id}/approve?user_id={mgr_id}").status_code == 400)
check("rejected appears in history tab",
      any(a["id"] == approval_id for a in get(f"{BASE}/approvals?user_id={mgr_id}&status=Rejected").json()))

r = post(f"{BASE}/decisions/{dec_id}/submit-approval?user_id={emp_id}")
check("rejected decision can be resubmitted",
      r.status_code == 200 and r.json()["decision_status"] == "Under Review", r.text)
approval_id2 = r.json()["approval_id"]

r = put(f"{BASE}/approvals/{approval_id2}/approve?user_id={mgr_id}",
        json={"comments": "Costed up, approved."})
check("manager approves", r.status_code == 200 and r.json()["decision_status"] == "Approved", r.text)
check("approved appears in history tab",
      any(a["id"] == approval_id2 for a in get(f"{BASE}/approvals?user_id={mgr_id}&status=Approved").json()))
all_tab = get(f"{BASE}/approvals?user_id={mgr_id}&status=All").json()
check("All tab returns both records",
      any(a["id"] == approval_id for a in all_tab) and any(a["id"] == approval_id2 for a in all_tab))
check("decision status persisted as Approved",
      get(f"{BASE}/decisions/{dec_id}?user_id={emp_id}").json()["status"] == "Approved")

# ----------------------------------------------------------------- 9
section("9. NOTIFICATIONS")
n_mgr = get(f"{BASE}/notifications?user_id={mgr_id}").json()
check("manager has approval-request notifications", len(n_mgr) >= 1)
uc = get(f"{BASE}/notifications/unread-count?user_id={mgr_id}").json()
check("unread count matches list", uc["count"] == len(n_mgr))
check("is_read returned as 0/1 int", n_mgr[0]["is_read"] in (0, 1))

n_emp = get(f"{BASE}/notifications?user_id={emp_id}").json()
check("employee notified about own decisions", len(n_emp) >= 2)
check("cannot mark another's notification -> 403",
      put(f"{BASE}/notifications/{n_emp[0]['id']}/read?user_id={emp2_id}").status_code == 403)

check("mark one notification read",
      put(f"{BASE}/notifications/{n_emp[0]['id']}/read?user_id={emp_id}").status_code == 200)
check("unread count decreased",
      get(f"{BASE}/notifications/unread-count?user_id={emp_id}").json()["count"] == len(n_emp) - 1)

r = put(f"{BASE}/notifications/read-all?user_id={emp_id}")
check("mark all read", r.status_code == 200 and r.json()["count"] >= 1)
check("unread count is zero", get(f"{BASE}/notifications/unread-count?user_id={emp_id}").json()["count"] == 0)
check("notifications without auth -> 401", get(f"{BASE}/notifications").status_code == 401)
check("manager test notification endpoint is manager-only",
      post(f"{BASE}/notifications/test?target_user_id={emp2_id}",
           headers={"Authorization": f"Bearer {TOKENS[str(emp_id)]}"}).status_code == 403)
check("manager can send a test notification",
      post(f"{BASE}/notifications/test?target_user_id={emp2_id}&user_id={mgr_id}").status_code in (200, 201))

# ----------------------------------------------------------------- 10
section("10. TEAMS / ANALYTICS / AUDIT LOGS")
check("employee blocked from teams -> 403", get(f"{BASE}/teams?user_id={emp_id}").status_code == 403)
r = get(f"{BASE}/teams?user_id={mgr_id}")
check("manager gets teams", r.status_code == 200 and len(r.json()) >= 3, r.text)
check("team entries expose no password", all("password" not in m for m in r.json()))

a = get(f"{BASE}/analytics?user_id={emp_id}").json()
check("employee analytics scoped to personal", a["scope"] == "personal")
check("employee analytics counts only own decisions", a["total_decisions"] == 2)
check("employee analytics approved count", a["approved_count"] == 1)

a = get(f"{BASE}/analytics?user_id={mgr_id}").json()
check("manager analytics scoped to organization", a["scope"] == "organization")
check("manager analytics sees all decisions", a["total_decisions"] >= 2)
check("analytics categories populated", len(a["categories"]) >= 1)
check("analytics approval stats present", a["approval_stats"]["total"] >= 2)

al_emp = get(f"{BASE}/audit-logs?user_id={emp_id}").json()
al_mgr = get(f"{BASE}/audit-logs?user_id={mgr_id}").json()
check("employee gets own audit logs", len(al_emp) >= 1)
check("manager gets wider audit scope", len(al_mgr) > len(al_emp))
check("audit logs include approval actions",
      any("approved" in l["action"] for l in al_mgr))
f = get(f"{BASE}/audit-logs?user_id={mgr_id}&action=Decision%20approved").json()
check("audit action filter works", len(f) >= 1 and all(l["action"] == "Decision approved" for l in f))
check("audit search by decision id works", len(get(f"{BASE}/audit-logs?user_id={mgr_id}&search={dec_id}").json()) >= 1)
leaked = [l for l in get(f"{BASE}/audit-logs?user_id={emp2_id}").json()
          if l["user_id"] not in (None, emp2_id)]
check("unrelated employee sees no other users' logs", not leaked, leaked[:2])
check("employee still sees own registration log",
      any(l["action"] == "User registered" and l["user_id"] == emp2_id
          for l in get(f"{BASE}/audit-logs?user_id={emp2_id}").json()))

# ----------------------------------------------------------------- 11
section("11. MANAGER COMPLETION")
check("employee cannot complete decision -> 403",
      put(f"{BASE}/decisions/{dec_id}?final_decision=x&user_id={emp_id}").status_code == 403)
r = put(f"{BASE}/decisions/{dec_id}?final_decision=Roll%20out%20in%20Q3&user_id={mgr_id}")
check("manager completes decision",
      r.status_code == 200 and r.json()["status"] == "Completed", r.text)
check("empty final decision -> 400",
      put(f"{BASE}/decisions/{dec_id}?final_decision=&user_id={mgr_id}").status_code in (400, 422))

# ----------------------------------------------------------------- 12
section("12. DELETE + AUDIT PRESERVATION")
check("employee cannot delete decision -> 403", delete(f"{BASE}/decisions/{dec_id}?user_id={emp_id}").status_code == 403)
r = delete(f"{BASE}/decisions/{dec_id}?user_id={mgr_id}")
check("manager deletes decision", r.status_code == 200, r.text)
check("deleted decision returns 404", get(f"{BASE}/decisions/{dec_id}?user_id={mgr_id}").status_code == 404)
check("documents of deleted decision are gone",
      get(f"{BASE}/documents/{doc_id}/download?user_id={mgr_id}").status_code == 404)
all_appr = get(f"{BASE}/approvals?user_id={mgr_id}&status=All").json()
check("approvals of deleted decision removed", all(a["decision_id"] != dec_id for a in all_appr))
check("audit trail survives deletion",
      len(get(f"{BASE}/audit-logs?user_id={mgr_id}&search=Decision%20deleted").json()) >= 1)
check("delete without auth -> 401", delete(f"{BASE}/decisions/{dec2_id}").status_code == 401)

# ----------------------------------------------------------------- 13
section("13. SQL INJECTION / MALFORMED INPUT")
check("SQL injection in user_id rejected",
      get(f"{BASE}/decisions?user_id=1;DROP%20TABLE%20users;--").status_code in (401, 422))
check("users table intact after injection attempt",
      post(f"{BASE}/login", json={"email": mgr_email, "password": "Passw0rd!"}).status_code == 200)
check("SQL injection in audit search handled safely",
      get(f"{BASE}/audit-logs?user_id={mgr_id}&search=%27%3B%20DROP%20TABLE%20users%3B--").status_code == 200)
check("SQL injection in decision title stored safely",
      post(f"{BASE}/decisions?user_id={emp_id}",
           json={"title": "'; DROP TABLE decisions;--", "problem": "p", "reasoning": "r"}).status_code in (200, 201))
check("users still readable after all injection attempts",
      get(f"{BASE}/users?user_id={mgr_id}").status_code == 200)

# ----------------------------------------------------------------- 14
section("14. FRONTEND STATIC SERVING")
r = get(f"{WEB}/")
check("SPA served at :5173", r.status_code == 200 and 'id="root"' in r.text)
r = get(f"{WEB}/decisions/1")
check("SPA deep link falls back to index.html", r.status_code == 200 and 'id="root"' in r.text)
r = get(f"{PROXY}/health")
check("nginx proxies /api to backend", r.status_code == 200 and r.json()["status"] == "healthy")
check("API works through the SPA origin (no CORS needed)",
      post(f"{PROXY}/login", json={"email": mgr_email, "password": "Passw0rd!"}).status_code == 200)

# ----------------------------------------------------------------- done
print("\n" + "=" * 50)
print(f"PASSED: {passed}    FAILED: {failed}")
if failures:
    print("\nFailures:")
    for f in failures:
        print(f"  - {f}")
print("=" * 50)
sys.exit(1 if failed else 0)