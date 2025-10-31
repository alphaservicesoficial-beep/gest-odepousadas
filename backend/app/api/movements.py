from fastapi import APIRouter, Query, HTTPException
from datetime import datetime, timedelta
from google.cloud import firestore
from app.core.firebase import db

router = APIRouter()

# 🔹 Função utilitária para converter string em datetime
def parse_date(date_str: str):
    try:
        return datetime.strptime(date_str, "%Y-%m-%d")
    except Exception:
        raise HTTPException(status_code=400, detail=f"Data inválida: {date_str}")

# 🔹 Define o intervalo de tempo com base no período solicitado
def get_date_range(period: str):
    today = datetime.now().date()
    if period == "today":
        start_date = today
        end_date = today
    elif period == "week":
        start_date = today - timedelta(days=today.weekday())  # Segunda-feira
        end_date = start_date + timedelta(days=6)
    elif period == "month":
        start_date = today.replace(day=1)
        next_month = start_date.replace(month=start_date.month % 12 + 1, day=1)
        end_date = next_month - timedelta(days=1)
    else:
        raise HTTPException(status_code=400, detail="Período inválido. Use: today, week ou month.")
    return start_date, end_date

# ✅ Endpoint principal
@router.get("/movements")
def get_movements(period: str = Query("today", description="Período: today, week, month")):
    try:
        start_date, end_date = get_date_range(period)
        reservations_ref = db.collection("reservations").stream()

        checkins, checkouts = [], []

        for res in reservations_ref:
            data = res.to_dict()
            try:
                check_in = datetime.strptime(data.get("checkIn"), "%Y-%m-%d").date()
                check_out = datetime.strptime(data.get("checkOut"), "%Y-%m-%d").date()
            except Exception:
                continue

            guest_name = (
    data.get("guestOrCompany")
    or data.get("guestName")
    or data.get("guest")
    or data.get("name")
    or data.get("companyName")
    or data.get("company")
    or data.get("clientName")
    or "—"
)

            room_number = data.get("room") or data.get("roomNumber") or "—"
            guests_count = data.get("guestsCount") or 1

            # 🔹 Check-in dentro do período
            if start_date <= check_in <= end_date:
                checkins.append({
                    "id": res.id,
                    "guest": guest_name,
                    "room": room_number,
                    "guestsCount": guests_count,
                    "checkIn": data.get("checkIn"),
                    "reservationStatus": "Entrada"  # ✅ Verde padrão
                })

            # 🔹 Check-out dentro do período
            if start_date <= check_out <= end_date:
                checkouts.append({
                    "id": res.id,
                    "guest": guest_name,
                    "room": room_number,
                    "guestsCount": guests_count,
                    "checkOut": data.get("checkOut"),
                    "reservationStatus": "Saída"
                })

        return {"checkins": checkins, "checkouts": checkouts}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao buscar movimentos: {e}")
