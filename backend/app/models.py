from datetime import date, datetime
from uuid import UUID, uuid4
from sqlmodel import SQLModel, Field


class Expense(SQLModel, table=True):
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    description: str
    amount: float
    category: str
    date: date
    created_at: datetime = Field(default_factory=datetime.utcnow)


class ExpenseCreate(SQLModel):
    description: str
    amount: float
    category: str
    date: date


class Income(SQLModel, table=True):
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    description: str
    amount: float
    account: str
    category: str
    date: date
    created_at: datetime = Field(default_factory=datetime.utcnow)


class IncomeCreate(SQLModel):
    description: str
    amount: float
    account: str
    category: str
    date: date