# app/api/settings_users.py
from fastapi import APIRouter, HTTPException, Body
from pydantic import BaseModel
from app.core.firebase import db

router = APIRouter()

# ===========================
# 🔹 MODELO DE USUÁRIO
# ===========================
class User(BaseModel):
    name: str
    email: str
    password: str
    role: str


# ===========================
# 🔹 LISTAR TODOS OS USUÁRIOS
# ===========================
@router.get("/settings/users")
def get_users():
    try:
        users = []
        docs = db.collection("users").stream()
        for doc in docs:
            user = doc.to_dict()
            user["id"] = doc.id
            users.append(user)
        return users
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ===========================
# 🔹 CRIAR NOVO USUÁRIO
# ===========================
@router.post("/settings/users")
def create_user(user: User = Body(...)):
    try:
        ref = db.collection("users").document()
        ref.set(user.dict())
        return {**user.dict(), "id": ref.id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ===========================
# 🔹 DELETAR USUÁRIO
# ===========================
@router.delete("/settings/users/{user_id}")
def delete_user(user_id: str):
    try:
        ref = db.collection("users").document(user_id)
        doc = ref.get()
        if not doc.exists:
            raise HTTPException(status_code=404, detail="Usuário não encontrado.")
        ref.delete()
        return {"message": f"Usuário {user_id} excluído com sucesso!"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
