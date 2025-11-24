from fastapi import APIRouter, HTTPException
from app.core.firebase import db
from app.api.reservations import safe_float  # função segura de conversão

router = APIRouter()

@router.get("/financial-dashboard")
def get_financial_dashboard():
    """
    Dashboard financeiro:
    - Reservas automáticas (pendentes e pagas)
    - Receitas manuais (incomes)
    - Despesas (expenses)
    """

    try:
        reservations_ref = db.collection("reservations").stream()
        incomes_ref = db.collection("incomes").stream()
        expenses_ref = db.collection("expenses").stream()

        total_revenue = 0.0
        pending_value = 0.0
        total_expenses = 0.0

        payment_methods = {
            "Cartão": 0.0,
            "Pix": 0.0,
            "Dinheiro": 0.0,
            "Transferência": 0.0,
        }

        receivables_companies = []
        receivables_general = []

        # 🔹 Reservas automáticas
        for res in reservations_ref:
            data = res.to_dict() or {}

            # Ignorar canceladas
            if "cancelado" in (data.get("status") or "").lower():
                continue

            valor_total = safe_float(data.get("value") or data.get("totalAmount") or 0)
            valor_pago = safe_float(data.get("amountReceived") or 0)
            metodo = data.get("paymentMethod") or "Outros"

            # Definir status de pagamento
            status_pagamento = (data.get("paymentStatus") or data.get("statusPagamento") or "").lower()

            if not status_pagamento:
                # fallback inteligente
                if valor_pago <= 0 and valor_total > 0:
                    status_pagamento = "pendente"
                elif valor_pago >= valor_total:
                    status_pagamento = "pago"

            guest = (
                data.get("guestOrCompany")
                or data.get("guestName")
                or data.get("companyName")
                or "—"
            )
            due_date = data.get("checkOut") or "--"
            is_company = bool(data.get("companyName") or data.get("companyId"))

            # PENDENTE
            if "pendente" in status_pagamento:
                pending_value += valor_total
                entry = {
                    "id": res.id,
                    "name": guest,
                    "dueDate": due_date,
                    "amount": f"R$ {valor_total:,.2f}".replace(",", "X").replace(".", ",").replace("X", "."),
                    "status": "Em aberto",
                }
                (receivables_companies if is_company else receivables_general).append(entry)

            # PAGO
            elif any(k in status_pagamento for k in ["confirmado", "pago", "aprovado"]):
                valor_final = valor_pago if valor_pago > 0 else valor_total
                total_revenue += valor_final
                entry = {
                    "id": res.id,
                    "name": guest,
                    "dueDate": due_date,
                    "amount": f"R$ {valor_final:,.2f}".replace(",", "X").replace(".", ",").replace("X", "."),
                    "status": "Pago",
                }
                (receivables_companies if is_company else receivables_general).append(entry)
                payment_methods[metodo] = payment_methods.get(metodo, 0.0) + valor_final

        # 🔸 Receitas manuais
        for inc in incomes_ref:
            data = inc.to_dict() or {}
            valor = safe_float(data.get("amount") or 0)
            metodo = data.get("method") or "Outros"

            total_revenue += valor
            payment_methods[metodo] = payment_methods.get(metodo, 0.0) + valor

            receivables_general.append({
                "id": inc.id,
                "name": data.get("description") or "Receita manual",
                "dueDate": data.get("date"),
                "amount": f"R$ {valor:,.2f}".replace(",", "X").replace(".", ",").replace("X", "."),
                "status": "Pago",
            })

        # 🔻 Despesas
        for e in expenses_ref:
            data = e.to_dict() or {}
            total_expenses += safe_float(data.get("amount") or 0)

        # KPIs principais
        estimated_profit = total_revenue - total_expenses
        kpis = {
            "grossRevenue": f"R$ {total_revenue:,.2f}".replace(",", "X").replace(".", ",").replace("X", "."),
            "receivables": f"R$ {pending_value:,.2f}".replace(",", "X").replace(".", ",").replace("X", "."),
            "expenses": f"R$ {total_expenses:,.2f}".replace(",", "X").replace(".", ",").replace("X", "."),
            "estimatedProfit": f"R$ {estimated_profit:,.2f}".replace(",", "X").replace(".", ",").replace("X", "."),
        }

        # Insights
        insights = []
        if pending_value > 0:
            insights.append("Existem reservas pendentes aguardando pagamento.")
        if total_revenue > 0:
            insights.append("Reservas confirmadas e receitas manuais estão gerando receita consistente.")
        if total_expenses > 0:
            insights.append("Despesas registradas estão afetando o lucro estimado.")
        if estimated_profit < 0:
            insights.append("Lucro negativo — reveja tarifas e custos operacionais.")

        # Distribuição de métodos de pagamento
        payment_overview = [
            {"method": k, "amount": f"R$ {v:,.2f}".replace(",", "X").replace(".", ",").replace("X", ".")}
            for k, v in payment_methods.items() if v > 0
        ]

        return {
            "kpis": kpis,
            "paymentOverview": payment_overview,
            "insights": insights,
            "receivablesCompanies": receivables_companies,
            "receivablesGeneral": receivables_general,
        }

    except Exception as e:
        print("💥 ERRO FINANCIAL DASHBOARD:", e)
        raise HTTPException(status_code=500, detail=str(e))
