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
    phone: str
    email: str
    roomId: str
    checkIn: str
    checkOut: str
    guests: int | None = 1
    value: str | None = ""
    notes: str | None = ""


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


@router.post("/guests")
def create_guest(guest: dict):
    try:
        # Busca o número do quarto antes de salvar
        room_doc = db.collection("rooms").document(guest["roomId"]).get()
        room_number = room_doc.to_dict().get("identifier") if room_doc.exists else None
        guest["roomNumber"] = room_number

        guest_ref = db.collection("guests").document()
        guest_ref.set(guest)
        guest_id = guest_ref.id

        # --- Determina status conforme as datas ---
        today = date.today()
        check_in = date.fromisoformat(guest.get("checkIn"))
        check_out = date.fromisoformat(guest.get("checkOut"))

        if today < check_in:
            status = "reservado"
        elif check_in <= today <= check_out:
            status = "ocupado"
        else:
            status = "disponível"

        # --- Cria reserva ---
        reservation = {
            "guestId": guest_id,
            "guestName": guest.get("fullName"),
            "roomId": guest.get("roomId"),
            "roomNumber": room_number,
            "checkIn": guest.get("checkIn"),
            "checkOut": guest.get("checkOut"),
            "guests": guest.get("guests", 1),
            "value": guest.get("value"),
            "status": status,
            "notes": guest.get("notes", "")
        }

        db.collection("reservations").add(reservation)

        # --- Atualiza status do quarto ---
        update_room_status(
            guest["roomId"],
            status,
            guest_name=guest.get("fullName"),
            notes=guest.get("notes")
        )

        return {"message": f"Hóspede criado com sucesso! Quarto marcado como {status}."}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))



@router.put("/guests/{guest_id}")
def update_guest(guest_id: str, data: Guest):
    try:
        ref = db.collection("guests").document(guest_id)
        old_doc = ref.get()
        if not old_doc.exists:
            raise HTTPException(status_code=404, detail="Hóspede não encontrado")

        old_data = old_doc.to_dict()
        old_room_id = old_data.get("roomId")

        # Atualiza dados do hóspede
        ref.update(data.dict())
        print(f"✏️ Hóspede {guest_id} atualizado → {data.fullName}")

        # Se trocou de quarto, libera o antigo
        if old_room_id and old_room_id != data.roomId:
            update_room_status(old_room_id, "disponível")

        # Define status conforme as datas
        today = date.today()
        check_in = date.fromisoformat(data.checkIn)
        check_out = date.fromisoformat(data.checkOut)

        if today < check_in:
            new_status = "reservado"
        elif check_in <= today <= check_out:
            new_status = "ocupado"
        else:
            new_status = "disponível"

        # Atualiza o status do novo quarto
        update_room_status(
            data.roomId,
            new_status,
            guest_name=data.fullName,
            notes=data.notes
        )

        # 🔹 Buscar número do quarto atual
        room_doc = db.collection("rooms").document(data.roomId).get()
        room_number = room_doc.to_dict().get("identifier") if room_doc.exists else None

        # 🔹 Atualiza também a reserva mais recente (última criada)
        reservations_ref = db.collection("reservations")\
            .where("guestId", "==", guest_id)\
            .order_by("__name__", direction=firestore.Query.DESCENDING)\
            .limit(1)\
            .get()

        for res in reservations_ref:
            db.collection("reservations").document(res.id).update({
                "guestName": data.fullName,
                "roomId": data.roomId,
                "roomNumber": room_number,  # 👈 ATUALIZA AGORA!
                "notes": data.notes,
                "checkIn": data.checkIn,
                "checkOut": data.checkOut,
                "status": new_status,
                "value": data.value,
            })
            print(f"✅ Atualizada reserva mais recente ({res.id}) com quarto {room_number}")

        return {"message": "Hóspede e reserva atualizados com sucesso"}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/guests/{guest_id}")
def delete_guest(guest_id: str):
    try:
        guest_ref = db.collection("guests").document(guest_id)
        doc = guest_ref.get()

        if not doc.exists:
            raise HTTPException(status_code=404, detail="Hóspede não encontrado.")

        # 🔹 Apaga o hóspede
        guest_ref.delete()

        # 🔹 Busca e remove todas as reservas associadas a esse hóspede
        reservations = db.collection("reservations").where("guestId", "==", guest_id).get()
        for res in reservations:
            db.collection("reservations").document(res.id).delete()

        return {"message": "Hóspede e suas reservas foram excluídos com sucesso."}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/guests/{guest_id}/new_reservation")
def create_new_reservation_from_guest(guest_id: str, data: Guest):
    """
    Cria uma nova reserva a partir de um hóspede existente.
    Mantém o histórico anterior e atualiza os dados do hóspede.
    """
    try:
        # 1️⃣ Buscar hóspede existente
        guest_ref = db.collection("guests").document(guest_id)
        guest_doc = guest_ref.get()

        if not guest_doc.exists:
            raise HTTPException(status_code=404, detail="Hóspede não encontrado.")

        # 2️⃣ Buscar número do quarto
        room_doc = db.collection("rooms").document(data.roomId).get()
        room_number = room_doc.to_dict().get("identifier") if room_doc.exists else None

        # 3️⃣ Determinar status
        today = date.today()
        check_in = date.fromisoformat(data.checkIn)
        check_out = date.fromisoformat(data.checkOut)

        if today < check_in:
            status = "reservado"
        elif check_in <= today <= check_out:
            status = "ocupado"
        else:
            status = "disponível"

        # 4️⃣ Criar nova reserva
        new_reservation = {
            "guestId": guest_id,
            "guestName": data.fullName,
            "roomId": data.roomId,
            "roomNumber": room_number,
            "checkIn": data.checkIn,
            "checkOut": data.checkOut,
            "guests": data.guests or 1,
            "value": data.value or "",
            "status": status,
            "notes": data.notes or "",
        }
        db.collection("reservations").add(new_reservation)

        # 5️⃣ Atualizar hóspede com dados atuais da nova reserva
        guest_ref.update({
            "fullName": data.fullName,
            "cpf": data.cpf,
            "phone": data.phone,
            "email": data.email,
            "roomId": data.roomId,
            "checkIn": data.checkIn,
            "checkOut": data.checkOut,
            "guests": data.guests,
            "value": data.value,
            "notes": data.notes,
            "roomNumber": room_number
        })

        # 6️⃣ Atualizar status do quarto
        update_room_status(data.roomId, status, guest_name=data.fullName, notes=data.notes)

        return {"message": "Nova reserva criada e hóspede atualizado com sucesso."}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
