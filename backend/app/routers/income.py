from typing import List
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select

from app.database import get_session
from app.models import Income, IncomeCreate

router = APIRouter(prefix="/income", tags=["income"])


@router.get("/", response_model=List[Income])
def list_income(session: Session = Depends(get_session)):
    return session.exec(select(Income)).all()


@router.get("/{income_id}", response_model=Income)
def get_income(income_id: UUID, session: Session = Depends(get_session)):
    income = session.get(Income, income_id)
    if not income:
        raise HTTPException(status_code=404, detail="Income not found")
    return income


@router.post("/", response_model=Income)
def create_income(income: IncomeCreate, session: Session = Depends(get_session)):
    db_income = Income.model_validate(income)
    session.add(db_income)
    session.commit()
    session.refresh(db_income)
    return db_income


@router.put("/{income_id}", response_model=Income)
def update_income(income_id: UUID, income: IncomeCreate, session: Session = Depends(get_session)):
    db_income = session.get(Income, income_id)
    if not db_income:
        raise HTTPException(status_code=404, detail="Income not found")
    for key, value in income.model_dump().items():
        setattr(db_income, key, value)
    session.add(db_income)
    session.commit()
    session.refresh(db_income)
    return db_income


@router.delete("/{income_id}", status_code=204)
def delete_income(income_id: UUID, session: Session = Depends(get_session)):
    db_income = session.get(Income, income_id)
    if not db_income:
        raise HTTPException(status_code=404, detail="Income not found")
    session.delete(db_income)
    session.commit()
