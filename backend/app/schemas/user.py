from pydantic import BaseModel, EmailStr, Field


class UserBase(BaseModel):
    name: str
    email: EmailStr
    role: str


class UserCreate(UserBase):
    password: str = Field(..., min_length=6)


class UserResponse(UserBase):
    id: str


class Role(BaseModel):
    id: str
    name: str
    menu_permissions: list[str] = Field(default_factory=list)
