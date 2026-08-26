from fastapi import APIRouter, Depends
from sqlmodel import Session, select, func

from app.database import get_session
from app.models import Expense, Income
from app.routers.auth import require_user

router = APIRouter(prefix="/summary", tags=["summary"], dependencies=[Depends(require_user)])


@router.get("/{month}/{year}")
def get_summary(month: int, year: int, session: Session = Depends(get_session)):
    total_expenses = session.exec(
        select(func.sum(Expense.amount))
        .where(func.extract('month', Expense.date) == month)
        .where(func.extract('year', Expense.date) == year)
    ).one()[0] or 0.0

    total_income = session.exec(
        select(func.sum(Income.amount))
        .where(func.extract('month', Income.date) == month)
        .where(func.extract('year', Income.date) == year)
    ).one()[0] or 0.0

    net_savings = total_income - total_expenses

    return {
        "total_expenses": total_expenses,
        "total_income": total_income,
        "net_savings": net_savings
    }
