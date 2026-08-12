from datetime import date, datetime
from typing import Optional
from sqlmodel import SQLModel, Field


class Transaction(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    description: str
    amount: float
    category: str
    date: date
    created_at: datetime = Field(default_factory=datetime.utcnow)
