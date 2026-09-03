import os

from alembic import command
from alembic.config import Config

_ALEMBIC_INI = os.path.join(os.path.dirname(__file__), os.pardir, "alembic.ini")


def upgrade_to_head() -> None:
    config = Config(_ALEMBIC_INI)
    config.attributes["configure_logging"] = False
    command.upgrade(config, "head")
