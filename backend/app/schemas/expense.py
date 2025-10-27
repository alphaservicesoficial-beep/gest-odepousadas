from datetime import date

from pydantic import BaseModel, Field


class ExpenseBase(BaseModel):
    description: str
    category: str
    date: date
    amount: float = Field(..., ge=0)


class ExpenseCreate(ExpenseBase):
    ...


class ExpenseUpdate(BaseModel):
    description: str | None = None
    category: str | None = None
    date: date | None = None
    amount: float | None = Field(default=None, ge=0)


class ExpenseResponse(ExpenseBase):
    id: str

    class Config:
        from_attributes = True
