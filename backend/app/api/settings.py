from fastapi import APIRouter, HTTPException, Body
from app.core.firebase import db
from google.cloud import firestore

router = APIRouter()

# ============================================================
# 🔹 LISTAR TODOS OS USUÁRIOS
# ============================================================
@router.get("/settings/users")
def list_users():
    try:
        users_ref = db.collection("users").stream()
        users = []
        for doc in users_ref:
            data = doc.to_dict() or {}
            users.append({
                "id": doc.id,
                "name": data.get("name") or "",
                "email": data.get("email") or "",
                "role": data.get("role") or "camareira",
            })
        return users
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao listar usuários: {str(e)}")


# ============================================================
# 🔹 CRIAR NOVO USUÁRIO
# ============================================================
@router.post("/settings/users")
def create_user(payload: dict = Body(...)):
    try:
        name = payload.get("name")
        email = payload.get("email")
        password = payload.get("password")
        role = payload.get("role", "camareira")

        if not name or not email or not password:
            raise HTTPException(status_code=400, detail="Nome, e-mail e senha são obrigatórios")

        # 🔹 Cria documento no Firestore
        doc_ref = db.collection("users").document()  # gera ID automático
        doc_ref.set({
            "name": name,
            "email": email,
            "password": password,
            "role": role,
            "createdAt": firestore.SERVER_TIMESTAMP,
        })

        return {
            "message": "Usuário criado com sucesso!",
            "id": doc_ref.id,
            "name": name,
            "email": email,
            "role": role,
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao criar usuário: {str(e)}")


# ============================================================
# 🔹 EXCLUIR USUÁRIO
# ============================================================
@router.delete("/settings/users/{user_id}")
def delete_user(user_id: str):
    try:
        user_ref = db.collection("users").document(user_id)
        doc = user_ref.get()

        if not doc.exists:
            raise HTTPException(status_code=404, detail="Usuário não encontrado")

        user_ref.delete()
        return {"message": "Usuário excluído com sucesso!"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao excluir usuário: {str(e)}")
