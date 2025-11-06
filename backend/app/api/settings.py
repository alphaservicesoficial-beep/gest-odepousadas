# app/api/settings.py
from fastapi import APIRouter, HTTPException, Body
from app.core.firebase import db
from google.cloud import firestore

router = APIRouter()

# ===========================
# 🔹 BUSCAR CONFIGURAÇÕES
# ===========================
@router.get("/settings")
def get_settings():
    try:
        doc = db.collection("settings").document("main").get()
        if not doc.exists:
            # Retorna um modelo padrão se ainda não existe
            return {
                "propertyName": "",
                "phone": "",
                "address": "",
                "currency": "BRL",
                "checkInTime": "14:00",
                "checkOutTime": "12:00",
                "cancellationPolicy": "",
                "wifiPassword": "",
                "notes": "",
                "cnpj": ""  # 👈 adicionado aqui
            }
        return doc.to_dict()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ===========================
# 🔹 SALVAR CONFIGURAÇÕES
# ===========================
@router.put("/settings")
def save_settings(payload: dict = Body(...)):
    try:
        db.collection("settings").document("main").set(payload, merge=True)
        return {"message": "Configurações salvas com sucesso!"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
