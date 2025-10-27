from datetime import date

from pydantic import BaseModel, Field


class FinancialKpis(BaseModel):
    gross_revenue: float = Field(..., ge=0)
    accounts_receivable: float = Field(..., ge=0)
    expenses: float = Field(..., ge=0)
    estimated_profit: float


class PaymentOverviewItem(BaseModel):
    method: str
    amount: float = Field(..., ge=0)


class AccountsReceivableItem(BaseModel):
    id: str
    name: str
    due_date: date
    amount: float = Field(..., ge=0)
    status: str


class FinancialDashboard(BaseModel):
    kpis: FinancialKpis
    payment_overview: list[PaymentOverviewItem] = Field(default_factory=list)
    insights: list[str] = Field(default_factory=list)
    receivables_companies: list[AccountsReceivableItem] = Field(default_factory=list)
    receivables_general: list[AccountsReceivableItem] = Field(default_factory=list)
