from fastapi import APIRouter

from app.schemas.admin import (
    AIConsultantRequest,
    AIConsultantResponse,
    NotificationSettings,
    RoleDefinition,
    SystemHealthStatus,
    UserInviteRequest,
)

router = APIRouter()


@router.post("/ai-consultant", response_model=AIConsultantResponse)
async def ask_ai(payload: AIConsultantRequest) -> AIConsultantResponse:
    # Placeholder para integração com modelo de IA.
    return AIConsultantResponse(
        answer="Esta é uma resposta simulada do consultor de IA.",
        model="gpt-hospitality-pro",
        web_vision_enabled=True,
        data_sources=["reservations", "financials"],
    )


@router.get("/system-health", response_model=SystemHealthStatus)
async def get_system_health() -> SystemHealthStatus:
    return SystemHealthStatus(
        status="ok",
        last_backup="2025-10-12T23:00:00Z",
        next_backup="2025-10-13T23:00:00Z",
        pending_integrations=["Channel Manager", "Payment Gateway"],
    )


@router.post("/roles", response_model=RoleDefinition, status_code=201)
async def create_role(payload: RoleDefinition) -> RoleDefinition:
    return payload


@router.post("/users/invite", status_code=202)
async def invite_user(payload: UserInviteRequest) -> dict[str, str]:
    return {"status": "convite_enviado", "email": payload.email}


@router.put("/notifications", response_model=NotificationSettings)
async def update_notifications(payload: NotificationSettings) -> NotificationSettings:
    return payload
