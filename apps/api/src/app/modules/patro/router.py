"""Patro endpoints."""

from __future__ import annotations

from datetime import date, timedelta
from typing import Annotated

from fastapi import APIRouter, Query

from app.core.errors import ValidationError
from app.modules.patro import service
from app.modules.patro.schemas import PatroRangeOut

router = APIRouter(prefix="/v1", tags=["patro"])

_WINDOW = timedelta(days=366 * 5)
_MAX_DAYS = 45


@router.get("/patro", response_model=PatroRangeOut, summary="Patro days for a range")
def patro_range(
    start: Annotated[date | None, Query(description="First day. Defaults to today.")] = None,
    days: Annotated[int, Query(ge=1, le=_MAX_DAYS)] = 32,
) -> PatroRangeOut:
    """A run of days with the panchang each one is read by.

    The Bikram Sambat month is not computed here: it is a published table
    rather than something the sky knows, and the client already owns it. This
    serves whatever span of days the client asks for, and the client decides
    which of them make up Bhadra.

    Unauthenticated, like the rasifal — a calendar is public by nature.
    """
    today = service.today_in_nepal()
    first = start or today
    if abs(first - today) > _WINDOW:
        raise ValidationError("That date is outside the range this reads.")
    return service.for_range(first, days)
