from fastapi import APIRouter

from app.api.v1.endpoints import (
    admin,
    auth,
    companies,
    dashboard,
    expenses,
    financials,
    guests,
    maintenance,
    reservations,
    rooms,
)

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["autenticação"])
api_router.include_router(dashboard.router, prefix="/dashboard", tags=["dashboard"])
api_router.include_router(guests.router, prefix="/guests", tags=["hóspedes"])
api_router.include_router(companies.router, prefix="/companies", tags=["empresas"])
api_router.include_router(
    reservations.router, prefix="/reservations", tags=["reservas"]
)
api_router.include_router(rooms.router, prefix="/rooms", tags=["quartos"])
api_router.include_router(maintenance.router, prefix="/maintenance", tags=["manutenção"])
api_router.include_router(expenses.router, prefix="/expenses", tags=["financeiro"])
api_router.include_router(
    financials.router, prefix="/financials", tags=["financeiro"]
)
api_router.include_router(admin.router, prefix="/admin", tags=["administração"])
