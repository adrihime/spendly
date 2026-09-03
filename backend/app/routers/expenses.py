from datetime import date
from enum import Enum
from typing import List
from uuid import UUID, uuid4

from dateutil.relativedelta import relativedelta
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select

from app.database import get_session
from app.deps import period
from app.models import Expense, ExpenseCreate, ExpenseNew
from app.routers.auth import require_user

router = APIRouter(prefix="/expenses", tags=["expenses"], dependencies=[Depends(require_user)])

INDEFINITE_MONTHS = 60


class Scope(str, Enum):
    this = "this"
    future = "future"
    all = "all"


@router.get("/", response_model=List[Expense])
def list_expenses(
    session: Session = Depends(get_session),
    bounds: tuple[date, date] | None = Depends(period),
):
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
    fields = payload.model_dump(exclude={"repeat_months"})
    repeat = payload.repeat_months

    if repeat == 1:
        row = Expense(**fields)
        session.add(row)
        session.commit()
        session.refresh(row)
        return [row]

    series_id = uuid4()
    indefinite = repeat is None
    count = INDEFINITE_MONTHS if indefinite else repeat
    rows = [
        Expense(
            **{
                **fields,
                "date": payload.date + relativedelta(months=i),
                "paid": False,
                "series_id": series_id,
                "series_index": i + 1,
                "series_total": None if indefinite else count,
            }
        )
        for i in range(count)
    ]
    session.add_all(rows)
    session.commit()
    for row in rows:
        session.refresh(row)
    return rows


@router.put("/{expense_id}", response_model=Expense)
def update_expense(expense_id: UUID, expense: ExpenseCreate, session: Session = Depends(get_session)):
    db_expense = session.get(Expense, expense_id)
    if not db_expense:
        raise HTTPException(status_code=404, detail="Expense not found")
    for key, value in expense.model_dump().items():
        setattr(db_expense, key, value)
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

    if scope == Scope.this or db_expense.series_id is None:
        targets = [db_expense]
    else:
        statement = select(Expense).where(Expense.series_id == db_expense.series_id)
        if scope == Scope.future:
            statement = statement.where(Expense.series_index >= db_expense.series_index)
        targets = session.exec(statement).all()

    for target in targets:
        session.delete(target)
    session.commit()
