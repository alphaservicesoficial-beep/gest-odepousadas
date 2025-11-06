from fastapi import APIRouter, HTTPException, Body
from pydantic import BaseModel
from app.core.firebase import db
from google.cloud import firestore
from datetime import datetime, date
import re

router = APIRouter()


# ==========================================================
# 🔹 MODELOS DE DADOS
# ==========================================================
class Company(BaseModel):
    name: str
    cnpj: str
    mainContact: str
    email: str
    phone: str
    checkIn: str | None = None
    checkOut: str | None = None
    guests: int | None = None
    roomId: str | None = None
    roomNumber: str | None = None
    amenities: list[str] | None = None
    value: str | None = None
    notes: str | None = None


# ==========================================================
# 🔹 FUNÇÕES AUXILIARES
# ==========================================================
def digits_only(text: str) -> str:
    """Extrai apenas números (ex: RM-105 → 105)."""
    return "".join(re.findall(r"\d+", str(text or "")))


def get_room_number_from_room_id(room_id: str) -> str | None:
    """Busca o número do quarto no Firestore."""
    if not room_id:
        return None
    snap = db.collection("rooms").document(room_id).get()
    if not snap.exists:
        cleaned = digits_only(room_id)
        return cleaned or None
    data = snap.to_dict() or {}
    return str(data.get("number") or digits_only(room_id) or "").strip() or None


def update_room_status(room_id: str, new_status: str, guest_name: str = None, notes: str = None):
    """Atualiza status e informações do quarto."""
    try:
        room_ref = db.collection("rooms").document(room_id)
        update_data = {"status": new_status}

        if new_status == "disponível":
            update_data["guest"] = None
            update_data["guestNotes"] = None
        else:
            update_data["guest"] = guest_name or ""
            update_data["guestNotes"] = notes or ""

        room_ref.update(update_data)
        print(f"✅ Quarto {room_id} atualizado para {new_status}")

    except Exception as e:
        print(f"⚠️ Erro ao atualizar quarto {room_id}: {e}")


# ==========================================================
# 🔹 LISTAR TODAS AS EMPRESAS
# ==========================================================
@router.get("/companies")
def get_companies():
    companies_ref = db.collection("companies").get()
    companies = [doc.to_dict() | {"id": doc.id} for doc in companies_ref]
    return companies


