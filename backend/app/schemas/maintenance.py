from datetime import date

from pydantic import BaseModel, Field


class MaintenanceItem(BaseModel):
    id: str
    room: str
    description: str
    priority: str = Field(..., description="Prioridade: baixa, média, alta.")
    status: str = Field(..., description="Status: aberto, em_andamento, concluído.")
    reported_on: date
    completed_on: date | None = None


class MaintenanceUpdate(BaseModel):
    description: str | None = None
    priority: str | None = None
    status: str | None = None
    completed_on: date | None = None
