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
