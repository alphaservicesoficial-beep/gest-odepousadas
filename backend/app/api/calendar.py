# app/api/calendar.py
from fastapi import APIRouter, HTTPException, Query, Body
from app.core.firebase import db
from datetime import datetime
from google.cloud import firestore

router = APIRouter()


# ------------------------------------------------------------
# 🔹 Função utilitária — Converte datas e trata formato
# ------------------------------------------------------------
def parse_date(date_str: str):
    try:
        return datetime.strptime(date_str, "%Y-%m-%d").date()
    except Exception:
        raise HTTPException(status_code=400, detail=f"Data inválida: {date_str}")


# ------------------------------------------------------------
# ✅ 1. Endpoint — Ocupação mensal
# ------------------------------------------------------------
@router.get("/calendar/occupancy")
def get_month_occupancy(
    year: int = Query(..., description="Ano (ex: 2025)"),
    month: int = Query(..., description="Mês (1-12)"),
):
    """
    Retorna a contagem de reservas para cada dia do mês.
    """
    try:
        reservations_ref = db.collection("reservations").get()

        # calcula quantos dias tem no mês
        from calendar import monthrange
        total_days = monthrange(year, month)[1]

        daily_counts = {day: 0 for day in range(1, total_days + 1)}

        for doc in reservations_ref:
            data = doc.to_dict()
            if data.get("status") == "cancelado":
                continue

            check_in = data.get("checkIn")
            check_out = data.get("checkOut")

            if not check_in or not check_out:
                continue

            try:
                d_in = datetime.strptime(check_in, "%Y-%m-%d").date()
                d_out = datetime.strptime(check_out, "%Y-%m-%d").date()
            except:
                continue

            for day in range(1, total_days + 1):
                d = datetime(year, month, day).date()
                if d_in <= d < d_out:
                    daily_counts[day] += 1

        return {"year": year, "month": month, "days": daily_counts}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ------------------------------------------------------------
# ✅ 2. Endpoint — Movimentos diários (Check-ins e Check-outs)
# ------------------------------------------------------------
@router.get("/calendar/movements")
def get_daily_movements(date: str = Query(...)):
    selected_date = datetime.strptime(date, "%Y-%m-%d").date()

    checkins = []
    checkouts = []

    reservations_ref = db.collection("reservations").stream()
    for res in reservations_ref:
        data = res.to_dict()

        # Valida datas
        check_in = data.get("checkIn")
        check_out = data.get("checkOut")
        if not check_in or not check_out:
            continue

        try:
            d_in = datetime.strptime(check_in, "%Y-%m-%d").date()
            d_out = datetime.strptime(check_out, "%Y-%m-%d").date()
        except:
            continue

        # 🔹 Corrige os campos
        guest_name = (
            data.get("guestOrCompany")
            or data.get("guestName")
            or data.get("companyName")
            or data.get("guest")
            or "—"
        )

       

        room_number = (
            data.get("room")
            or data.get("roomId")
            or data.get("roomNumber")
            or "—"
        )

        # 🔹 Check-in do dia
        if d_in == selected_date:
            checkins.append({
                "name": guest_name,
                "room": room_number,
                "statusLabel": "Entrada"
            })

        # 🔹 Check-out do dia
        if d_out == selected_date:
            checkouts.append({
                "name": guest_name,
                "room": room_number,
                "statusLabel": "Saída"
            })

    return {"checkins": checkins, "checkouts": checkouts}

# ------------------------------------------------------------
# ✅ 3. Endpoint — Criar pré-reserva
# ------------------------------------------------------------
@router.post("/calendar/pre-reservations")
def create_pre_reservation(payload: dict = Body(...)):
    """
    Cria uma reserva preliminar (pendente) com base em um intervalo e quarto.
    """
    try:
        check_in = payload.get("checkIn")
        check_out = payload.get("checkOut")
        room_number = payload.get("roomNumber")
        lead_type = payload.get("leadType", "guest")

        if not all([check_in, check_out, room_number]):
            raise HTTPException(status_code=400, detail="Campos obrigatórios: checkIn, checkOut, roomNumber")

        new_doc = {
            "status": "confirmado",
            "checkIn": check_in,
            "checkOut": check_out,
            "roomId": room_number,
            "paymentStatus": "pendente",
            "checkInStatus": "pendente",
            "checkOutStatus": "pendente",
            "createdAt": firestore.SERVER_TIMESTAMP,
        }

        # Cria no Firestore (coleção 'reservations')
        db.collection("reservations").add(new_doc)

        return {"message": "Pré-reserva criada com sucesso", "data": new_doc}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
