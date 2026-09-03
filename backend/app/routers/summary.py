from datetime import date

from fastapi import APIRouter, Depends, Path
from sqlmodel import Session, func, select

from app.database import get_session
from app.models import Expense, Income, Summary
from app.queries import month_bounds
from app.routers.auth import require_user

router = APIRouter(prefix="/summary", tags=["summary"], dependencies=[Depends(require_user)])


def _by_category(session: Session, model, start: date, end: date) -> dict[str, float]:
    rows = session.exec(
        select(model.category, func.sum(model.amount))
        .where(model.date >= start, model.date < end)
        .group_by(model.category)
    ).all()
    return {category: amount for category, amount in rows}


def _balance_before(session: Session, start: date) -> float:
    income = session.exec(select(func.sum(Income.amount)).where(Income.date < start)).one() or 0.0
    expenses = session.exec(select(func.sum(Expense.amount)).where(Expense.date < start)).one() or 0.0
    return income - expenses


@router.get("/{month}/{year}", response_model=Summary)
def get_summary(
    month: int = Path(ge=1, le=12),
    year: int = Path(ge=2000),
    session: Session = Depends(get_session),
):
    start, end = month_bounds(month, year)

    expenses_by_category = _by_category(session, Expense, start, end)
    income_by_category = _by_category(session, Income, start, end)

    total_expenses = sum(expenses_by_category.values())
    total_income = sum(income_by_category.values())
    net_savings = total_income - total_expenses
    opening_balance = _balance_before(session, start)

    return Summary(
        total_expenses=total_expenses,
        total_income=total_income,
        net_savings=net_savings,
        expenses_by_category=expenses_by_category,
        income_by_category=income_by_category,
        opening_balance=opening_balance,
        accumulated_balance=opening_balance + net_savings,
    )
