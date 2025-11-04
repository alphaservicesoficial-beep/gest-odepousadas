from fastapi import APIRouter, HTTPException, Body
from app.core.firebase import db
import datetime
import os
import google.generativeai as genai  # ✅ Import certo

router = APIRouter()

# 🔹 Configuração da API do Gemini
genai.configure(api_key=os.getenv("GOOGLE_API_KEY"))
model = genai.GenerativeModel("gemini-1.5-flash")  # ou "gemini-1.5-pro" se quiser respostas mais completas


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
        return f"Erro ao coletar dados: {str(e)}"


# 🔹 Endpoint de consulta à IA
@router.post("/ai/consult")
def ai_consult(payload: dict = Body(...)):
    """
    Consultor IA com integração em tempo real com dados do sistema.
    """
    question = payload.get("question", "").strip()
    chat_history = payload.get("history", [])

    if not question:
        raise HTTPException(status_code=400, detail="Pergunta não fornecida.")

    try:
        # 1️⃣ Contexto com dados reais
        context = summarize_data()

        # 2️⃣ Monta o prompt da IA
        full_prompt = f"""
        Você é o Assistente da Hospedagem, um consultor inteligente da pousada.
        Responda sempre de forma educada, objetiva e baseada nos dados abaixo.

        {context}

        Pergunta do usuário: {question}
        """

        # 3️⃣ Gera resposta com Gemini
        response = model.generate_content(full_prompt)

        resposta = response.text.strip()

        # 4️⃣ Armazena histórico no Firestore
        db.collection("ia_logs").add({
            "question": question,
            "answer": resposta,
            "timestamp": datetime.datetime.now(),
        })

        return {"answer": resposta}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro no consultor IA: {str(e)}")
