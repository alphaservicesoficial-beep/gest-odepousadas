from fastapi import APIRouter, HTTPException, Body
from app.core.firebase import db
import datetime
import os
import google.generativeai as genai
import re
import traceback
from collections import defaultdict

router = APIRouter()

# ---------- Configuração do Gemini ----------
genai.configure(api_key=os.getenv("GOOGLE_API_KEY"))
model = genai.GenerativeModel("models/gemini-2.5-flash")
  # ✅ modelo correto

# ---------- Funções utilitárias ----------
def _count_docs_safe(collection_name: str) -> int:
    """Conta documentos sem agregações, evitando incompatibilidades."""
    try:
        return sum(1 for _ in db.collection(collection_name).stream())
    except Exception:
        return 0


def _try_first_nonzero(*vals):
    for v in vals:
        if v and v > 0:
            return v
    return 0


def summarize_data_structured():
    """Lê dados reais do Firestore e retorna resumo estruturado (agora completo)."""
    try:
        reservas = [r.to_dict() for r in db.collection("reservations").stream()]
        hospedes = [h.to_dict() for h in db.collection("guests").stream()]
        manutencoes = [m.to_dict() for m in db.collection("maintenance").stream()]
        financeiro = [f.to_dict() for f in db.collection("incomes").stream()]
        despesas = [d.to_dict() for d in db.collection("expenses").stream()]
        empresas = [e.to_dict() for e in db.collection("companies").stream()]
        quartos = [q.to_dict() for q in db.collection("rooms").stream()]

        usuarios_count = _try_first_nonzero(
            _count_docs_safe("users"),
            _count_docs_safe("usuarios")
        )

        # 🔹 Totais gerais
        total_incomes = sum(float(f.get("amount", 0)) for f in financeiro)
        total_expenses = sum(float(d.get("amount", 0)) for d in despesas)
        lucro_estimado = total_incomes - total_expenses

        # 🔹 Reservas por mês
        reservas_por_mes = defaultdict(int)
        for r in reservas:
            try:
                data = r.get("checkIn") or r.get("date")
                if data:
                    d = datetime.datetime.strptime(data[:10], "%Y-%m-%d")
                    chave = f"{d.year}-{d.month:02d}"
                    reservas_por_mes[chave] += 1
            except Exception:
                pass

        data = {
            "totais": {
                "reservas": len(reservas),
                "hospedes": len(hospedes),
                "empresas": len(empresas),
                "manutencoes": len(manutencoes),
                "quartos": len(quartos),
                "incomes": len(financeiro),
                "expenses": len(despesas),
                "usuarios": usuarios_count,
                "faturamento_total": total_incomes,
                "despesas_total": total_expenses,
                "lucro_estimado": lucro_estimado,
            },
            "estatisticas": {
                "reservas_por_mes": dict(reservas_por_mes)
            },
            "amostras": {
                "reserva_exemplo": reservas[0] if reservas else None,
                "hospede_exemplo": hospedes[0] if hospedes else None,
                "empresa_exemplo": empresas[0] if empresas else None,
                "financeiro_exemplo": financeiro[0] if financeiro else None,
                "despesa_exemplo": despesas[0] if despesas else None,
            }
        }
        return data
    except Exception as e:
        return {"erro": f"Falha ao coletar dados: {str(e)}"}


# ---------- Intents ----------
INTENTS = [
    (r"\b(qt|quant[oa]s?)\b.*\busu(á|a|)rios?\b", "usuarios"),
    (r"\b(qt|quant[oa]s?)\b.*\breservas?\b", "reservas"),
    (r"\b(qt|quant[oa]s?)\b.*\bhóspede?s?\b", "hospedes"),
    (r"\b(qt|quant[oa]s?)\b.*\bempres", "empresas"),
    (r"\b(qt|quant[oa]s?)\b.*\bmanutenç(ã|a)o?e?s?\b", "manutencoes"),
    (r"\b(qt|quant[oa]s?)\b.*\bmovimenta(ç|c)ões?\b|\bfinanceir", "financeiro_mov"),
]


def detect_intent(question: str):
    q = question.lower()
    for pattern, label in INTENTS:
        if re.search(pattern, q):
            return label
    return None


def answer_from_counts(intent: str, counts: dict) -> str:
    t = counts.get("totais", {})
    if intent == "usuarios":
        return f"Temos {t.get('usuarios', 0)} usuário(s) cadastrado(s)."
    if intent == "reservas":
        return f"Temos {t.get('reservas', 0)} reserva(s) cadastrada(s)."
    if intent == "hospedes":
        return f"Temos {t.get('hospedes', 0)} hóspede(s) registrado(s)."
    if intent == "empresas":
        return f"Temos {t.get('empresas', 0)} empresa(s) cadastrada(s)."
    if intent == "manutencoes":
        return f"Temos {t.get('manutencoes', 0)} manutenção(ões) registrada(s)."
    if intent == "financeiro_mov":
        return (
            f"Foram registradas {t.get('incomes', 0)} receitas "
            f"e {t.get('expenses', 0)} despesas, totalizando "
            f"R$ {t.get('faturamento_total', 0):,.2f} de faturamento "
            f"e R$ {t.get('despesas_total', 0):,.2f} de gastos."
        )
    return None


# ---------- Endpoint principal ----------
@router.post("/ai/consult")
def ai_consult(payload: dict = Body(...)):
    question = (payload.get("question") or "").strip()
    chat_history = payload.get("history", [])

    if not question:
        raise HTTPException(status_code=400, detail="Pergunta não fornecida.")

    try:
        data = summarize_data_structured()

        intent = detect_intent(question)
        if intent:
            resposta_regra = answer_from_counts(intent, data)
            if resposta_regra:
                db.collection("ia_logs").add({
                    "question": question,
                    "answer": resposta_regra,
                    "timestamp": datetime.datetime.now(),
                    "mode": "rule"
                })
                return {"answer": resposta_regra}

        # 🔹 Se for pergunta analítica → usa o modelo Gemini
        system_prompt = (
            "Você é o consultor de uma pousada. Analise os dados e responda com base apenas no JSON. "
            "Se a pergunta for sobre faturamento, despesas, meses com mais reservas ou desempenho, use os totais e estatísticas. "
            "Se não houver dados, diga claramente que não há registros suficientes."
        )

        full_prompt = f"{system_prompt}\n\n=== DADOS ===\n{data}\n\nPergunta: {question}"

        response = model.generate_content(full_prompt)
        resposta = (response.text or "").strip()

        db.collection("ia_logs").add({
            "question": question,
            "answer": resposta,
            "timestamp": datetime.datetime.now(),
            "mode": "llm",
            "context_totais": data.get("totais", {})
        })

        return {"answer": resposta}

    except Exception as e:
        print("❌ ERRO NO CONSULTOR IA:", traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Erro interno: {str(e)}")
