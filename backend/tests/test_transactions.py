def add_expense(client, **overrides):
    body = {
        "description": "x",
        "amount": 10,
        "category": "contas",
        "date": "2026-08-01",
        "paid": False,
    }
    body.update(overrides)
    response = client.post("/expenses/", json=body)
    assert response.status_code == 200
    return response.json()


def test_list_without_params_returns_everything(client):
    add_expense(client, date="2026-07-15")
    add_expense(client, date="2026-08-03")

    assert len(client.get("/expenses/").json()) == 2


def test_list_filters_by_month_and_year(client):
    add_expense(client, date="2026-07-15")
    add_expense(client, date="2026-08-03")
    add_expense(client, date="2026-08-20")
    add_expense(client, date="2026-09-01")

    response = client.get("/expenses/", params={"month": 8, "year": 2026})

    assert response.status_code == 200
    assert [e["date"] for e in response.json()] == ["2026-08-03", "2026-08-20"]


def test_list_is_ordered_by_date(client):
    add_expense(client, date="2026-08-20")
    add_expense(client, date="2026-08-03")
    add_expense(client, date="2026-08-11")

    dates = [e["date"] for e in client.get("/expenses/").json()]
    assert dates == sorted(dates)


def test_december_range_includes_dec_31_only(client):
    add_expense(client, date="2026-12-31")
    add_expense(client, date="2027-01-01")

    response = client.get("/expenses/", params={"month": 12, "year": 2026})
    assert [e["date"] for e in response.json()] == ["2026-12-31"]


def test_month_without_year_is_rejected(client):
    assert client.get("/expenses/", params={"month": 8}).status_code == 422


def test_month_out_of_range_is_rejected(client):
    assert client.get("/expenses/", params={"month": 13, "year": 2026}).status_code == 422
