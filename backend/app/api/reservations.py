# app/api/reservations.py
from fastapi import APIRouter, HTTPException, Body
from app.core.firebase import db
from google.cloud import firestore  # para SERVER_TIMESTAMP
import re

router = APIRouter()


# ------------------------------
# Utilitários
# ------------------------------
def safe_float(value):
    try:
        if value is None:
            return 0.0
        return float(str(value).replace(",", "."))
    except Exception:
        return 0.0


def update_room_status(room_id: str, new_status: str):
    room_ref = db.collection("rooms").document(room_id)
    if not room_ref.get().exists:
        raise HTTPException(status_code=404, detail="Quarto não encontrado")
    room_ref.update({"status": new_status})


def digits_only(text: str) -> str:
    """Extrai somente dígitos (para casos tipo 'RM-105' -> '105')."""
    return "".join(re.findall(r"\d+", text or ""))


def get_room_number_from_room_id(room_id: str) -> str | None:
    """Busca na coleção 'rooms' o campo 'number' usando o room_id."""
    if not room_id:
        return None
    snap = db.collection("rooms").document(room_id).get()
    if not snap.exists:
        return None
    data = snap.to_dict() or {}
    # tente 'number' (p.ex. "105") e, se não tiver, limpe do próprio id
    return str(data.get("number") or digits_only(room_id) or "").strip() or None


def resolve_room_number(reservation: dict) -> str:
    """
    Resolve o número do quarto de forma robusta:
    1) Usa roomNumber se existir.
    2) Senão, tenta buscar em rooms pelo roomId.
    3) Senão, remove prefixos/letras de roomId como fallback.
    """
    # 1) preferir campo específico
    rn = str(reservation.get("roomNumber") or "").strip()
    if rn:
        return rn

    # 2) tentar descobrir pelo roomId
    room_id = reservation.get("roomId") or reservation.get("room") or ""
    found = get_room_number_from_room_id(room_id)
    if found:
        return found

    # 3) fallback: extrair dígitos de 'RM-105' etc.
    cleaned = digits_only(room_id)
    return cleaned or "—"


