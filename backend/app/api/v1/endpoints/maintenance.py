from datetime import date

from fastapi import APIRouter, HTTPException

from app.schemas.maintenance import MaintenanceItem, MaintenanceUpdate

router = APIRouter()

_MAINTENANCE = [
    MaintenanceItem(
        id="MT-001",
        room="101",
        description="Revisar ar-condicionado",
        priority="alta",
        status="em_andamento",
        reported_on=date(2025, 10, 10),
        completed_on=None,
    )
]


@router.get("/", response_model=list[MaintenanceItem])
async def list_maintenance() -> list[MaintenanceItem]:
    return _MAINTENANCE


@router.put("/{task_id}", response_model=MaintenanceItem)
async def update_maintenance(task_id: str, payload: MaintenanceUpdate) -> MaintenanceItem:
    for index, item in enumerate(_MAINTENANCE):
        if item.id == task_id:
            updated = item.model_copy(update=payload.model_dump(exclude_unset=True))
            _MAINTENANCE[index] = updated
            return updated
    raise HTTPException(status_code=404, detail="Tarefa não encontrada.")
