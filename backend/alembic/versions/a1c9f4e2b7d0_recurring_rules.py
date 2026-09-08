"""recurring rules

Revision ID: a1c9f4e2b7d0
Revises: c627684d26a5
Create Date: 2026-09-08 12:00:00.000000

"""
from datetime import date, datetime
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
import sqlmodel


# revision identifiers, used by Alembic.
revision: str = "a1c9f4e2b7d0"
down_revision: Union[str, Sequence[str], None] = "c627684d26a5"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

_FAR_FUTURE = date(9999, 1, 1)


def _backfill_rules() -> None:
    bind = op.get_bind()
    meta = sa.MetaData()
    expense = sa.Table("expense", meta, autoload_with=bind)
    rule = sa.Table("recurringrule", meta, autoload_with=bind)

    rows = (
        bind.execute(sa.select(expense).where(expense.c.series_id.isnot(None)))
        .mappings()
        .all()
    )

    groups: dict[str, list] = {}
    for row in rows:
        groups.setdefault(str(row["series_id"]), []).append(row)

    now = datetime.utcnow()
    for items in groups.values():
        items.sort(key=lambda item: item["series_index"] or 0)
        first = items[0]

        when = first["date"]
        if isinstance(when, str):
            when = date.fromisoformat(when)

        total = first["series_total"]
        bind.execute(
            rule.insert().values(
                id=first["series_id"],
                kind="expense",
                description=first["description"],
                amount=first["amount"],
                category=first["category"],
                third_party=bool(first["third_party"]),
                day_of_month=when.day,
                start_month=when.replace(day=1),
                first_index=first["series_index"] or 1,
                total_occurrences=total,
                end_month=None,
                materialized_through=_FAR_FUTURE if total is not None else None,
                created_at=now,
            )
        )


def upgrade() -> None:
    op.create_table(
        "recurringrule",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("kind", sqlmodel.sql.sqltypes.AutoString(), nullable=False),
        sa.Column("description", sqlmodel.sql.sqltypes.AutoString(), nullable=False),
        sa.Column("amount", sa.Float(), nullable=False),
        sa.Column("category", sqlmodel.sql.sqltypes.AutoString(), nullable=False),
        sa.Column("third_party", sa.Boolean(), nullable=False),
        sa.Column("day_of_month", sa.Integer(), nullable=False),
        sa.Column("start_month", sa.Date(), nullable=False),
        sa.Column("first_index", sa.Integer(), nullable=False),
        sa.Column("total_occurrences", sa.Integer(), nullable=True),
        sa.Column("end_month", sa.Date(), nullable=True),
        sa.Column("materialized_through", sa.Date(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )

    op.create_table(
        "ruleskip",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("rule_id", sa.Uuid(), nullable=False),
        sa.Column("occurrence_index", sa.Integer(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_ruleskip_rule_id"), "ruleskip", ["rule_id"], unique=False)

    with op.batch_alter_table("expense", schema=None) as batch_op:
        batch_op.add_column(
            sa.Column("detached", sa.Boolean(), nullable=False, server_default=sa.false())
        )

    with op.batch_alter_table("income", schema=None) as batch_op:
        batch_op.add_column(sa.Column("series_id", sa.Uuid(), nullable=True))
        batch_op.add_column(sa.Column("series_index", sa.Integer(), nullable=True))
        batch_op.add_column(sa.Column("series_total", sa.Integer(), nullable=True))
        batch_op.add_column(
            sa.Column("detached", sa.Boolean(), nullable=False, server_default=sa.false())
        )
        batch_op.create_index(batch_op.f("ix_income_series_id"), ["series_id"], unique=False)

    _backfill_rules()


def downgrade() -> None:
    with op.batch_alter_table("income", schema=None) as batch_op:
        batch_op.drop_index(batch_op.f("ix_income_series_id"))
        batch_op.drop_column("detached")
        batch_op.drop_column("series_total")
        batch_op.drop_column("series_index")
        batch_op.drop_column("series_id")

    with op.batch_alter_table("expense", schema=None) as batch_op:
        batch_op.drop_column("detached")

    op.drop_index(op.f("ix_ruleskip_rule_id"), table_name="ruleskip")
    op.drop_table("ruleskip")
    op.drop_table("recurringrule")
