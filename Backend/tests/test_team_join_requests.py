import pytest
from fastapi.testclient import TestClient
from main import app
from database.database import Base, engine, SessionLocal
from models.role import Role
from models.user import User
from models.team import Team
from security.password import hash_password
from security.jwt import create_access_token


@pytest.fixture(scope="module")
def setup_team_join_db():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    # Seed roles if needed
    admin_role = db.query(Role).filter(Role.name == "administrator").first()
    manager_role = db.query(Role).filter(Role.name == "manager").first()
    employee_role = db.query(Role).filter(Role.name == "employee").first()

    if not admin_role:
        admin_role = Role(name="administrator")
        db.add(admin_role)
    if not manager_role:
        manager_role = Role(name="manager")
        db.add(manager_role)
    if not employee_role:
        employee_role = Role(name="employee")
        db.add(employee_role)
    db.commit()

    # Create Manager User & Employee User
    manager_user = User(
        full_name="Team Manager User",
        email="mgr_join@edrp.com",
        hashed_password=hash_password("password123"),
        role_id=manager_role.id,
    )
    emp_user = User(
        full_name="Employee Join User",
        email="emp_join@edrp.com",
        hashed_password=hash_password("password123"),
        role_id=employee_role.id,
    )
    db.add_all([manager_user, emp_user])
    db.commit()

    # Create Team managed by manager_user
    team = Team(name="Join Request Testing Team", manager_id=manager_user.id)
    db.add(team)
    db.commit()

    db.refresh(manager_user)
    db.refresh(emp_user)
    db.refresh(team)

    mgr_token = create_access_token({"sub": manager_user.email})
    emp_token = create_access_token({"sub": emp_user.email})

    yield {
        "db": db,
        "manager": manager_user,
        "employee": emp_user,
        "team": team,
        "mgr_token": mgr_token,
        "emp_token": emp_token,
    }
    db.close()


def test_team_join_request_flow(setup_team_join_db):
    client = TestClient(app)
    env = setup_team_join_db
    team_id = env["team"].id

    emp_headers = {"Authorization": f"Bearer {env['emp_token']}"}
    mgr_headers = {"Authorization": f"Bearer {env['mgr_token']}"}

    # 1. Employee submits a join request
    res = client.post(f"/teams/{team_id}/join-requests", headers=emp_headers)
    assert res.status_code == 201
    data = res.json()
    assert data["team_id"] == team_id
    assert data["status"] == "Pending"
    req_id = data["id"]

    # 2. Prevent duplicate pending requests
    res_dup = client.post(f"/teams/{team_id}/join-requests", headers=emp_headers)
    assert res_dup.status_code == 400

    # 3. Manager lists join requests
    res_list = client.get("/teams/join-requests", headers=mgr_headers)
    assert res_list.status_code == 200
    list_data = res_list.json()
    assert any(r["id"] == req_id for r in list_data)

    # 4. Manager approves join request
    res_app = client.post(f"/teams/join-requests/{req_id}/approve", headers=mgr_headers)
    assert res_app.status_code == 200
    assert res_app.json()["status"] == "Approved"

    # 5. Verify employee is now assigned to team!
    db = env["db"]
    db.refresh(env["employee"])
    assert env["employee"].team_id == team_id
