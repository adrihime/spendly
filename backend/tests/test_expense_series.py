def create(client, **overrides):
    body = {
        "description": "Financiamento carro",
        "amount": 880,
        "category": "carro",
        "date": "2026-09-10",
    }
    body.update(overrides)
    response = client.post("/expenses/", json=body)
    assert response.status_code == 200
    return response.json()


def test_single_expense_has_no_series(client):
    rows = create(client)
    assert len(rows) == 1
    assert rows[0]["series_id"] is None
    assert rows[0]["series_total"] is None


def test_fixed_series_generates_one_row_per_month(client):
    rows = create(client, repeat_months=20)

    assert len(rows) == 20
    assert [r["date"] for r in rows[:3]] == ["2026-09-10", "2026-10-10", "2026-11-10"]
    assert rows[-1]["date"] == "2028-04-10"
    assert {r["series_id"] for r in rows} == {rows[0]["series_id"]}
    assert [r["series_index"] for r in rows] == list(range(1, 21))
    assert all(r["series_total"] == 20 for r in rows)
    assert all(r["paid"] is False for r in rows)


def test_indefinite_series_fills_a_window_with_no_total(client):
    rows = create(client, repeat_months=None)

    assert len(rows) == 60
    assert all(r["series_total"] is None for r in rows)
    assert all(r["series_id"] == rows[0]["series_id"] for r in rows)


def test_series_lands_in_the_right_months(client):
    create(client, date="2026-11-15", repeat_months=3)

    for month, count in [(11, 1), (12, 1)]:
        got = client.get("/expenses/", params={"month": month, "year": 2026}).json()
        assert len(got) == count
    assert len(client.get("/expenses/", params={"month": 1, "year": 2027}).json()) == 1


def test_delete_scope_this_removes_only_one(client):
    rows = create(client, repeat_months=5)
    client.delete(f"/expenses/{rows[2]['id']}")
    left = client.get("/expenses/").json()
    assert len(left) == 4
    assert rows[2]["id"] not in {r["id"] for r in left}


def test_delete_scope_future_removes_from_here_on(client):
    rows = create(client, repeat_months=6)
    r = client.delete(f"/expenses/{rows[3]['id']}", params={"scope": "future"})
    assert r.status_code == 204
    indexes = sorted(x["series_index"] for x in client.get("/expenses/").json())
    assert indexes == [1, 2, 3]


def test_delete_scope_all_removes_the_series(client):
    rows = create(client, repeat_months=4)
    client.delete(f"/expenses/{rows[0]['id']}", params={"scope": "all"})
    assert client.get("/expenses/").json() == []


def test_delete_scope_on_a_non_series_expense_just_deletes_it(client):
    [row] = create(client)
    r = client.delete(f"/expenses/{row['id']}", params={"scope": "all"})
    assert r.status_code == 204
    assert client.get("/expenses/").json() == []
