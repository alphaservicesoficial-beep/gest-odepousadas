from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from datetime import date
from firebase_admin import firestore

router = APIRouter()
db = firestore.client()

# =====================================================
# 🔹 MODELO Pydantic
# =====================================================
class Guest(BaseModel):
    fullName: str
    cpf: str
    phone: str | None = None
    email: str | None = None


# =====================================================
# 🔹 FUNÇÃO AUXILIAR — Atualiza status e informações do quarto
# =====================================================
def update_room_status(room_id: str, new_status: str, guest_name: str = None, notes: str = None):
    """
    Atualiza o status do quarto e os dados de hóspede no Firestore.
    """
    try:
        room_ref = db.collection("rooms").document(room_id)
        update_data = {"status": new_status}

        if new_status == "disponível":
            update_data["guest"] = None
            update_data["guestNotes"] = None
        else:
            update_data["guest"] = guest_name or ""
            update_data["guestNotes"] = notes or ""

        room_ref.update(update_data)
        print(f"✅ Quarto {room_id} → {new_status} | Hóspede: {guest_name or '—'} | Notas: {notes or '—'}")

    except Exception as e:
        print(f"⚠️ Erro ao atualizar status do quarto {room_id}: {e}")


# =====================================================
# 🔹 ROTAS DE HÓSPEDES
# =====================================================

# =====================================================
# 🔹 LISTAR HÓSPEDES
# =====================================================
@router.get("/guests")
def get_guests():
    """Lista todos os hóspedes"""
    try:
        guests = []
        for doc in db.collection("guests").stream():
            data = doc.to_dict()
            data["id"] = doc.id
            guests.append(data)
        return guests
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# =====================================================
# 🔹 CRIAR HÓSPEDE
# =====================================================
@router.post("/guests")
def create_guest(guest: dict):
    """Cria um novo hóspede simples (sem vínculo com reserva ou quarto)"""
    try:
        ref = db.collection("guests").document()
        ref.set({
            "fullName": guest.get("fullName"),
            "cpf": guest.get("cpf"),
            "email": guest.get("email", None),
            "phone": guest.get("phone", None),
        })
        return {"message": "Hóspede criado com sucesso!"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# =====================================================
# 🔹 ATUALIZAR HÓSPEDE
# =====================================================
@router.put("/guests/{guest_id}")
def update_guest(guest_id: str, guest: dict):
    """Atualiza os dados básicos do hóspede"""
    try:
        ref = db.collection("guests").document(guest_id)
        if not ref.get().exists:
            raise HTTPException(status_code=404, detail="Hóspede não encontrado.")

        update_data = {
            "fullName": guest.get("fullName"),
            "cpf": guest.get("cpf"),
            "email": guest.get("email", None),
            "phone": guest.get("phone", None),
        }

        ref.update(update_data)
        return {"message": "Hóspede atualizado com sucesso!"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# =====================================================
# 🔹 EXCLUIR HÓSPEDE
# =====================================================
@router.delete("/guests/{guest_id}")
def delete_guest(guest_id: str):
    """Remove hóspede permanentemente"""
    try:
        ref = db.collection("guests").document(guest_id)
        if not ref.get().exists:
            raise HTTPException(status_code=404, detail="Hóspede não encontrado.")
        ref.delete()
        return {"message": "Hóspede removido com sucesso."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
