"""Daily rasifal endpoints."""

from __future__ import annotations

from datetime import date, timedelta

from typing import Literal

from fastapi import APIRouter, Query

from app.core.errors import ValidationError
from app.modules.rasifal import service
from app.modules.rasifal.schemas import PeriodRasifalOut, RasifalOut

router = APIRouter(prefix="/v1", tags=["rasifal"])

# A year either side. Beyond that this is not a horoscope, it is an ephemeris
# dump, and every request costs a swisseph run.
_WINDOW = timedelta(days=366)


@router.get("/rasifal", response_model=RasifalOut, summary="The day's rasifal")
def rasifal(
    on: date | None = Query(
        default=None,
        description="Date to read, in Nepal time. Defaults to today in Kathmandu.",
    ),
) -> RasifalOut:
    """All twelve rashis judged by gochara for one day.

    Deliberately unauthenticated: this is the same public sky for everyone and
    carries no birth data, so it costs nothing to give away and is the page
    most likely to bring someone to the product.
    """
    today = service.today_in_nepal()
    day = on or today
    if abs(day - today) > _WINDOW:
        raise ValidationError("That date is outside the range this reads.")
    return service.for_date(day)


@router.get(
    "/rasifal/period",
    response_model=PeriodRasifalOut,
    summary="The week's or month's rasifal",
)
def rasifal_period(
    span: Literal["weekly", "monthly"] = Query(default="weekly"),
    on: date | None = Query(
        default=None, description="First day of the span. Defaults to today in Kathmandu."
    ),
) -> PeriodRasifalOut:
    """All twelve rashis across a span, aggregated from every day in it.

    Each day is genuinely computed rather than sampled, so the span knows the
    date Saturn changes house rather than averaging over it.
    """
    today = service.today_in_nepal()
    start = on or today
    if abs(start - today) > _WINDOW:
        raise ValidationError("That date is outside the range this reads.")
    return service.for_period(start, span)
