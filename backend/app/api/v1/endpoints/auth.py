from fastapi import APIRouter, HTTPException, status

from app.schemas.auth import AuthenticatedUser, LoginRequest, LoginResponse

router = APIRouter()


@router.post("/login", response_model=LoginResponse)
async def login(payload: LoginRequest) -> LoginResponse:
    """
    Endpoint de autenticação. Em produção, validará as credenciais no Firebase.
    """
    if not payload.username or not payload.password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Credenciais inválidas.",
        )

    # Placeholder de fluxo de autenticação via Firebase Authentication.
    return LoginResponse(
        access_token="token-de-exemplo",
        refresh_token="refresh-token-de-exemplo",
        token_type="Bearer",
        expires_in=3600,
        user=AuthenticatedUser(
            id="user_demo",
            name="Usuário Demo",
            role="manager",
        ),
    )
