from fastapi import APIRouter, HTTPException, Body
from app.core.firebase import db
from google.cloud import firestore
import bcrypt

router = APIRouter()

@router.get("/settings")
def get_settings():
    try:
        doc_ref = db.collection("settings").document("property")
        doc = doc_ref.get()
        if not doc.exists:
            return {
                "propertyName": "",
                "phone": "",
                "address": "",
                "currency": "BRL",
                "checkInTime": "14:00",
                "checkOutTime": "12:00",
                "cancellationPolicy": "Cancelamentos devem ser informados com 48h de antecedência.",
                "wifiPassword": "",
                "notes": "",
            }
        return doc.to_dict()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/settings")
def update_settings(payload: dict = Body(...)):
    try:
        db.collection("settings").document("property").set(payload, merge=True)
        return {"message": "Configurações atualizadas com sucesso!"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/settings/users")
def list_users():
    try:
        users_ref = db.collection("users").stream()
        users = []
        for u in users_ref:
            data = u.to_dict()
            users.append({
                "id": u.id,
                "name": data.get("name", ""),
                "email": data.get("email", ""),
                "role": data.get("role", "camareira"),
            })
        return users
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/settings/users")
def create_user(payload: dict = Body(...)):
    try:
        name = payload.get("name")
        email = payload.get("email")
        password = payload.get("password")
        role = payload.get("role", "camareira")

        if not name or not email or not password:
            raise HTTPException(status_code=400, detail="Nome, e-mail e senha são obrigatórios")

        hashed = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

        db.collection("users").add({
            "name": name,
            "email": email,
            "password": hashed,
            "role": role,
            "createdAt": firestore.SERVER_TIMESTAMP
        })

        return {"message": "Usuário criado com sucesso!"}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/settings/users/{user_id}")
def delete_user(user_id: str):
    try:
        user_ref = db.collection("users").document(user_id)
        if not user_ref.get().exists:
            raise HTTPException(status_code=404, detail="Usuário não encontrado")
        user_ref.delete()
        return {"message": "Usuário excluído com sucesso!"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao excluir usuário: {str(e)}")
