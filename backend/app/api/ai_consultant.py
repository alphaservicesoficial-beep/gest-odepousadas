from fastapi import APIRouter, HTTPException, Body
from app.core.firebase import db
import datetime
import os
import google.generativeai as genai  # ✅ SDK oficial do Gemini

router = APIRouter()

# 🔹 Configuração da API do Gemini (usa variável do ambiente no Render)
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
if not GOOGLE_API_KEY:
    raise RuntimeError("❌ GOOGLE_API_KEY não foi encontrada nas variáveis de ambiente.")

genai.configure(api_key=GOOGLE_API_KEY)
model = genai.GenerativeModel("gemini-1.5-flash")


# 🔹 Função utilitária: resumo dos dados do sistema
def summarize_data():
    try:
        reservas_ref = db.collection("reservas").stream()
        reservas = [r.to_dict() for r in reservas_ref]

        financeiro_ref = db.collection("financeiro").stream()
        financeiro = [f.to_dict() for f in financeiro_ref]

        manutencao_ref = db.collection("manutencao").stream()
        manutencoes = [m.to_dict() for m in manutencao_ref]

        resumo = f"""
        📊 DADOS ATUAIS DO SISTEMA:

        • Reservas totais: {len(reservas)}
        • Movimentações financeiras: {len(financeiro)}
        • Manutenções registradas: {len(manutencoes)}

        Exemplo de reserva: {reservas[0] if reservas else "nenhuma reserva"}
        Exemplo financeiro: {financeiro[0] if financeiro else "nenhum registro"}
        Exemplo de manutenção: {manutencoes[0] if manutencoes else "nenhuma manutenção"}
        """
        return resumo

    except Exception as e:
        return f"⚠️ Erro ao coletar dados: {str(e)}"


# 🔹 Endpoint principal — Consultor IA
@router.post("/ai/consult")
def ai_consult(payload: dict = Body(...)):
    """
    Consultor IA com integração Gemini + Firestore.
    """
    question = payload.get("question", "").strip()
    chat_history = payload.get("history", [])

    if not question:
        raise HTTPException(status_code=400, detail="Pergunta não fornecida.")

    try:
        # 1️⃣ Dados do sistema
        context = summarize_data()

        # 2️⃣ Monta prompt com contexto real
        full_prompt = f"""
        Você é o *Assistente da Hospedagem*, um consultor inteligente de uma pousada.
        Responda sempre com clareza, empatia e baseando-se nos dados reais do sistema.

        {context}

        Usuário perguntou: "{question}"
        """

        # 3️⃣ Chamada à API do Gemini
        response = model.generate_content(full_prompt)

        # 🟢 IMPORTANTE: nem sempre response.text existe direto!
        resposta = getattr(response, "text", None)
        if not resposta:
            raise ValueError("Resposta vazia ou inválida retornada pelo modelo.")

        # 4️⃣ Registrar log no Firestore
        db.collection("ia_logs").add({
            "question": question,
            "answer": resposta,
            "timestamp": datetime.datetime.now(),
        })

        return {"answer": resposta}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro no consultor IA: {str(e)}")
