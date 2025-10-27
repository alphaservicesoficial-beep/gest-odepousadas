from fastapi import APIRouter, HTTPException

from app.schemas.company import CompanyCreate, CompanyResponse, CompanyUpdate

router = APIRouter()

_COMPANIES: dict[str, CompanyResponse] = {
    "CMP-001": CompanyResponse(
        id="CMP-001",
        name="Viagens Brasil LTDA",
        cnpj="12.345.678/0001-00",
        main_contact="Carlos Pereira",
        email="carlos@viagensbrasil.com",
        phone="+55 11 99876-5432",
    )
}


@router.get("/", response_model=list[CompanyResponse])
async def list_companies() -> list[CompanyResponse]:
    return list(_COMPANIES.values())


@router.post("/", response_model=CompanyResponse, status_code=201)
async def create_company(payload: CompanyCreate) -> CompanyResponse:
    company_id = f"CMP-{len(_COMPANIES) + 1:03d}"
    company = CompanyResponse(id=company_id, **payload.model_dump())
    _COMPANIES[company_id] = company
    return company


@router.put("/{company_id}", response_model=CompanyResponse)
async def update_company(company_id: str, payload: CompanyUpdate) -> CompanyResponse:
    if company_id not in _COMPANIES:
        raise HTTPException(status_code=404, detail="Empresa não encontrada.")

    stored = _COMPANIES[company_id]
    updated = stored.model_copy(update=payload.model_dump(exclude_unset=True))
    _COMPANIES[company_id] = updated
    return updated
