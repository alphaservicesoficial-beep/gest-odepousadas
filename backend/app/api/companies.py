from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from datetime import date
from firebase_admin import firestore

router = APIRouter()
db = firestore.client()

# =====================================================
# 🔹 MODELO Pydantic
# =====================================================
class Company(BaseModel):
    name: str
    cnpj: str
    mainContact: str
    email: str
    phone: str
    roomId: str
    checkIn: str
    checkOut: str
    guests: int | None = 1
    value: str | None = ""
    notes: str | None = ""


# =====================================================
# 🔹 FUNÇÃO AUXILIAR — Atualiza status e informações do quarto
# =====================================================
def update_room_status(room_id: str, new_status: str, company_name: str = None, notes: str = None):
    """
    Atualiza o status do quarto e os dados da empresa no Firestore.
    """
    try:
        room_ref = db.collection("rooms").document(room_id)
        update_data = {"status": new_status}

        if new_status == "disponível":
            update_data["guest"] = None
            update_data["guestNotes"] = None
        else:
            update_data["guest"] = company_name or ""
            update_data["guestNotes"] = notes or ""

        room_ref.update(update_data)
        print(f"✅ Quarto {room_id} → {new_status} | Empresa: {company_name or '—'} | Notas: {notes or '—'}")

    except Exception as e:
        print(f"⚠️ Erro ao atualizar status do quarto {room_id}: {e}")


# =====================================================
# 🔹 LISTAR EMPRESAS
# =====================================================
@router.get("/companies")
def get_companies():
    """Lista todas as empresas"""
    try:
        companies = []
        for doc in db.collection("companies").stream():
            data = doc.to_dict()
            data["id"] = doc.id
            companies.append(data)
        return companies
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# =====================================================
# 🔹 CRIAR EMPRESA + RESERVA
# =====================================================
@router.post("/companies")
def create_company(company: dict):
    try:
        # Busca o número do quarto antes de salvar
        room_doc = db.collection("rooms").document(company["roomId"]).get()
        room_number = room_doc.to_dict().get("identifier") if room_doc.exists else None
        company["roomNumber"] = room_number

        company_ref = db.collection("companies").document()
        company_ref.set(company)
        company_id = company_ref.id

        # --- Determina status conforme as datas ---
        today = date.today()
        check_in = date.fromisoformat(company.get("checkIn"))
        check_out = date.fromisoformat(company.get("checkOut"))

        if today < check_in:
            status = "reservado"
        elif today == check_in:
            status = "confirmado"
        elif check_in < today <= check_out:
            status = "ocupado"
        else:
            status = "disponível"

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
            "notes": company.get("notes", "")
        }

        db.collection("reservations").add(reservation)

        # --- Atualiza status do quarto ---
        update_room_status(
            company["roomId"],
            status,
            company_name=company.get("name"),
            notes=company.get("notes")
        )

        return {"message": f"Empresa criada com sucesso! Quarto marcado como {status}."}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# =====================================================
