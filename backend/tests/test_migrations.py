import sqlite3
from pathlib import Path

from alembic import command
from alembic.config import Config

BACKEND = Path(__file__).resolve().parent.parent


def _config(db_path: Path) -> Config:
    cfg = Config(str(BACKEND / "alembic.ini"))
    cfg.attributes["configure_logging"] = False
    cfg.set_main_option("sqlalchemy.url", f"sqlite:///{db_path}")
    return cfg


def _tables(db_path: Path) -> set[str]:
    con = sqlite3.connect(db_path)
    try:
        return {r[0] for r in con.execute("select name from sqlite_master where type='table'")}
    finally:
        con.close()


def test_upgrade_then_downgrade_round_trips(tmp_path):
    db = tmp_path / "m.db"
    cfg = _config(db)

    command.upgrade(cfg, "head")
    assert {"expense", "income"} <= _tables(db)

    command.downgrade(cfg, "base")
    assert _tables(db) == {"alembic_version"}


def test_adopts_a_pre_alembic_database_without_losing_rows(tmp_path, monkeypatch):
    db = tmp_path / "legacy.db"
    con = sqlite3.connect(db)
    con.executescript(
        """
        CREATE TABLE expense (id CHAR(32) PRIMARY KEY, description VARCHAR, amount FLOAT,
            category VARCHAR, date DATE, paid BOOLEAN, created_at DATETIME);
        CREATE TABLE income (id CHAR(32) PRIMARY KEY, description VARCHAR, amount FLOAT,
            account VARCHAR, category VARCHAR, date DATE, created_at DATETIME);
        INSERT INTO expense VALUES ('a', 'Carro', 633, 'carro', '2026-09-01', 0, '2026-09-01');
        INSERT INTO income VALUES ('b', 'Salario', 5900, 'Nubank', 'salario', '2026-09-01', '2026-09-01');
        """
    )
    con.commit()
    con.close()

    import app.migrate as migrate
    from sqlalchemy import create_engine

    monkeypatch.setattr(migrate, "engine", create_engine(f"sqlite:///{db}"))
    monkeypatch.setenv("DATABASE_URL", f"sqlite:///{db}")
    migrate.upgrade_to_head()

    con = sqlite3.connect(db)
    try:
        expense_cols = {r[1] for r in con.execute("PRAGMA table_info(expense)")}
        assert "third_party" in expense_cols and "series_id" in expense_cols
        assert "account" not in {r[1] for r in con.execute("PRAGMA table_info(income)")}
        assert con.execute("select description, third_party from expense").fetchone() == ("Carro", 0)
        assert con.execute("select count(*) from income").fetchone()[0] == 1
    finally:
        con.close()


def test_head_matches_the_models(tmp_path):
    db = tmp_path / "m.db"
    command.upgrade(_config(db), "head")

    con = sqlite3.connect(db)
    try:
        expense_cols = {r[1] for r in con.execute("PRAGMA table_info(expense)")}
        income_cols = {r[1] for r in con.execute("PRAGMA table_info(income)")}
    finally:
        con.close()

    from app.models import Expense, Income

    assert expense_cols == set(Expense.model_fields)
    assert income_cols == set(Income.model_fields)
