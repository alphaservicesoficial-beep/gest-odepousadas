from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.core.firebase import db

router = APIRouter()

class LoginRequest(BaseModel):
    email: str
    password: str

@router.post("/login")
def login(data: LoginRequest):
    try:
        users_ref = db.collection("users")
        query = users_ref.where("email", "==", data.email).where("password", "==", data.password).get()

        if not query:
            raise HTTPException(status_code=401, detail="Usuário ou senha incorretos")

        user = query[0].to_dict()

        return {
            "name": user.get("name"),
            "role": user.get("role"),
            "email": user.get("email")
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao realizar login: {str(e)}")
