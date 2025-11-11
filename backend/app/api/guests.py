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
# (mantida apenas se for usada em outro módulo)
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
        return sorted(guests, key=lambda x: x.get("createdAt", ""), reverse=True)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# =====================================================
# 🔹 CRIAR HÓSPEDE
# =====================================================
@router.post("/guests")
def create_guest(guest: Guest):
    """Cria um novo hóspede simples (sem reserva)"""
    try:
        guest_ref = db.collection("guests").document()
        guest_ref.set({
            "fullName": guest.fullName.strip(),
            "cpf": guest.cpf.strip(),
            "phone": guest.phone or "",
            "email": guest.email or "",
            "createdAt": date.today().isoformat(),
        })

        return {"message": "Hóspede criado com sucesso!"}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# =====================================================
# 🔹 ATUALIZAR HÓSPEDE
# =====================================================
@router.put("/guests/{guest_id}")
def update_guest(guest_id: str, guest: Guest):
    """Atualiza os dados básicos do hóspede"""
    try:
        ref = db.collection("guests").document(guest_id)
        doc = ref.get()
        if not doc.exists:
            raise HTTPException(status_code=404, detail="Hóspede não encontrado.")

        update_data = {
            "fullName": guest.fullName.strip(),
            "cpf": guest.cpf.strip(),
            "email": guest.email or "",
            "phone": guest.phone or "",
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
        doc = ref.get()
        if not doc.exists:
            raise HTTPException(status_code=404, detail="Hóspede não encontrado.")

        ref.delete()
        return {"message": "Hóspede removido com sucesso."}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
