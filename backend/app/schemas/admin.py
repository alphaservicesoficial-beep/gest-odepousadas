from pydantic import BaseModel, EmailStr, Field


class AIConsultantRequest(BaseModel):
    question: str = Field(..., description="Pergunta feita ao consultor de IA.")
    enable_web_vision: bool = False


class AIConsultantResponse(BaseModel):
    answer: str
    model: str
    web_vision_enabled: bool
    data_sources: list[str] = Field(default_factory=list)


class SystemHealthStatus(BaseModel):
    status: str
    last_backup: str
    next_backup: str
    pending_integrations: list[str] = Field(default_factory=list)


class NotificationSettings(BaseModel):
    email_notifications: bool = True
    in_app_notifications: bool = True
    granular: dict[str, bool] = Field(default_factory=dict)


class RoleDefinition(BaseModel):
    id: str | None = None
    name: str
    menu_permissions: list[str] = Field(default_factory=list)


class UserInviteRequest(BaseModel):
    email: EmailStr
    role_id: str
