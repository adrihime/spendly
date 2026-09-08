from datetime import date
from enum import Enum
from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select

from app.database import get_session
from app.deps import period
from app.models import Income, IncomeCreate, IncomeNew, RecurringRule
from app.recurrence import (
    apply_series_delete,
    ensure_materialized_lazy,
    horizon,
    materialize_rule,
    month_start,
)
from app.routers.auth import require_user

router = APIRouter(prefix="/income", tags=["income"], dependencies=[Depends(require_user)])


class Scope(str, Enum):
    this = "this"
    future = "future"
    all = "all"


@router.get("/", response_model=List[Income])
def list_income(
    session: Session = Depends(get_session),
    bounds: tuple[date, date] | None = Depends(period),
):
    ensure_materialized_lazy(session, bounds[1] if bounds else None)
    statement = select(Income)
    if bounds:
        statement = statement.where(Income.date >= bounds[0], Income.date < bounds[1])
    return session.exec(statement.order_by(Income.date)).all()


@router.get("/{income_id}", response_model=Income)
def get_income(income_id: UUID, session: Session = Depends(get_session)):
    income = session.get(Income, income_id)
    if not income:
        raise HTTPException(status_code=404, detail="Income not found")
    return income


@router.post("/", response_model=List[Income])
def create_income(payload: IncomeNew, session: Session = Depends(get_session)):
    repeat = payload.repeat_months

    if repeat == 1:
        row = Income(**payload.model_dump(exclude={"repeat_months"}))
        session.add(row)
        session.commit()
        session.refresh(row)
        return [row]

    rule = RecurringRule(
        kind="income",
        description=payload.description,
        amount=payload.amount,
        category=payload.category,
        day_of_month=payload.date.day,
        start_month=month_start(payload.date),
        first_index=1,
        total_occurrences=None if repeat is None else repeat,
    )
    session.add(rule)
    session.flush()
    materialize_rule(session, rule, horizon())
    session.commit()

    return session.exec(
        select(Income).where(Income.series_id == rule.id).order_by(Income.series_index)
    ).all()


@router.put("/{income_id}", response_model=Income)
def update_income(income_id: UUID, income: IncomeCreate, session: Session = Depends(get_session)):
    db_income = session.get(Income, income_id)
    if not db_income:
        raise HTTPException(status_code=404, detail="Income not found")
    for key, value in income.model_dump().items():
        setattr(db_income, key, value)
    if db_income.series_id is not None:
        db_income.detached = True
    session.add(db_income)
    session.commit()
    session.refresh(db_income)
    return db_income


@router.delete("/{income_id}", status_code=204)
def delete_income(
    income_id: UUID,
    scope: Scope = Scope.this,
    session: Session = Depends(get_session),
):
    db_income = session.get(Income, income_id)
    if not db_income:
        raise HTTPException(status_code=404, detail="Income not found")

    apply_series_delete(session, Income, db_income, scope.value)
    session.commit()
