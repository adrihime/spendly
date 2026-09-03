def test_create_and_list_income_without_account(client):
    body = {"description": "Salário", "amount": 5900, "category": "pagamento", "date": "2026-08-31"}

    created = client.post("/income/", json=body)
    assert created.status_code == 200
    assert "account" not in created.json()

    listed = client.get("/income/").json()
    assert len(listed) == 1
    assert listed[0]["description"] == "Salário"
    assert "account" not in listed[0]


def test_account_in_payload_is_ignored(client):
    r = client.post(
        "/income/",
        json={
            "description": "x",
            "amount": 1,
            "category": "pagamento",
            "date": "2026-08-01",
            "account": "Nubank",
        },
    )
    assert r.status_code == 200
    assert "account" not in r.json()
