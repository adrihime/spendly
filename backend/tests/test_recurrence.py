from datetime import date

from app.recurrence import add_months, month_start


def _first_of_this_month() -> date:
    return month_start(date.today())


def make_expense_series(client, **overrides):
    body = {
        "description": "Aliexpress",
        "amount": 40.0,
        "category": "cartao",
        "date": _first_of_this_month().isoformat(),
        "repeat_months": 12,
    }
    body.update(overrides)
    response = client.post("/expenses/", json=body)
    assert response.status_code == 200
    return response.json()


def make_salary(client, **overrides):
    body = {
        "description": "Salário",
        "amount": 6000.0,
        "category": "salario",
        "date": _first_of_this_month().isoformat(),
        "repeat_months": None,
    }
    body.update(overrides)
    response = client.post("/income/", json=body)
    assert response.status_code == 200
    return response.json()


def test_income_indefinite_series_materializes_a_window(client):
    rows = make_salary(client)

    assert len(rows) >= 12
    assert all(r["series_total"] is None for r in rows)
    assert all(r["series_id"] == rows[0]["series_id"] for r in rows)


def test_rules_endpoint_lists_created_rules(client):
    make_expense_series(client)
    make_salary(client)

    rules = client.get("/rules/").json()
    kinds = sorted(r["kind"] for r in rules)
    assert kinds == ["expense", "income"]


def test_patch_rule_scope_all_updates_every_undetached_occurrence(client):
    rows = make_expense_series(client)
    rule_id = rows[0]["series_id"]

    r = client.patch(f"/rules/{rule_id}", params={"scope": "all"}, json={"amount": 55.0})
    assert r.status_code == 200

    got = client.get("/expenses/").json()
    assert all(e["amount"] == 55.0 for e in got)


def test_patch_rule_scope_future_leaves_paid_and_detached_alone(client):
    rows = make_expense_series(client)
    rule_id = rows[0]["series_id"]

    paid_id = rows[0]["id"]
    client.put(
        f"/expenses/{paid_id}",
        json={
            "description": rows[0]["description"],
            "amount": rows[0]["amount"],
            "category": rows[0]["category"],
            "date": rows[0]["date"],
            "paid": True,
            "third_party": False,
        },
    )

    detached_id = rows[1]["id"]
    client.put(
        f"/expenses/{detached_id}",
        json={
            "description": "editado à mão",
            "amount": 999.0,
            "category": rows[1]["category"],
            "date": rows[1]["date"],
            "paid": False,
            "third_party": False,
        },
    )

    r = client.patch(f"/rules/{rule_id}", params={"scope": "future"}, json={"amount": 77.0})
    assert r.status_code == 200

    by_id = {e["id"]: e for e in client.get("/expenses/").json()}
    assert by_id[paid_id]["amount"] == rows[0]["amount"]
    assert by_id[detached_id]["amount"] == 999.0
    assert by_id[rows[-1]["id"]]["amount"] == 77.0


def test_delete_rule_removes_rule_and_occurrences(client):
    rows = make_expense_series(client)
    rule_id = rows[0]["series_id"]

    assert client.delete(f"/rules/{rule_id}").status_code == 204
    assert client.get("/expenses/").json() == []
    assert client.get("/rules/").json() == []


def test_delete_occurrence_this_is_not_resurrected_by_materialization(client):
    rows = make_salary(client)
    victim = rows[3]

    assert client.delete(f"/income/{victim['id']}").status_code == 204

    month = date.fromisoformat(victim["date"])
    got = client.get("/income/", params={"month": month.month, "year": month.year}).json()
    assert victim["id"] not in {i["id"] for i in got}
    assert all(i["date"] != victim["date"] for i in got)


def test_income_delete_scope_future_trims_the_series(client):
    rows = make_salary(client, repeat_months=8)
    r = client.delete(f"/income/{rows[4]['id']}", params={"scope": "future"})
    assert r.status_code == 204

    left = sorted(i["series_index"] for i in client.get("/income/").json())
    assert left == [1, 2, 3, 4]
    assert all(i["series_total"] == 4 for i in client.get("/income/").json())


def test_delete_scope_future_on_first_occurrence_drops_the_whole_rule(client):
    rows = make_salary(client, repeat_months=6)
    client.delete(f"/income/{rows[0]['id']}", params={"scope": "future"})
    assert client.get("/income/").json() == []
    assert client.get("/rules/").json() == []


def test_future_months_get_filled_on_read(client):
    rows = make_salary(client)
    far = add_months(month_start(date.today()), 30)

    got = client.get("/income/", params={"month": far.month, "year": far.year}).json()
    assert len(got) == 1
    assert got[0]["series_id"] == rows[0]["series_id"]
