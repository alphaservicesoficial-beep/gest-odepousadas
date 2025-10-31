from fastapi import APIRouter, HTTPException, Body
from app.core.firebase import db
from google.cloud import firestore
from typing import Dict, Any

router = APIRouter()

@router.get("/expenses")
def list_expenses():
    """
    Retorna todas as despesas registradas manualmente.
    """
    try:
        docs = db.collection("expenses").order_by("date", direction=firestore.Query.DESCENDING).stream()
        expenses = []
        for doc in docs:
            data = doc.to_dict()
            expenses.append({
                "id": doc.id,
                "description": data.get("description"),
                "category": data.get("category"),
                "date": data.get("date"),
                "amount": data.get("amount"),
            })
        return expenses
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/expenses")
def create_expense(payload: Dict[str, Any] = Body(...)):
    """
    Cria uma nova despesa manualmente.
    """
    try:
        description = payload.get("description")
        category = payload.get("category")
        date = payload.get("date")
        amount = float(payload.get("amount", 0))

        if not all([description, category, date, amount]):
            raise HTTPException(status_code=400, detail="Campos obrigatórios ausentes.")

        db.collection("expenses").add({
            "description": description,
            "category": category,
            "date": date,
            "amount": amount,
            "createdAt": firestore.SERVER_TIMESTAMP,
        })

        return {"message": "Despesa adicionada com sucesso"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
