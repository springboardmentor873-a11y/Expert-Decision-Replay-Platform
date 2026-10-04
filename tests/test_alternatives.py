from tests.conftest import login, auth_headers


def create_decision(client, token):
    r = client.post("/decisions", headers=auth_headers(token), json={
        "title": "Decision with alternatives",
        "problem_statement": "Problem",
        "category": "Process",
    })
    return r.json()


def test_create_list_update_delete_alternative(client, employee):
    token = login(client, employee.email)
    decision = create_decision(client, token)

    r = client.post(
        f"/decisions/{decision['id']}/alternatives",
        headers=auth_headers(token),
        json={
            "name": "Option A",
            "description": "First option",
            "pros": "Cheap",
            "cons": "Slow",
            "estimated_cost": 1000,
            "feasibility_score": 4,
            "risk_level": "Low",
        },
    )
    assert r.status_code == 201, r.text
    alt_id = r.json()["id"]

    r = client.get(f"/decisions/{decision['id']}/alternatives", headers=auth_headers(token))
    assert r.status_code == 200
    assert len(r.json()) == 1

    r = client.put(
        f"/alternatives/{alt_id}",
        headers=auth_headers(token),
        json={
            "name": "Option A (revised)",
            "description": "First option revised",
            "pros": "Cheap",
            "cons": "Slower",
            "estimated_cost": 1200,
            "feasibility_score": 3,
            "risk_level": "Medium",
        },
    )
    assert r.status_code == 200
    assert r.json()["name"] == "Option A (revised)"

    r = client.delete(f"/alternatives/{alt_id}", headers=auth_headers(token))
    assert r.status_code == 200

    r = client.get(f"/decisions/{decision['id']}/alternatives", headers=auth_headers(token))
    assert len(r.json()) == 0


def test_other_employee_cannot_add_alternative(client, employee, other_employee):
    token = login(client, employee.email)
    other_token = login(client, other_employee.email)
    decision = create_decision(client, token)

    r = client.post(
        f"/decisions/{decision['id']}/alternatives",
        headers=auth_headers(other_token),
        json={
            "name": "Sneaky option",
            "description": "x",
            "pros": "x",
            "cons": "x",
            "estimated_cost": 1,
            "feasibility_score": 1,
            "risk_level": "Low",
        },
    )
    assert r.status_code == 403
