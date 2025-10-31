# app/api/maintenance.py
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from datetime import datetime
from app.core.firebase import db

router = APIRouter()

# ===============================
# 🔹 MODELOS
# ===============================
class Maintenance(BaseModel):
    roomId: str
    roomIdentifier: str
    issue: str
    priority: str
    openedAt: str | None = None
    status: str = "aberta"  # aberta, em andamento, concluída


# ===============================
# 🔹 LISTAR TODAS AS MANUTENÇÕES
# ===============================
@router.get("/maintenance")
def list_maintenance():
    try:
        docs = db.collection("maintenance").get()
        return [doc.to_dict() | {"id": doc.id} for doc in docs]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ===============================
# 🔹 CRIAR NOVA MANUTENÇÃO
# ===============================
@router.post("/maintenance")
def create_maintenance(data: Maintenance):
    try:
        maintenance_ref = db.collection("maintenance").document()
        maintenance_data = data.dict()
        maintenance_data["openedAt"] = datetime.now().isoformat()

        maintenance_ref.set(maintenance_data)

        # Atualiza status do quarto para manutenção
        room_ref = db.collection("rooms").document(data.roomId)
        room_ref.update({"status": "manutenção"})

        return {"message": "Manutenção registrada e quarto atualizado."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ===============================
# 🔹 ATUALIZAR STATUS DA MANUTENÇÃO
# ===============================
@router.put("/maintenance/{maintenance_id}")
def update_maintenance(maintenance_id: str, status: str, payload: dict = None):
    try:
        ref = db.collection("maintenance").document(maintenance_id)
        doc = ref.get()

        if not doc.exists:
            raise HTTPException(status_code=404, detail="Manutenção não encontrada.")

        # Atualiza o status
        update_data = {"status": status}

        # Adiciona campos opcionais do body
        if payload:
            if "completedOn" in payload:
                update_data["completedOn"] = payload["completedOn"]
            if "notes" in payload:
                update_data["notes"] = payload["notes"]

        ref.update(update_data)

        # Libera o quarto se concluída
        if status == "concluída":
            room_id = doc.to_dict().get("roomId")
            if room_id:
                db.collection("rooms").document(room_id).update({"status": "disponível"})

        return {"message": f"Status atualizado para '{status}'."}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ===============================
# 🔹 DELETAR MANUTENÇÃO
# ===============================
@router.delete("/maintenance/{maintenance_id}")
def delete_maintenance(maintenance_id: str):
    try:
        ref = db.collection("maintenance").document(maintenance_id)
        doc = ref.get()

        if not doc.exists:
            raise HTTPException(status_code=404, detail="Chamado não encontrado.")

        ref.delete()
        return {"message": "Chamado de manutenção removido com sucesso."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
