from datetime import date

from pydantic import BaseModel, Field


class MovementItem(BaseModel):
    reservation_id: str
    guest_name: str
    room: str


class TodayMovements(BaseModel):
    date: date
    checkins: list[MovementItem] = Field(default_factory=list)
    checkouts: list[MovementItem] = Field(default_factory=list)


class DashboardSummary(BaseModel):
    greeting_name: str
    occupancy_rate: float = Field(ge=0.0, le=1.0)
    pending_checkins: int = Field(ge=0)
    pending_checkouts: int = Field(ge=0)
    rooms_needing_attention: int = Field(ge=0)
    room_status_overview: dict[str, int] = Field(default_factory=dict)
    today_movements: TodayMovements