# ==========================================================
# 🔹 CRIAR NOVA EMPRESA + RESERVA
# ==========================================================
@router.post("/companies")
def create_company(company: dict = Body(...)):
    try:
        # 1️⃣ Cria a empresa
        company_ref = db.collection("companies").document()
        company_ref.set(company)
        company_id = company_ref.id

        # 2️⃣ Se tiver um quarto vinculado
        if "roomId" in company and company["roomId"]:
            check_in = date.fromisoformat(company.get("checkIn"))
            check_out = date.fromisoformat(company.get("checkOut"))
            today = date.today()

            # --- Determina o status correto ---
            if today < check_in:
                status = "reservado"
            elif today == check_in:
                status = "confirmado"  # ✅ No mesmo dia do check-in
            elif check_in < today <= check_out:
                status = "ocupado"
            else:
                status = "disponível"

            # --- Resolve número do quarto ---
            rn_payload = str(company.get("roomNumber") or "").strip()
            room_number = rn_payload or get_room_number_from_room_id(company.get("roomId"))

            # --- Cria reserva ---
            reservation = {
                "companyId": company_id,
                "companyName": company.get("name"),
                "roomId": company.get("roomId"),
                "roomNumber": room_number,
                "checkIn": company.get("checkIn"),
                "checkOut": company.get("checkOut"),
                "guests": company.get("guests", 1),
                "value": company.get("value"),
                "status": status,
                "notes": company.get("notes", ""),
                "createdAt": firestore.SERVER_TIMESTAMP,
            }

            db.collection("reservations").add(reservation)

            update_room_status(
                company["roomId"],
                status,
                guest_name=company.get("name"),
                notes=company.get("notes")
            )

        return {
            "message": f"Empresa criada com sucesso e quarto marcado como {status}.",
            "companyId": company_id
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ==========================================================
# 🔹 ATUALIZAR EMPRESA EXISTENTE
# ==========================================================
@router.put("/companies/{company_id}")
def update_company(company_id: str, data: Company):
    try:
        doc_ref = db.collection("companies").document(company_id)
        doc = doc_ref.get()
        if not doc.exists:
            raise HTTPException(status_code=404, detail="Empresa não encontrada.")

        doc_ref.update({k: v for k, v in data.dict().items() if v is not None})

        if data.roomId and data.checkIn:
            today = datetime.now().date()
            check_in = datetime.strptime(data.checkIn, "%Y-%m-%d").date()
            check_out = datetime.strptime(data.checkOut, "%Y-%m-%d").date() if data.checkOut else check_in

            # --- Lógica de status ---
            if today < check_in:
                status = "reservado"
            elif today == check_in:
                status = "confirmado"
            elif check_in < today <= check_out:
                status = "ocupado"
            else:
                status = "disponível"

            update_room_status(
                data.roomId,
                status,
                guest_name=data.name,
                notes=data.notes
            )

        return {"message": f"Empresa {company_id} atualizada com sucesso!"}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ==========================================================
# 🔹 DELETAR EMPRESA + LIBERAR QUARTO + EXCLUIR RESERVA
# ==========================================================
@router.delete("/companies/{company_id}")
def delete_company(company_id: str):
    try:
        doc_ref = db.collection("companies").document(company_id)
        doc = doc_ref.get()

        if not doc.exists:
            raise HTTPException(status_code=404, detail="Empresa não encontrada.")

        company_data = doc.to_dict()
        room_id = company_data.get("roomId")

        # Apaga a empresa
        doc_ref.delete()

        # Libera quarto
        if room_id:
            update_room_status(room_id, "disponível")

        # Remove reservas associadas
        reservations_ref = db.collection("reservations")
        reservations = reservations_ref.where("companyId", "==", company_id).get()
        for r in reservations:
            r.reference.delete()
            print(f"🗑️ Reserva {r.id} removida da empresa {company_id}")

        return {"message": "Empresa e reservas excluídas, quarto liberado!"}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ==========================================================
# 🔹 LISTAR QUARTOS DISPONÍVEIS
# ==========================================================
@router.get("/available-rooms")
def get_available_rooms(current_room_id: str | None = None):
    """Retorna quartos disponíveis (inclui o quarto atual mesmo se ocupado)."""
    try:
        rooms_ref = db.collection("rooms").where("status", "==", "disponível").get()
        rooms = [doc.to_dict() | {"id": doc.id} for doc in rooms_ref]

        if current_room_id:
            current_room_ref = db.collection("rooms").document(current_room_id).get()
            if current_room_ref.exists:
                current_room_data = current_room_ref.to_dict() | {"id": current_room_ref.id}
                if not any(r["id"] == current_room_id for r in rooms):
                    rooms.append(current_room_data)

        return rooms

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao buscar quartos: {e}")


# ==========================================================
# 🔹 GERAR NOVA RESERVA PARA UMA EMPRESA EXISTENTE
# ==========================================================
@router.post("/companies/{company_id}/new_reservation")
def generate_new_reservation(company_id: str, data: dict = Body(...)):
    """
    Gera uma nova reserva para uma empresa existente sem apagar a anterior.
    Atualiza o quarto antigo para disponível e marca o novo como reservado/confirmado/ocupado conforme a data.
    """
    try:
        doc_ref = db.collection("companies").document(company_id)
        doc = doc_ref.get()
        if not doc.exists:
            raise HTTPException(status_code=404, detail="Empresa não encontrada.")

        old_company = doc.to_dict()
        old_room_id = old_company.get("roomId")

        # Libera quarto antigo se foi trocado
        if old_room_id and old_room_id != data.get("roomId"):
            update_room_status(old_room_id, "disponível")

        # --- Determina status corretamente ---
        check_in = date.fromisoformat(data.get("checkIn"))
        check_out = date.fromisoformat(data.get("checkOut"))
        today = date.today()

        if today < check_in:
            status = "reservado"
        elif today == check_in:
            status = "confirmado"
        elif check_in < today <= check_out:
            status = "ocupado"
        else:
            status = "disponível"

        room_number = str(data.get("roomNumber") or get_room_number_from_room_id(data.get("roomId")) or "")

        # --- Cria nova reserva ---
        reservation = {
            "companyId": company_id,
            "companyName": data.get("name"),
            "roomId": data.get("roomId"),
            "roomNumber": room_number,
            "checkIn": data.get("checkIn"),
            "checkOut": data.get("checkOut"),
            "guests": data.get("guests", 1),
            "value": data.get("value"),
            "status": status,
            "notes": data.get("notes", ""),
            "createdAt": firestore.SERVER_TIMESTAMP,
        }

        db.collection("reservations").add(reservation)

        # --- Atualiza empresa ---
        doc_ref.update({
            "roomId": data.get("roomId"),
            "roomNumber": room_number,
            "checkIn": data.get("checkIn"),
            "checkOut": data.get("checkOut"),
            "guests": data.get("guests"),
            "value": data.get("value"),
            "notes": data.get("notes")
        })

        update_room_status(
            data["roomId"],
            status,
            guest_name=data.get("name"),
            notes=data.get("notes")
        )

        return {"message": "Nova reserva criada para a empresa.", "status": status}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao criar nova reserva: {e}")
