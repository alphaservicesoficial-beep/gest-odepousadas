from fastapi import APIRouter, HTTPException
from datetime import datetime, date
from app.core.firebase import db

router = APIRouter()

@router.get("/dashboard")
def get_dashboard():
    """
    Retorna informações resumidas para o dashboard principal.
    Inclui taxa de ocupação, check-ins, check-outs e quartos em manutenção.
    """
    try:
        today = date.today()

        # --- Coleções principais ---
        reservations_ref = db.collection("reservations").stream()
        rooms_ref = db.collection("rooms").stream()
        companies_ref = db.collection("companies").stream()

        total_rooms = 0
        occupied_rooms = 0
        maintenance_rooms = 0
        available_rooms = 0

        checkins_today = []
        checkouts_today = []

        # Mapa de quartos (id → nome limpo)
        rooms_map = {}

        # 🔹 Coleta quartos principais
        for r in rooms_ref:
            room = r.to_dict()
            total_rooms += 1
            status = room.get("status", "").lower()

            # Nome do quarto
            room_name = (
                room.get("name")
                or room.get("number")
                or room.get("roomNumber")
                or r.id
            )

            # Remove prefixos e espaços extras
            room_clean = (
                str(room_name)
                .replace("RM-", "")
                .replace("RM ", "")
                .replace("Quarto", "")
                .replace("QUARTO", "")
                .strip()
            )

            rooms_map[r.id] = room_clean

            if status == "ocupado":
                occupied_rooms += 1
            elif status == "manutenção":
                maintenance_rooms += 1
            else:
                available_rooms += 1

        # 🔹 Coleta quartos de empresas (subcoleções)
        for company in companies_ref:
            sub_rooms = db.collection(f"companies/{company.id}/rooms").stream()
            for r in sub_rooms:
                d = r.to_dict()
                total_rooms += 1

                raw_name = (
                    d.get("name")
                    or d.get("number")
                    or d.get("roomNumber")
                    or r.id
                )

                room_clean = (
                    str(raw_name)
                    .replace("RM-", "")
                    .replace("RM ", "")
                    .replace("Quarto", "")
                    .replace("QUARTO", "")
                    .strip()
                )

                rooms_map[r.id] = room_clean

                status = d.get("status", "").lower()
                if status == "ocupado":
                    occupied_rooms += 1
                elif status == "manutenção":
                    maintenance_rooms += 1
                else:
                    available_rooms += 1

        # 🔹 Processa reservas do dia
        for res in reservations_ref:
            data = res.to_dict()

            # Pega datas de checkin e checkout
            try:
                check_in = datetime.strptime(data.get("checkIn"), "%Y-%m-%d").date()
                check_out = datetime.strptime(data.get("checkOut"), "%Y-%m-%d").date()
            except Exception:
                continue

            # Nome do hóspede / empresa
            guest_name = (
                data.get("guestOrCompany")
                or data.get("guestName")
                or data.get("guest")
                or data.get("name")
                or data.get("companyName")
                or data.get("company")
                or "—"
            )

            # 🔹 Resolve nome do quarto (por ID, número ou texto direto)
            room_ref = data.get("room") or data.get("roomNumber") or data.get("room_name")
            room_name = "—"

            if isinstance(room_ref, str):
                # Se o ID existe no mapa
                if room_ref in rooms_map:
                    room_name = rooms_map[room_ref]
                else:
                    # Se vier nome "Quarto 110" → limpa prefixos
                    room_name = (
                        str(room_ref)
                        .replace("RM-", "")
                        .replace("RM ", "")
                        .replace("Quarto", "")
                        .replace("QUARTO", "")
                        .strip()
                    )

            elif isinstance(room_ref, dict):
                # Caso venha como objeto (ex: {"id": "...", "name": "105"})
                room_name = (
                    str(room_ref.get("name") or room_ref.get("number") or "—")
                    .replace("RM-", "")
                    .replace("RM ", "")
                    .replace("Quarto", "")
                    .replace("QUARTO", "")
                    .strip()
                )

            # 🔹 Check-ins de hoje
            if check_in == today:
                checkins_today.append({
                    "id": res.id,
                    "guest": guest_name,
                    "room": room_name,
                })

            # 🔹 Check-outs de hoje
            if check_out == today:
                checkouts_today.append({
                    "id": res.id,
                    "guest": guest_name,
                    "room": room_name,
                })

        # --- KPIs ---
        occupancy_rate = round((occupied_rooms / total_rooms) * 100, 1) if total_rooms > 0 else 0

        return {
            "summary": {
                "occupancyRate": f"{occupancy_rate}%",
                "checkinsPending": len(checkins_today),
                "checkoutsPending": len(checkouts_today),
                "maintenance": maintenance_rooms,
            },
            "roomsStatus": {
                "available": available_rooms,
                "occupied": occupied_rooms,
                "maintenance": maintenance_rooms,
            },
            "todayMovements": {
                "checkins": checkins_today,
                "checkouts": checkouts_today,
            },
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
