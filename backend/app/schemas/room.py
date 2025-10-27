from pydantic import BaseModel, Field


class RoomBase(BaseModel):
    identifier: str = Field(..., description="Identificador curto exibido na UI.")
    room_type: str = Field(..., description="Tipo de quarto (Standard, Deluxe, etc.)")
    description: str | None = None
    status: str = Field(
        default="disponível",
        description="Status operacional do quarto (disponível, ocupado, manutenção).",
    )
    amenities: list[str] = Field(default_factory=list)
    images: list[str] = Field(
        default_factory=list,
        description="URLs de imagens ilustrativas do quarto.",
    )


class RoomCreate(RoomBase):
    ...


class RoomUpdate(BaseModel):
    identifier: str | None = None
    room_type: str | None = None
    description: str | None = None
    status: str | None = None
    amenities: list[str] | None = None
    images: list[str] | None = None


class RoomCard(RoomBase):
    id: str

    class Config:
        from_attributes = True


class RoomFilterParams(BaseModel):
    search: str | None = None
    room_type: str | None = None
    status: str | None = None
