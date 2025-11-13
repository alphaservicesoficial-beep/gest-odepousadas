from fastapi import APIRouter, HTTPException, Body
from app.core.firebase import db
from google.cloud import firestore 

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
    Faz o check-in direto pelo quarto:
    - cria uma reserva na coleção 'reservations'
    - marca o quarto como 'ocupado'
    """

    try:
        # 1) Garante que o quarto existe
        room_ref = db.collection("rooms").document(room_id)
        room_snap = room_ref.get()
        if not room_snap.exists:
            raise HTTPException(status_code=404, detail="Quarto não encontrado")

        room_data = room_snap.to_dict() or {}
        room_number = room_data.get("number") or room_data.get("identifier") or room_id

        # 2) Extrai dados básicos enviados pelo front
        guest_name = payload.get("guestName")      # ou nome digitado
        guest_cpf = payload.get("guestCPF")
        notes = payload.get("notes", "")

        check_in = payload.get("checkInDate")      # "yyyy-MM-dd"
        check_out = payload.get("checkOutDate")    # "yyyy-MM-dd"

        companions = payload.get("companions", [])
        companions_count = len(companions) if isinstance(companions, list) else 0
        total_guests = 1 + companions_count  # hóspede + acompanhantes

        company_name = payload.get("companyName")
        company_id = payload.get("companyId")  # se estiver usando id de empresa

        # 3) Monta documento da reserva
        reservation_data = {
            "createdAt": firestore.SERVER_TIMESTAMP,
            "roomId": room_id,
            "roomNumber": room_number,

            "guestName": guest_name,
            "guestCPF": guest_cpf,
            "companions": companions,
            "guests": total_guests,

            "companyName": company_name,
            "companyId": company_id,

            "checkIn": check_in,
            "checkOut": check_out,
            "notes": notes,

            # status iniciais
            "status": "confirmado",
            "checkInStatus": "concluido",
            "checkOutStatus": "pendente",
            "paymentStatus": "pendente",
            "paymentMethod": None,
            "value": 0,
        }

        # 4) Cria a reserva
        res_ref = db.collection("reservations").document()
        res_ref.set(reservation_data)

        # 5) Atualiza status do quarto -> ocupado
        update_room_status(room_id, "ocupado")

        return {
            "message": "Check-in realizado com sucesso.",
            "reservationId": res_ref.id,
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
