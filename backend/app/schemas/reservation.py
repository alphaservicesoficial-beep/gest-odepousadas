from datetime import date
from typing import Literal

from pydantic import BaseModel, Field


ReservationStatus = Literal["confirmada", "pendente", "cancelada", "em_andamento"]
PaymentStatus = Literal["pago", "parcial", "pendente"]


class ReservationBase(BaseModel):
    guest_or_company: str
    room: str
    guests_count: int = Field(..., ge=1)
    check_in: date
    check_out: date
    reservation_status: ReservationStatus = "pendente"
    payment_status: PaymentStatus = "pendente"
    payment_method: str | None = None
    total_amount: float = Field(..., ge=0)


class ReservationListItem(ReservationBase):
    id: str


class ReservationCalendarEntry(BaseModel):
    reservation_id: str
    room: str
    start: date
    end: date
    guest_or_company: str
    status: ReservationStatus


class ReservationMovementSummary(BaseModel):
    filters: dict[str, str] = Field(default_factory=dict)
    upcoming_checkins: list[ReservationListItem] = Field(default_factory=list)
    upcoming_checkouts: list[ReservationListItem] = Field(default_factory=list)


class ReservationStatusCounters(BaseModel):
    confirmed: int = 0
    pending: int = 0
    cancelled: int = 0
    in_house: int = 0
