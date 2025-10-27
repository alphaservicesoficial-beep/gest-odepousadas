from datetime import date

from fastapi import APIRouter

from app.schemas.reservation import (
    ReservationCalendarEntry,
    ReservationListItem,
    ReservationMovementSummary,
    ReservationStatusCounters,
)

router = APIRouter()


@router.get("/movements", response_model=ReservationMovementSummary)
async def get_movements() -> ReservationMovementSummary:
    return ReservationMovementSummary(
        filters={"period": "today"},
        upcoming_checkins=[
            ReservationListItem(
                id="RES-100",
                guest_or_company="Maria Silva",
                room="203",
                guests_count=2,
                check_in=date.today(),
                check_out=date.today(),
                reservation_status="confirmada",
                payment_status="pago",
                payment_method="Cartão",
                total_amount=780.0,
            )
        ],
        upcoming_checkouts=[
            ReservationListItem(
                id="RES-207",
                guest_or_company="Ednara Morinho",
                room="207",
                guests_count=3,
                check_in=date(2025, 7, 11),
                check_out=date(2025, 7, 17),
                reservation_status="confirmada",
                payment_status="pendente",
                payment_method="Dinheiro",
                total_amount=1250.0,
            )
        ],
    )


@router.get("/list", response_model=list[ReservationListItem])
async def get_reservations_list() -> list[ReservationListItem]:
    return [
        ReservationListItem(
            id="RES-100",
            guest_or_company="Maria Silva",
            room="203",
            guests_count=2,
            check_in=date.today(),
            check_out=date.today(),
            reservation_status="confirmada",
            payment_status="pago",
            payment_method="Cartão",
            total_amount=780.0,
        ),
        ReservationListItem(
            id="RES-207",
            guest_or_company="Ednara Morinho",
            room="207",
            guests_count=3,
            check_in=date(2025, 7, 11),
            check_out=date(2025, 7, 17),
            reservation_status="confirmada",
            payment_status="pendente",
            payment_method="Dinheiro",
            total_amount=1250.0,
        )
    ]


@router.get("/calendar", response_model=list[ReservationCalendarEntry])
async def get_reservations_calendar() -> list[ReservationCalendarEntry]:
    return [
        ReservationCalendarEntry(
            reservation_id="RES-100",
            room="203",
            start=date.today(),
            end=date.today(),
            guest_or_company="Maria Silva",
            status="confirmada",
        ),
        ReservationCalendarEntry(
            reservation_id="RES-207",
            room="207",
            start=date(2025, 7, 11),
            end=date(2025, 7, 17),
            guest_or_company="Ednara Morinho",
            status="confirmada",
        ),
    ]


@router.get("/status-counters", response_model=ReservationStatusCounters)
async def get_status_counters() -> ReservationStatusCounters:
    return ReservationStatusCounters(
        confirmed=12,
        pending=4,
        cancelled=1,
        in_house=8,
    )
