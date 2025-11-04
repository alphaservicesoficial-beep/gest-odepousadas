from fastapi import APIRouter, HTTPException, Body
from app.core.firebase import db
import datetime
import os
import openai

router = APIRouter()

# 🔹 Configuração da API da OpenAI (adicione sua chave no .env)
genai.configure(api_key=os.getenv("GOOGLE_API_KEY"))
model = genai.GenerativeModel("gemini-1.5-flash")


# 🔹 Função utilitária: resumir dados em texto simples
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


# 🔹 IA com histórico e contexto dinâmico
@router.post("/ai/consult")
def ai_consult(payload: dict = Body(...)):
    """
    Consultor IA com memória e integração em tempo real com dados do sistema.
    """
    question = payload.get("question", "").strip()
    chat_history = payload.get("history", [])  # lista de mensagens anteriores

    if not question:
        raise HTTPException(status_code=400, detail="Pergunta não fornecida.")

    try:
        # 1️⃣ Montar contexto com dados reais do sistema
        context = summarize_data()

        # 2️⃣ Montar o histórico da conversa
        messages = [
            {
                "role": "system",
                "content": (
                    "Você é um consultor inteligente de uma pousada, chamado *Assistente da Hospedagem*. "
                    "Você responde de forma objetiva, cordial e com base nos dados do sistema. "
                    "Quando possível, use emojis para deixar a resposta mais amigável. "
                    "Se não houver informação suficiente, diga 'Não encontrei essa informação nos registros atuais'."
                ),
            },
        ]

        # Adiciona histórico anterior (se houver)
        for msg in chat_history:
            messages.append(msg)

        # Adiciona nova pergunta
        messages.append({"role": "user", "content": f"{question}\n\n{context}"})

        # 3️⃣ Chamada ao modelo
        completion = openai.ChatCompletion.create(
            model="gpt-4o-mini",
            messages=messages,
            temperature=0.4,
            max_tokens=350,
        )

        resposta = completion.choices[0].message["content"].strip()

        # 4️⃣ Armazena a interação no Firestore (opcional)
        db.collection("ia_logs").add({
            "question": question,
            "answer": resposta,
            "timestamp": datetime.datetime.now(),
        })

        return {"answer": resposta}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro no consultor IA: {str(e)}")
