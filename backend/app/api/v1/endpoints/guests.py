from fastapi import APIRouter, HTTPException, status

from app.schemas.guest import GuestCreate, GuestResponse, GuestUpdate

router = APIRouter()

# Dados mockados para validar o consumo do front-end.
_GUESTS = {
    "GST-001": GuestResponse(
        id="GST-001",
        full_name="Maria Silva",
        cpf="123.456.789-00",
        email="maria.silva@example.com",
        phone="+55 11 91234-5678",
    ),
    "GST-002": GuestResponse(
        id="GST-002",
        full_name="Ednara Morinho",
        cpf="RG - Jai Ronaldo",
        email="ednara@exemplo.com",
        phone="(00) 00000-0000",
    ),
}


@router.get("/", response_model=list[GuestResponse])
async def list_guests() -> list[GuestResponse]:
    return list(_GUESTS.values())


@router.post("/", response_model=GuestResponse, status_code=status.HTTP_201_CREATED)
async def create_guest(payload: GuestCreate) -> GuestResponse:
    guest_id = f"GST-{len(_GUESTS) + 1:03d}"
    guest = GuestResponse(id=guest_id, **payload.model_dump())
    _GUESTS[guest_id] = guest
    return guest


@router.put("/{guest_id}", response_model=GuestResponse)
async def update_guest(guest_id: str, payload: GuestUpdate) -> GuestResponse:
    if guest_id not in _GUESTS:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Hóspede não encontrado.")

    stored_guest = _GUESTS[guest_id]
    updated_guest = stored_guest.model_copy(update=payload.model_dump(exclude_unset=True))
    _GUESTS[guest_id] = updated_guest
    return updated_guest
