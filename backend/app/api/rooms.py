from fastapi import APIRouter, HTTPException
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
