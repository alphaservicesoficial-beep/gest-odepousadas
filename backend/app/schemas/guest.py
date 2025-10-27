from pydantic import BaseModel, EmailStr, Field


class GuestBase(BaseModel):
    full_name: str = Field(..., description="Nome completo do hóspede.")
    cpf: str = Field(..., description="CPF no formato 000.000.000-00.")
    email: EmailStr
    phone: str


class GuestCreate(GuestBase):
    ...


class GuestUpdate(BaseModel):
    full_name: str | None = None
    cpf: str | None = None
    email: EmailStr | None = None
    phone: str | None = None


class GuestResponse(GuestBase):
    id: str

    class Config:
        from_attributes = True
