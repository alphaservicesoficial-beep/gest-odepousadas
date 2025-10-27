from fastapi import APIRouter, HTTPException

from app.schemas.room import RoomCard, RoomCreate, RoomFilterParams, RoomUpdate

router = APIRouter()

_ROOMS = {
    "RM-101": RoomCard(
        id="RM-101",
        identifier="101",
        room_type="Standard",
        description="Quarto standard com vista interna.",
        status="disponível",
        amenities=["Wi-Fi", "TV", "Ar-condicionado"],
        images=[
            "https://images.unsplash.com/photo-1505691723518-36a5ac3be353",
        ],
    ),
    "RM-203": RoomCard(
        id="RM-203",
        identifier="203",
        room_type="Deluxe",
        description="Suíte deluxe com varanda e vista para o mar.",
        status="ocupado",
        amenities=["Wi-Fi", "TV", "Ar-condicionado", "Varanda"],
        images=[
            "https://images.unsplash.com/photo-1489177847829-277fdb2a3f44",
            "https://images.unsplash.com/photo-1505692794403-55b39e014be3",
        ],
    ),
    "RM-207": RoomCard(
        id="RM-207",
        identifier="207",
        room_type="Suíte Família",
        description="Suíte para até três hóspedes, ideal para famílias pequenas. Inclui varanda e área de trabalho.",
        status="disponível",
        amenities=["Wi-Fi", "TV", "Ar-condicionado", "Varanda", "Mesa de trabalho"],
        images=[
            "https://images.unsplash.com/photo-1505691723518-36a5ac3be353",
            "https://images.unsplash.com/photo-1475856034135-8d7d0b4458dd",
        ],
    ),
}


@router.get("/", response_model=list[RoomCard])
async def list_rooms(
    search: str | None = None,
    room_type: str | None = None,
    status: str | None = None,
) -> list[RoomCard]:
    # Filtro simples em memória para uso preliminar.
    rooms = list(_ROOMS.values())
    filters = RoomFilterParams(search=search, room_type=room_type, status=status)
    if filters.search:
        rooms = [
            room
            for room in rooms
            if filters.search.lower() in room.identifier.lower()
            or (room.description and filters.search.lower() in room.description.lower())
        ]
    if filters.room_type:
        rooms = [room for room in rooms if room.room_type == filters.room_type]
    if filters.status:
        rooms = [room for room in rooms if room.status == filters.status]
    return rooms


@router.post("/", response_model=RoomCard, status_code=201)
async def create_room(payload: RoomCreate) -> RoomCard:
    room_id = f"RM-{len(_ROOMS) + 101}"
    room = RoomCard(id=room_id, **payload.model_dump())
    _ROOMS[room_id] = room
    return room


@router.put("/{room_id}", response_model=RoomCard)
async def update_room(room_id: str, payload: RoomUpdate) -> RoomCard:
    if room_id not in _ROOMS:
        raise HTTPException(status_code=404, detail="Quarto não encontrado.")

    room = _ROOMS[room_id]
    updated = room.model_copy(update=payload.model_dump(exclude_unset=True))
    _ROOMS[room_id] = updated
    return updated
