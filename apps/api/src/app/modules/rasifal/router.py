"""Daily rasifal endpoints."""

from __future__ import annotations

from datetime import date, timedelta

from fastapi import APIRouter, Query

from app.core.errors import ValidationError
from app.modules.rasifal import service
from app.modules.rasifal.schemas import RasifalOut

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
