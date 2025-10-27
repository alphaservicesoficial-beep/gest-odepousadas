from datetime import date

from fastapi import APIRouter

from app.schemas.dashboard import DashboardSummary

router = APIRouter()


@router.get("/", response_model=DashboardSummary)
async def read_dashboard() -> DashboardSummary:
    """Retorna um resumo estático para validação do front-end."""
    return DashboardSummary(
        greeting_name="Usuário Demo",
        occupancy_rate=0.72,
        pending_checkins=4,
        pending_checkouts=3,
        rooms_needing_attention=2,
        room_status_overview={
            "disponíveis": 12,
            "ocupados": 18,
            "manutenção": 3,
        },
        today_movements={
            "checkins": [
                {"reservation_id": "RES-001", "guest_name": "Maria Silva", "room": "202"},
                {"reservation_id": "RES-002", "guest_name": "João Souza", "room": "305"},
            ],
            "checkouts": [
                {"reservation_id": "RES-003", "guest_name": "Ana Lima", "room": "101"},
            ],
            "date": date.today(),
        },
    )
