"""Thin. Parse, call the service, return the schema."""

from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends, Query

from app.core.db import SessionDep
from app.modules.auth.router_deps import get_optional_user
from app.modules.kundali.repository import record_guest_generation
from app.modules.kundali.schemas import BirthDetailsIn, ChartOut
from app.modules.kundali.service import (
    DEFAULT_DASHA_DEPTH,
    MAX_DASHA_DEPTH,
    generate_chart,
)

router = APIRouter(prefix="/v1/kundali", tags=["kundali"])


@router.post(
    "",
    response_model=ChartOut,
    summary="Generate a birth chart",
    description=(
        "Computes a full Vedic chart from birth details: Lahiri ayanamsa, "
        "whole-sign houses, mean nodes, Vimshottari dasha. Deterministic and "
        "synchronous — the calculation is local arithmetic against an "
        "ephemeris, not a job.\n\n"
        "See docs/astrology-methodology.md for every methodology decision."
    ),
)
async def create_kundali(
    details: BirthDetailsIn,
    session: SessionDep,
    user_id: Annotated[str | None, Depends(get_optional_user)],
    dasha_depth: Annotated[
        int,
        Query(
            ge=1,
            le=MAX_DASHA_DEPTH,
            description=(
                "Dasha levels to return: 1 maha, 2 +antar, 3 +pratyantar. "
                "Defaults to 2 — the full tree is 819 periods and ~78KB, "
                "against ~12KB for two levels. Request 3 only when drilling "
                "into a specific period."
            ),
        ),
    ] = DEFAULT_DASHA_DEPTH,
) -> ChartOut:
    if user_id is None:
        record_guest_generation(session)

    return generate_chart(details, dasha_depth=dasha_depth)

