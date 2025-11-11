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
    responsible: str
    cnpj: str
    email: str | None = None
    phone: str | None = None
    createdAt: str | None = None



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
# 🔹 CRIAR EMPRESA
# =====================================================
@router.post("/companies")
def create_company(company: dict):
    """Cria um novo registro de empresa"""
    try:
        company_ref = db.collection("companies").document()
        company_data = {
            "name": company.get("name"),
            "responsible": company.get("responsible"),
            "cnpj": company.get("cnpj"),
            "email": company.get("email", ""),
            "phone": company.get("phone", ""),
            "createdAt": date.today().isoformat(),
        }
        company_ref.set(company_data)

        return {
            "message": "Empresa criada com sucesso!",
            "id": company_ref.id,
            "data": company_data
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# =====================================================
# 🔹 ATUALIZAR EMPRESA
# =====================================================
@router.put("/companies/{company_id}")
def update_company(company_id: str, company: Company):
    """Atualiza os dados básicos da empresa"""
    try:
        ref = db.collection("companies").document(company_id)
        if not ref.get().exists:
            raise HTTPException(status_code=404, detail="Empresa não encontrada")

        ref.update({
            "name": company.name,
            "responsible": company.responsible,
            "cnpj": company.cnpj,
            "email": company.email or "",
            "phone": company.phone or "",
        })

        print(f"✏️ Empresa {company_id} atualizada com sucesso.")
        return {"message": "Empresa atualizada com sucesso!"}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# =====================================================
# 🔹 DELETAR EMPRESA
# =====================================================
@router.delete("/companies/{company_id}")
def delete_company(company_id: str):
    """Remove empresa permanentemente"""
    try:
        company_ref = db.collection("companies").document(company_id)
        doc = company_ref.get()

        if not doc.exists:
            raise HTTPException(status_code=404, detail="Empresa não encontrada.")

        company_ref.delete()
        return {"message": "Empresa removida com sucesso."}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))