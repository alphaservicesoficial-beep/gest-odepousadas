from fastapi import FastAPI

from app.api.v1.router import api_router
from app.core.config import settings


def get_application() -> FastAPI:
    """Inicializa a aplicação FastAPI com configurações básicas."""
    application = FastAPI(
        title=settings.project_name,
        version=settings.version,
        docs_url="/docs",
        redoc_url="/redoc",
        openapi_url=f"{settings.api_v1_str}/openapi.json",
    )

    application.include_router(api_router, prefix=settings.api_v1_str)

    @application.get("/health", tags=["infra"])
    def health_check() -> dict[str, str]:
        return {"status": "ok"}

    return application


app = get_application()
