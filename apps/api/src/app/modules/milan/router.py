"""FastAPI router for Kundali Milan (Matchmaking). Routes only."""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status

from app.modules.auth.router_deps import get_current_user
from app.modules.milan import service
from app.modules.milan.schemas import (
    MilanAnalysisRequest,
    MilanAnalysisResponse,
    MilanRequest,
    MilanResponse,
)

router = APIRouter(prefix="/v1/milan", tags=["milan"])


@router.post("/match", response_model=MilanResponse)
def match(body: MilanRequest) -> MilanResponse:
    return service.compute_match(body)


@router.post(
    "/analysis",
    response_model=MilanAnalysisResponse,
    summary="A Jyotish reading of an Ashtakoota match",
    description=(
        "Recomputes the match from the same birth details and hands it, with "
        "both complete charts, to the model — which kootas matched and which "
        "did not, the outlook for the marriage, any dosha and what it bears on, "
        "and the remedies for it. Separate from `/match` because the arithmetic "
        "returns in milliseconds and the reading does not."
    ),
)
async def analysis(
    body: MilanAnalysisRequest,
    user_id: str = Depends(get_current_user),
) -> MilanAnalysisResponse:
    result = await service.analyse(body)
    if result is None:
        # The match itself has already rendered. Say the reading is missing
        # rather than inventing one to fill the space.
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="The astrologer could not complete this reading. Please try again.",
        )
    return result