# 🔹 ATUALIZAR EMPRESA + RESERVA MAIS RECENTE
# =====================================================
@router.put("/companies/{company_id}")
def update_company(company_id: str, data: Company):
    try:
        ref = db.collection("companies").document(company_id)
        old_doc = ref.get()
        if not old_doc.exists:
            raise HTTPException(status_code=404, detail="Empresa não encontrada")

        old_data = old_doc.to_dict()
        old_room_id = old_data.get("roomId")

        # Atualiza dados da empresa
        ref.update(data.dict())
        print(f"✏️ Empresa {company_id} atualizada → {data.name}")

        # Se trocou de quarto, libera o antigo
        if old_room_id and old_room_id != data.roomId:
            update_room_status(old_room_id, "disponível")

        # Define status conforme as datas
        today = date.today()
        check_in = date.fromisoformat(data.checkIn)
        check_out = date.fromisoformat(data.checkOut)

        if today < check_in:
            new_status = "reservado"
        elif today == check_in:
            new_status = "confirmado"
        elif check_in < today <= check_out:
            new_status = "ocupado"
        else:
            new_status = "disponível"

        # Atualiza o status do novo quarto
        update_room_status(
            data.roomId,
            new_status,
            company_name=data.name,
            notes=data.notes
        )

        # Buscar número do quarto atual
        room_doc = db.collection("rooms").document(data.roomId).get()
        room_number = room_doc.to_dict().get("identifier") if room_doc.exists else None

        # Atualiza a reserva mais recente
        reservations_ref = db.collection("reservations")\
            .where("companyId", "==", company_id)\
            .order_by("__name__", direction=firestore.Query.DESCENDING)\
            .limit(1)\
            .get()

        for res in reservations_ref:
            db.collection("reservations").document(res.id).update({
                "companyName": data.name,
                "roomId": data.roomId,
                "roomNumber": room_number,
                "notes": data.notes,
                "checkIn": data.checkIn,
                "checkOut": data.checkOut,
                "status": new_status,
                "value": data.value,
            })
            print(f"✅ Atualizada reserva mais recente ({res.id}) com quarto {room_number}")

        return {"message": "Empresa e reserva atualizadas com sucesso"}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# =====================================================
# 🔹 DELETAR EMPRESA + RESERVAS
# =====================================================
@router.delete("/companies/{company_id}")
def delete_company(company_id: str):
    try:
        company_ref = db.collection("companies").document(company_id)
        doc = company_ref.get()

        if not doc.exists:
            raise HTTPException(status_code=404, detail="Empresa não encontrada.")

        company_ref.delete()

        # Remove reservas associadas
        reservations = db.collection("reservations").where("companyId", "==", company_id).get()
        for res in reservations:
            db.collection("reservations").document(res.id).delete()

        return {"message": "Empresa e suas reservas foram excluídas com sucesso."}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# =====================================================
# 🔹 NOVA RESERVA (CONGELA ANTERIOR)
# =====================================================
@router.post("/companies/{company_id}/new_reservation")
def create_new_reservation_from_company(company_id: str, data: Company):
    """
    Cria uma nova reserva a partir de uma empresa existente.
    Mantém o histórico anterior e atualiza os dados da empresa.
    """
    try:
        # Buscar empresa existente
        company_ref = db.collection("companies").document(company_id)
        company_doc = company_ref.get()

        if not company_doc.exists:
            raise HTTPException(status_code=404, detail="Empresa não encontrada.")

        # Buscar número do quarto
        room_doc = db.collection("rooms").document(data.roomId).get()
        room_number = room_doc.to_dict().get("identifier") if room_doc.exists else None

        # Determinar status
        today = date.today()
        check_in = date.fromisoformat(data.checkIn)
        check_out = date.fromisoformat(data.checkOut)

        if today < check_in:
            status = "reservado"
        elif today == check_in:
            status = "confirmado"
        elif check_in < today <= check_out:
            status = "ocupado"
        else:
            status = "disponível"

        # Criar nova reserva
        new_reservation = {
            "companyId": company_id,
            "companyName": data.name,
            "roomId": data.roomId,
            "roomNumber": room_number,
            "checkIn": data.checkIn,
            "checkOut": data.checkOut,
            "guests": data.guests or 1,
            "value": data.value or "",
            "status": status,
            "notes": data.notes or "",
        }
        db.collection("reservations").add(new_reservation)

        # Atualizar empresa com dados atuais
        company_ref.update({
            "name": data.name,
            "cnpj": data.cnpj,
            "mainContact": data.mainContact,
            "email": data.email,
            "phone": data.phone,
            "roomId": data.roomId,
            "checkIn": data.checkIn,
            "checkOut": data.checkOut,
            "guests": data.guests,
            "value": data.value,
            "notes": data.notes,
            "roomNumber": room_number
        })

        # Atualizar status do quarto
        update_room_status(data.roomId, status, company_name=data.name, notes=data.notes)

        return {"message": "Nova reserva criada e empresa atualizada com sucesso (reservas antigas preservadas)."}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
