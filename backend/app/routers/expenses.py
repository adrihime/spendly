from datetime import date
from enum import Enum
from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select

from app.database import get_session
from app.deps import period
from app.models import Expense, ExpenseCreate, ExpenseNew, RecurringRule
from app.recurrence import (
    apply_series_delete,
    ensure_materialized_lazy,
    horizon,
    materialize_rule,
    month_start,
)
from app.routers.auth import require_user

router = APIRouter(prefix="/expenses", tags=["expenses"], dependencies=[Depends(require_user)])


class Scope(str, Enum):
    this = "this"
    future = "future"
    all = "all"


@router.get("/", response_model=List[Expense])
def list_expenses(
    session: Session = Depends(get_session),
    bounds: tuple[date, date] | None = Depends(period),
):
    ensure_materialized_lazy(session, bounds[1] if bounds else None)
    statement = select(Expense)
    if bounds:
        statement = statement.where(Expense.date >= bounds[0], Expense.date < bounds[1])
    return session.exec(statement.order_by(Expense.date)).all()


@router.get("/{expense_id}", response_model=Expense)
def get_expense(expense_id: UUID, session: Session = Depends(get_session)):
    expense = session.get(Expense, expense_id)
    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found")
    return expense


@router.post("/", response_model=List[Expense])
def create_expense(payload: ExpenseNew, session: Session = Depends(get_session)):
    repeat = payload.repeat_months

    if repeat == 1:
        row = Expense(**payload.model_dump(exclude={"repeat_months"}))
        session.add(row)
        session.commit()
        session.refresh(row)
        return [row]

    rule = RecurringRule(
        kind="expense",
        description=payload.description,
        amount=payload.amount,
        category=payload.category,
        third_party=payload.third_party,
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
        select(Expense)
        .where(Expense.series_id == rule.id)
        .order_by(Expense.series_index)
    ).all()


@router.put("/{expense_id}", response_model=Expense)
def update_expense(expense_id: UUID, expense: ExpenseCreate, session: Session = Depends(get_session)):
    db_expense = session.get(Expense, expense_id)
    if not db_expense:
        raise HTTPException(status_code=404, detail="Expense not found")
    for key, value in expense.model_dump().items():
        setattr(db_expense, key, value)
    if db_expense.series_id is not None:
        db_expense.detached = True
    session.add(db_expense)
    session.commit()
    session.refresh(db_expense)
    return db_expense


@router.delete("/{expense_id}", status_code=204)
def delete_expense(
    expense_id: UUID,
    scope: Scope = Scope.this,
    session: Session = Depends(get_session),
):
    db_expense = session.get(Expense, expense_id)
    if not db_expense:
        raise HTTPException(status_code=404, detail="Expense not found")

    apply_series_delete(session, Expense, db_expense, scope.value)
    session.commit()
