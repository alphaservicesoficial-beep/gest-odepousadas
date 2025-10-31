from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import auth, companies, guests, rooms, reservations, calendar, movements, dashboard
from app.core.firebase import db

# ✅ importar o router de manutenção
from app.api import maintenance, incomes, expenses, settings, receipts

from app.api import financial_dashboard

app = FastAPI(title="Gestão de Pousadas API")

# 🔹 Permitir requisições do frontend (React Vite)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Rotas ---
app.include_router(auth.router, prefix="/api", tags=["auth"])
app.include_router(companies.router, prefix="/api", tags=["companies"])
app.include_router(guests.router, prefix="/api", tags=["guests"])
app.include_router(rooms.router, prefix="/api", tags=["rooms"])
app.include_router(reservations.router, prefix="/api", tags=["reservations"])
app.include_router(maintenance.router, prefix="/api", tags=["maintenance"])
app.include_router(calendar.router, prefix="/api", tags=["calendar"])
app.include_router(movements.router, prefix="/api", tags=["movements"])
app.include_router(dashboard.router, prefix="/api", tags=["dashboard"])
app.include_router(incomes.router, prefix="/api", tags=["incomes"])
app.include_router(expenses.router, prefix="/api", tags=["expenses"])
app.include_router(financial_dashboard.router, prefix="/api", tags=["financial"])
app.include_router(settings.router, prefix="/api") 
app.include_router(receipts.router, prefix="/api", tags=["reports"]) 


@app.get("/")
def root():
    return {"status": "API online 🚀"}


@app.get("/test-firebase")
def test_firebase():
    try:
        users_ref = db.collection("users").limit(1).get()
        return {"connected": True, "sample_user": [u.to_dict() for u in users_ref]}
    except Exception as e:
        return {"connected": False, "error": str(e)}
