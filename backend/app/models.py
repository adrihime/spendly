from datetime import date, datetime
from uuid import UUID, uuid4
from sqlmodel import SQLModel, Field


class Expense(SQLModel, table=True):
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    description: str
    amount: float
    category: str
    date: date
    paid: bool = Field(default=False)
    third_party: bool = Field(default=False)
    series_id: UUID | None = Field(default=None, index=True)
    series_index: int | None = Field(default=None)
    series_total: int | None = Field(default=None)
    created_at: datetime = Field(default_factory=datetime.utcnow)


class ExpenseCreate(SQLModel):
    description: str
    amount: float
    category: str
    date: date
    paid: bool = False
    third_party: bool = False


class ExpenseNew(ExpenseCreate):
    repeat_months: int | None = Field(default=1, ge=1, le=120)


class Income(SQLModel, table=True):
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    description: str
    amount: float
    category: str
    date: date
    created_at: datetime = Field(default_factory=datetime.utcnow)


class IncomeCreate(SQLModel):
    description: str
    amount: float
    category: str
    date: date


class Summary(SQLModel):
    total_expenses: float
    third_party_expenses: float
    total_income: float
    net_savings: float
    expenses_by_category: dict[str, float]
    income_by_category: dict[str, float]
    opening_balance: float
    accumulated_balance: float