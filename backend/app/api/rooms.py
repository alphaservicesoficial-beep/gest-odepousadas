from fastapi import APIRouter, HTTPException, Body
from app.core.firebase import db

# função para mudar status de um quarto
def update_room_status(room_id: str, new_status: str):
    """Atualiza o status do quarto no Firestore"""
    try:
        room_ref = db.collection("rooms").document(room_id)
        doc = room_ref.get()
        if not doc.exists:
            raise HTTPException(status_code=404, detail="Quarto não encontrado")
        room_ref.update({"status": new_status})
        return {"message": f"Status do quarto {room_id} alterado para {new_status}"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


router = APIRouter()

@router.get("/rooms")
def get_rooms():
    try:
        rooms_ref = db.collection("rooms").stream()
        rooms = []
        for doc in rooms_ref:
            room = doc.to_dict()
            room["id"] = doc.id
            rooms.append(room)
        return rooms
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/rooms/{room_id}")
def update_room(room_id: str, room_data: dict):
    try:
        room_ref = db.collection("rooms").document(room_id)
        if not room_ref.get().exists:
            raise HTTPException(status_code=404, detail="Room not found")
        room_ref.update(room_data)
        return {"message": f"Room {room_id} updated successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/rooms")
def create_room(room: dict):
    try:
        doc_ref = db.collection("rooms").document(room.get("id"))
        doc_ref.set(room)
        return {"message": f"Room {room.get('id')} created successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/rooms/{room_id}/status")
def change_room_status(room_id: str, payload: dict):
    """Atualiza o status do quarto (ex: disponível, ocupado, reservado, manutenção)"""
    try:
        new_status = payload.get("status")
        if not new_status:
            raise HTTPException(status_code=400, detail="Campo 'status' é obrigatório")
        return update_room_status(room_id, new_status)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/rooms/{room_id}/checkin")
def checkin_room(room_id: str, payload: dict = Body(...)):
    """
    Cria uma reserva vinculada ao quarto e marca o check-in como concluído.
    """

    try:
        room_ref = db.collection("rooms").document(room_id)
        snap = room_ref.get()
        if not snap.exists:
            raise HTTPException(status_code=404, detail="Quarto não encontrado")

        room = snap.to_dict()

        # -------------------------------
        # Dados recebidos do frontend
        # -------------------------------
        guestName = payload.get("guestName")
        guestCPF = payload.get("guestCPF")
        guestEmail = payload.get("guestEmail")
        guestPhone = payload.get("guestPhone")
        selectedGuestId = payload.get("selectedGuestId")

        hasCompany = payload.get("hasCompany")
        selectedCompanyId = payload.get("selectedCompanyId")
        companyName = payload.get("companyName")
        companyCNPJ = payload.get("companyCNPJ")
        companyPhone = payload.get("companyPhone")
        companyEmail = payload.get("companyEmail")

        companions = payload.get("companions", [])
        
        checkInDate = payload.get("checkInDate")
        checkOutDate = payload.get("checkOutDate")
        notes = payload.get("notes", "")

        # -------------------------------
        # Monta documento da reserva
        # -------------------------------
        reservation_data = {
            "roomId": room_id,
            "roomNumber": room.get("number"),

            "checkIn": checkInDate,
            "checkOut": checkOutDate,
            "notes": notes,

            "guests": 1 + len(companions),  # hóspede + acompanhantes

            # Status da reserva
            "status": "confirmado",
            "checkInStatus": "concluido",
            "checkOutStatus": "pendente",
            "paymentStatus": "pendente",
            "paymentMethod": None,
            "value": 0,

            # Dados do hóspede
            "selectedGuestId": selectedGuestId,
            "guestName": guestName,
            "guestCPF": guestCPF,
            "guestEmail": guestEmail,
            "guestPhone": guestPhone,

            # Acompanhantes
            "companions": companions,

            # Empresa
            "hasCompany": hasCompany,
            "selectedCompanyId": selectedCompanyId,
            "companyName": companyName,
            "companyCNPJ": companyCNPJ,
            "companyPhone": companyPhone,
            "companyEmail": companyEmail,

            # Timestamp
            "createdAt": firestore.SERVER_TIMESTAMP
        }

        # -------------------------------
        # Cria reserva no Firestore
        # -------------------------------
        new_reservation = db.collection("reservations").document()
        new_reservation.set(reservation_data)

        # -------------------------------
        # Atualiza quarto → Ocupado
        # -------------------------------
        room_ref.update({"status": "ocupado"})

        return {
            "message": "Check-in realizado com sucesso.",
            "reservationId": new_reservation.id
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
