def add_expense(client, amount, category, date, paid=False):
    response = client.post(
        "/expenses/",
        json={
            "description": "e",
            "amount": amount,
            "category": category,
            "date": date,
            "paid": paid,
        },
    )
    assert response.status_code == 200


def add_income(client, amount, category, date):
    response = client.post(
        "/income/",
        json={"description": "i", "amount": amount, "category": category, "date": date},
    )
    assert response.status_code == 200


def test_summary_of_empty_month(client):
    body = client.get("/summary/8/2026").json()
    assert body == {
        "total_expenses": 0.0,
        "total_income": 0.0,
        "net_savings": 0.0,
        "expenses_by_category": {},
        "income_by_category": {},
        "opening_balance": 0.0,
        "accumulated_balance": 0.0,
    }


def test_totals_and_by_category(client):
    add_expense(client, 900, "cartao", "2026-08-10")
    add_expense(client, 300, "carro", "2026-08-12")
    add_income(client, 6500, "salario", "2026-08-05")

    body = client.get("/summary/8/2026").json()

    assert body["total_expenses"] == 1200
    assert body["total_income"] == 6500
    assert body["net_savings"] == 5300
    assert body["expenses_by_category"] == {"cartao": 900, "carro": 300}
    assert body["income_by_category"] == {"salario": 6500}


def test_opening_and_accumulated_balance(client):
    add_income(client, 4000, "salario", "2026-06-05")
    add_expense(client, 1500, "contas", "2026-06-05")
    add_expense(client, 900, "cartao", "2026-08-10")

    body = client.get("/summary/8/2026").json()

    assert body["opening_balance"] == 2500
    assert body["net_savings"] == -900
    assert body["accumulated_balance"] == 1600


def test_other_months_do_not_leak_into_the_range(client):
    add_expense(client, 100, "contas", "2026-07-31")
    add_expense(client, 200, "contas", "2026-09-01")

    body = client.get("/summary/8/2026").json()
    assert body["total_expenses"] == 0.0


def test_invalid_month_is_rejected(client):
    assert client.get("/summary/13/2026").status_code == 422
    assert client.get("/summary/0/2026").status_code == 422
