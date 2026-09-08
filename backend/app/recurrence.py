from calendar import monthrange
from datetime import date

from sqlmodel import Session, select

from app.models import Expense, Income, RecurringRule, RuleSkip

HORIZON_MONTHS = 18
_SAFETY_CAP = 1200
_FAR_FUTURE = date(9999, 1, 1)


def add_months(anchor: date, n: int) -> date:
    total = anchor.year * 12 + (anchor.month - 1) + n
    year, month = divmod(total, 12)
    return date(year, month + 1, 1)


def month_start(value: date) -> date:
    return date(value.year, value.month, 1)


def months_between(start: date, end: date) -> int:
    return (end.year - start.year) * 12 + (end.month - start.month)


def horizon(today: date | None = None) -> date:
    return add_months(month_start(today or date.today()), HORIZON_MONTHS)


def _model_for(kind: str):
    return Expense if kind == "expense" else Income


def stop_month(rule: RecurringRule) -> date | None:
    if rule.total_occurrences is not None:
        return add_months(rule.start_month, rule.total_occurrences - rule.first_index)
    return rule.end_month


def is_finite(rule: RecurringRule) -> bool:
    return stop_month(rule) is not None


def occurrence_date(rule: RecurringRule, month: date) -> date:
    last_day = monthrange(month.year, month.month)[1]
    return date(month.year, month.month, min(rule.day_of_month, last_day))


def current_index(rule: RecurringRule, today: date | None = None) -> int:
    now = month_start(today or date.today())
    if now <= rule.start_month:
        return rule.first_index
    return rule.first_index + months_between(rule.start_month, now)


def _occurrence_fields(rule: RecurringRule, index: int, month: date) -> dict:
    fields = {
        "description": rule.description,
        "amount": rule.amount,
        "category": rule.category,
        "date": occurrence_date(rule, month),
        "series_id": rule.id,
        "series_index": index,
        "series_total": rule.total_occurrences,
    }
    if rule.kind == "expense":
        fields["paid"] = False
        fields["third_party"] = rule.third_party
    return fields


def materialize_rule(session: Session, rule: RecurringRule, through: date) -> list:
    model = _model_for(rule.kind)
    existing = set(
        session.exec(select(model.series_index).where(model.series_id == rule.id)).all()
    )
    skipped = set(
        session.exec(
            select(RuleSkip.occurrence_index).where(RuleSkip.rule_id == rule.id)
        ).all()
    )

    end = stop_month(rule)
    limit = end if end is not None else through

    created = []
    index = rule.first_index
    while index < rule.first_index + _SAFETY_CAP:
        month = add_months(rule.start_month, index - rule.first_index)
        if month > limit:
            break
        if rule.total_occurrences is not None and index > rule.total_occurrences:
            break
        if index not in existing and index not in skipped:
            row = model(**_occurrence_fields(rule, index, month))
            session.add(row)
            created.append(row)
        index += 1

    rule.materialized_through = _FAR_FUTURE if is_finite(rule) else through
    session.add(rule)
    return created


def apply_series_delete(session: Session, model, row, scope: str) -> None:
    rule_id = row.series_id

    if scope == "this" or rule_id is None:
        if rule_id is not None and row.series_index is not None:
            session.add(RuleSkip(rule_id=rule_id, occurrence_index=row.series_index))
        session.delete(row)
        return

    rule = session.get(RecurringRule, rule_id)
    cutoff = row.series_index or 1

    if scope == "future" and rule is not None and cutoff > rule.first_index:
        for victim in session.exec(
            select(model).where(model.series_id == rule_id, model.series_index >= cutoff)
        ).all():
            session.delete(victim)
        rule.total_occurrences = cutoff - 1
        rule.end_month = add_months(rule.start_month, (cutoff - 1) - rule.first_index)
        rule.materialized_through = _FAR_FUTURE
        for kept in session.exec(select(model).where(model.series_id == rule_id)).all():
            kept.series_total = rule.total_occurrences
            session.add(kept)
        session.add(rule)
        return

    for victim in session.exec(select(model).where(model.series_id == rule_id)).all():
        session.delete(victim)
    for skip in session.exec(select(RuleSkip).where(RuleSkip.rule_id == rule_id)).all():
        session.delete(skip)
    if rule is not None:
        session.delete(rule)


def ensure_materialized(session: Session, through: date | None = None) -> None:
    through = through or horizon()
    for rule in session.exec(select(RecurringRule)).all():
        materialize_rule(session, rule, through)
    session.commit()


def ensure_materialized_lazy(session: Session, through: date | None = None) -> None:
    through = max(through, horizon()) if through else horizon()
    stale = session.exec(
        select(RecurringRule).where(
            (RecurringRule.materialized_through == None)  # noqa: E711
            | (RecurringRule.materialized_through < through)
        )
    ).first()
    if stale is None:
        return
    ensure_materialized(session, through)
