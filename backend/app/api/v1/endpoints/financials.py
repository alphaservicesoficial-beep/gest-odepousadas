from datetime import date

from fastapi import APIRouter

from app.schemas.financial import (
    AccountsReceivableItem,
    FinancialDashboard,
    FinancialKpis,
    PaymentOverviewItem,
)

router = APIRouter()


@router.get("/dashboard", response_model=FinancialDashboard)
async def get_financial_dashboard() -> FinancialDashboard:
    return FinancialDashboard(
        kpis=FinancialKpis(
            gross_revenue=152000.0,
            accounts_receivable=38000.0,
            expenses=54000.0,
            estimated_profit=98000.0,
        ),
        payment_overview=[
            PaymentOverviewItem(method="Cartão", amount=98000.0),
            PaymentOverviewItem(method="PIX", amount=32000.0),
            PaymentOverviewItem(method="Dinheiro", amount=22000.0),
        ],
        insights=[
            "Revise as tarifas de alta temporada para maximizar receitas.",
            "5 reservas corporativas estão aguardando confirmação de pagamento.",
        ],
        receivables_companies=[
            AccountsReceivableItem(
                id="RC-CMP-001",
                name="Viagens Brasil LTDA",
                due_date=date.today(),
                amount=12000.0,
                status="em aberto",
            )
        ],
        receivables_general=[
            AccountsReceivableItem(
                id="RC-GEN-001",
                name="Maria Silva",
                due_date=date.today(),
                amount=450.0,
                status="em aberto",
            )
        ],
    )
