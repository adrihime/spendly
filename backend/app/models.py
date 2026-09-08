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
    detached: bool = Field(default=False)
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
    series_id: UUID | None = Field(default=None, index=True)
    series_index: int | None = Field(default=None)
    series_total: int | None = Field(default=None)
    detached: bool = Field(default=False)
    created_at: datetime = Field(default_factory=datetime.utcnow)


class IncomeCreate(SQLModel):
    description: str
    amount: float
    category: str
    date: date


class IncomeNew(IncomeCreate):
    repeat_months: int | None = Field(default=1, ge=1, le=120)


class RecurringRule(SQLModel, table=True):
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    kind: str
    description: str
    amount: float
    category: str
    third_party: bool = Field(default=False)
    day_of_month: int = Field(default=1)
    start_month: date
    first_index: int = Field(default=1)
    total_occurrences: int | None = Field(default=None)
    end_month: date | None = Field(default=None)
    materialized_through: date | None = Field(default=None)
    created_at: datetime = Field(default_factory=datetime.utcnow)


class RuleSkip(SQLModel, table=True):
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    rule_id: UUID = Field(index=True)
    occurrence_index: int


class RuleUpdate(SQLModel):
    description: str | None = None
    amount: float | None = None
    category: str | None = None
    third_party: bool | None = None


class Summary(SQLModel):
    total_expenses: float
    third_party_expenses: float
    total_income: float
    net_savings: float
    expenses_by_category: dict[str, float]
    income_by_category: dict[str, float]
    opening_balance: float
    accumulated_balance: float
