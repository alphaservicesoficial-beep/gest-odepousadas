from pydantic import BaseModel, Field


class LoginRequest(BaseModel):
    username: str = Field(..., description="Usuário de acesso (não é e-mail).")
    password: str = Field(..., min_length=4, description="Senha do colaborador.")


class AuthenticatedUser(BaseModel):
    id: str
    name: str
    role: str


class LoginResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "Bearer"
    expires_in: int = Field(..., description="Tempo de expiração em segundos.")
    user: AuthenticatedUser
