from pydantic import BaseModel, EmailStr, Field


class CompanyBase(BaseModel):
    name: str = Field(..., description="Nome empresarial.")
    cnpj: str = Field(..., description="CNPJ no formato 00.000.000/0000-00.")
    main_contact: str
    email: EmailStr
    phone: str


class CompanyCreate(CompanyBase):
    ...


class CompanyUpdate(BaseModel):
    name: str | None = None
    cnpj: str | None = None
    main_contact: str | None = None
    email: EmailStr | None = None
    phone: str | None = None


class CompanyResponse(CompanyBase):
    id: str

    class Config:
        from_attributes = True
