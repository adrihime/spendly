from datetime import date
from typing import List
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select

from app.database import get_session
from app.deps import period
from app.models import Expense, ExpenseCreate
from app.routers.auth import require_user

router = APIRouter(prefix="/expenses", tags=["expenses"], dependencies=[Depends(require_user)])


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


@router.post("/", response_model=Expense)
def create_expense(expense: ExpenseCreate, session: Session = Depends(get_session)):
    db_expense = Expense.model_validate(expense)
    session.add(db_expense)
    session.commit()
    session.refresh(db_expense)
    return db_expense


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
def delete_expense(expense_id: UUID, session: Session = Depends(get_session)):
    db_expense = session.get(Expense, expense_id)
    if not db_expense:
        raise HTTPException(status_code=404, detail="Expense not found")
    session.delete(db_expense)
    session.commit()