# ------------------------------------------------------------
# ✅ LISTAR RESERVAS
# ------------------------------------------------------------
@router.get("/reservations")
def list_reservations():
    try:
        docs = db.collection("reservations").get()
        reservations = []

        for doc in docs:
            data = doc.to_dict() or {}

            # Se vier "reservado" (do quarto), muda para "confirmado"
            reservation_status = data.get("status", "confirmado")
            if reservation_status == "reservado":
                reservation_status = "confirmado"

            reservations.append({
                "id": doc.id,
                "guestOrCompany": data.get("guestName") or "—",
                "companyName": data.get("companyName") or None,
                # 👇 agora devolve sempre o número do quarto (ex.: "105")
                "room": resolve_room_number(data),
                "guestsCount": data.get("guests", 0),
                "checkIn": data.get("checkIn", "—"),
                "checkOut": data.get("checkOut", "—"),
                "reservationStatus": reservation_status,
                "checkInStatus": data.get("checkInStatus", "pendente"),
                "checkOutStatus": data.get("checkOutStatus", "pendente"),
                "paymentStatus": data.get("paymentStatus", "pendente"),
                "paymentMethod": data.get("paymentMethod", "—"),
                "total": data.get("value", 0),
            })
        return reservations
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ------------------------------------------------------------
# ✅ CONFIRMAR CHECK-IN
# ------------------------------------------------------------
@router.put("/reservations/{reservation_id}/checkin")
def confirm_checkin(reservation_id: str):
    try:
        doc_ref = db.collection("reservations").document(reservation_id)
        snap = doc_ref.get()
        if not snap.exists:
            raise HTTPException(status_code=404, detail="Reserva não encontrada")

        data = snap.to_dict() or {}
        room_id = data.get("roomId")

        # Garante roomNumber ao confirmar check-in (se ainda não existir)
        room_number = data.get("roomNumber") or get_room_number_from_room_id(room_id)
        updates = {
            "checkInStatus": "concluido",
            "status": "confirmado"   # 🔹 força status a permanecer confirmado
        }
        if room_number and not data.get("roomNumber"):
            updates["roomNumber"] = room_number

        doc_ref.update(updates)

        # Atualiza apenas o QUARTO → ocupado
        if room_id:
            update_room_status(room_id, "ocupado")

        return {"message": "Check-in concluído, reserva confirmada e quarto marcado como ocupado."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ------------------------------------------------------------
# ✅ CONFIRMAR CHECK-OUT (registra a data real de saída)
# ------------------------------------------------------------
@router.put("/reservations/{reservation_id}/checkout")
def confirm_checkout(reservation_id: str):
    """
    Marca o check-out como concluído, libera o quarto e
    registra a data/hora real de saída (actualCheckOut).
    """
    try:
        doc_ref = db.collection("reservations").document(reservation_id)
        snap = doc_ref.get()
        if not snap.exists:
            raise HTTPException(status_code=404, detail="Reserva não encontrada")

        data = snap.to_dict() or {}
        room_id = data.get("roomId")

        # Garante roomNumber também aqui (caso foi direto pro checkout)
        room_number = data.get("roomNumber") or get_room_number_from_room_id(room_id)
        updates = {
            "checkOutStatus": "concluido",
            "actualCheckOut": firestore.SERVER_TIMESTAMP
        }
        if room_number and not data.get("roomNumber"):
            updates["roomNumber"] = room_number

        doc_ref.update(updates)

        # Atualiza o quarto → volta a DISPONÍVEL
        if room_id:
            update_room_status(room_id, "disponível")

        return {"message": "Check-out concluído, quarto liberado e data real registrada."}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ------------------------------------------------------------
# ✅ REGISTRAR PAGAMENTO
# ------------------------------------------------------------
@router.put("/reservations/{reservation_id}/payment")
def register_payment(reservation_id: str, payload: dict = Body(...)):
    try:
        method = payload.get("method")
        amount = payload.get("amount")

        if not method or amount is None:
            raise HTTPException(status_code=400, detail="Método e valor são obrigatórios")

        doc_ref = db.collection("reservations").document(reservation_id)
        if not doc_ref.get().exists:
            raise HTTPException(status_code=404, detail="Reserva não encontrada")

        doc_ref.update({
            "paymentStatus": "confirmado",
            "paymentMethod": method,
            "value": amount
        })
        return {"message": f"Pagamento confirmado: {method} - R$ {amount:.2f}"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ------------------------------------------------------------
# ✅ CANCELAR RESERVA
# ------------------------------------------------------------
@router.put("/reservations/{reservation_id}/cancel")
def cancel_reservation(reservation_id: str):
    try:
        doc_ref = db.collection("reservations").document(reservation_id)
        snap = doc_ref.get()
        if not snap.exists:
            raise HTTPException(status_code=404, detail="Reserva não encontrada")

        data = snap.to_dict() or {}
        room_id = data.get("roomId")

        doc_ref.update({
            "status": "cancelado",
            "checkInStatus": "cancelado",
            "checkOutStatus": "cancelado",
            "paymentStatus": "cancelado",
            "paymentMethod": None,
            "value": 0,
            "canceledAt": firestore.SERVER_TIMESTAMP,
        })

        # Atualiza quarto → volta a DISPONÍVEL
        if room_id:
            update_room_status(room_id, "disponível")

        return {"message": "Reserva cancelada e quarto liberado."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ------------------------------------------------------------
# 🔧 OPCIONAL: Backfill para popular roomNumber nas reservas antigas
# ------------------------------------------------------------
@router.post("/reservations/backfill-room-number")
def backfill_room_number():
    """
    Percorre todas as reservas que não têm 'roomNumber', e tenta preencher
    a partir do 'rooms.number' ou limpando o 'roomId'.
    Rode uma vez para normalizar.
    """
    try:
        batch = db.batch()
        count = 0
        for doc in db.collection("reservations").stream():
            data = doc.to_dict() or {}
            if data.get("roomNumber"):
                continue
            room_id = data.get("roomId") or ""
            room_number = get_room_number_from_room_id(room_id) or digits_only(room_id)
            if room_number:
                batch.update(doc.reference, {"roomNumber": room_number})
                count += 1
                # Commit em lotes de 400–450 para evitar limite do Firestore
                if count % 400 == 0:
                    batch.commit()
                    batch = db.batch()
        batch.commit()
        return {"updated": count, "message": "Backfill concluído."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
