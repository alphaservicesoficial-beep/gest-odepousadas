from fastapi import APIRouter, HTTPException, Body
from app.core.firebase import db
import google.generativeai as genai
from datetime import datetime
from collections import Counter

router = APIRouter()

@router.post("/ai/consult")
def ai_consult(payload: dict = Body(...)):
    try:
        question = payload.get("message", "").lower()

        # === 1️⃣ Coleta de dados do Firestore ===
        incomes = [doc.to_dict() for doc in db.collection("incomes").stream()]
        expenses = [doc.to_dict() for doc in db.collection("expenses").stream()]
        reservations = [doc.to_dict() for doc in db.collection("reservations").stream()]
        guests = [doc.to_dict() for doc in db.collection("guests").stream()]
        companies = [doc.to_dict() for doc in db.collection("companies").stream()]
        maintenance = [doc.to_dict() for doc in db.collection("maintenance").stream()]

        # === 2️⃣ Processamento básico ===
        total_income = sum(i.get("amount", 0) for i in incomes)
        total_expenses = sum(e.get("amount", 0) for e in expenses)
        total_profit = total_income - total_expenses

        # Contagens gerais
        total_reservations = len(reservations)
        total_guests = len(guests)
        total_companies = len(companies)
        total_maintenance = len(maintenance)

        # Reservas por mês
        reservation_months = []
        for r in reservations:
            date_str = r.get("checkIn") or r.get("date")
            if date_str:
                try:
                    date_obj = datetime.fromisoformat(date_str)
                    reservation_months.append(date_obj.strftime("%Y-%m"))
                except:
                    pass

        month_counter = Counter(reservation_months)
        top_month = month_counter.most_common(1)[0][0] if month_counter else None

        # === 3️⃣ Montar contexto para IA ===
        context = f"""
        📊 DADOS GERAIS DO SISTEMA
        - Faturamento total: R$ {total_income:,.2f}
        - Despesas totais: R$ {total_expenses:,.2f}
        - Lucro líquido: R$ {total_profit:,.2f}

        🧾 RESERVAS E CLIENTES
        - Total de reservas: {total_reservations}
        - Total de hóspedes cadastrados: {total_guests}
        - Total de empresas cadastradas: {total_companies}
        - Mês com mais reservas: {top_month if top_month else "sem dados"}

        🛠️ MANUTENÇÕES
        - Total de registros: {total_maintenance}
        """

        # === 4️⃣ Enviar prompt para a IA ===
        prompt = f"""
        Você é um consultor de gestão hoteleira.
        Use os dados abaixo para responder perguntas com exatidão e clareza.
        Se o usuário perguntar valores, quantidades ou tendências, baseie-se nesses dados.

        {context}

        Pergunta do usuário: {question}
        """

        model = genai.GenerativeModel("gemini-1.5-flash")
        response = model.generate_content(prompt)

        return {
            "response": response.text,
            "context_used": context
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro no consultor IA: {str(e)}")
