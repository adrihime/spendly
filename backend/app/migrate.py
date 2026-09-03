import os

from alembic import command
from alembic.config import Config
from sqlalchemy import inspect

from app.database import engine

_ALEMBIC_INI = os.path.join(os.path.dirname(__file__), os.pardir, "alembic.ini")
_BASELINE = "76407c9e133b"


def upgrade_to_head() -> None:
    config = Config(_ALEMBIC_INI)
    config.attributes["configure_logging"] = False

    tables = set(inspect(engine).get_table_names())
    if "alembic_version" not in tables and {"expense", "income"} <= tables:
        # a database created before Alembic — adopt it at the baseline
        command.stamp(config, _BASELINE)

    command.upgrade(config, "head")
