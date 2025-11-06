from fastapi import APIRouter, HTTPException, Body
from app.core.firebase import db
import datetime
import os
import google.generativeai as genai
import re
import traceback

router = APIRouter()

# ---------- Configuração do Gemini ----------
genai.configure(api_key=os.getenv("GOOGLE_API_KEY"))
model = genai.GenerativeModel("models/gemini-2.5-flash")

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
    """Lê os dados reais do Firestore e retorna um resumo estruturado."""
    try:
        # 🔹 Coleções reais do seu banco (segundo o print)
        reservas = [r.to_dict() for r in db.collection("reservations").stream()]
        hospedes = [h.to_dict() for h in db.collection("guests").stream()]
        manutencoes = [m.to_dict() for m in db.collection("maintenance").stream()]
        financeiro = [f.to_dict() for f in db.collection("incomes").stream()]
        usuarios_count = _try_first_nonzero(
            _count_docs_safe("users"),
            _count_docs_safe("usuarios")
        )

        # Contagens principais
        data = {
            "totais": {
                "reservas": len(reservas),
                "hospedes": len(hospedes),
                "manutencoes": len(manutencoes),
                "financeiro_mov": len(financeiro),
                "usuarios": usuarios_count,
            },
            "amostras": {
                "reserva_exemplo": reservas[0] if reservas else None,
                "hospede_exemplo": hospedes[0] if hospedes else None,
                "financeiro_exemplo": financeiro[0] if financeiro else None,
                "manutencao_exemplo": manutencoes[0] if manutencoes else None,
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
        n = t.get("usuarios", 0)
        return f"Temos {n} usuário(s) cadastrado(s)."
    if intent == "reservas":
        n = t.get("reservas", 0)
        return f"Temos {n} reserva(s) cadastrada(s)."
    if intent == "hospedes":
        n = t.get("hospedes", 0)
        return f"Temos {n} hóspede(s) registrado(s)."
    if intent == "manutencoes":
        n = t.get("manutencoes", 0)
        return f"Temos {n} manutenção(ões) registrada(s)."
    if intent == "financeiro_mov":
        n = t.get("financeiro_mov", 0)
        return f"Temos {n} movimentação(ões) financeira(s) registrada(s)."
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

        # Se não for pergunta direta, usar o modelo
        system_prompt = (
            "Você é o assistente da pousada. Use apenas as informações no JSON.\n"
            "Se não houver dados suficientes, diga isso claramente.\n"
            "Se a pergunta for quantitativa, use apenas os valores de 'totais'."
        )

        full_prompt = f"{system_prompt}\n\nJSON de contexto:\n{data}\n\nPergunta: {question}"

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
        raise HTTPException(status_code=500, detail=f"Erro no consultor IA: {str(e)}")


