"""Kundali Milan: the Ashtakoota computation, and the model's reading of it.

Two entry points over one computation. `compute_match` is the arithmetic —
deterministic, instant, and the only thing `/match` needs. `analyse` runs the
same computation and hands the result to the model.

The analysis endpoint takes birth details rather than a finished match for two
reasons: the wire payload is four fields instead of two full charts, and a
client cannot hand the model a score the engine did not produce. The AI reads
the match; it never computes one (CLAUDE.md rule 1).
"""

from __future__ import annotations

import json
import logging

from anthropic import APIError

from app.astrology_core import build_chart
from app.astrology_core.milan import match_kundalis
from app.integrations.llm import get_client, model_name, tuning
from app.modules.kundali.service import _birth_moment, _to_schema
from app.modules.milan import prompts
from app.modules.milan.schemas import (
    MilanAnalysisRequest,
    MilanAnalysisResponse,
    MilanRequest,
    MilanResponse,
)

logger = logging.getLogger(__name__)

MAX_TOKENS = 8000


def compute_match(body: MilanRequest) -> MilanResponse:
    g_moment = _birth_moment(body.groom)
    b_moment = _birth_moment(body.bride)

    g_chart_raw = build_chart(g_moment)
    b_chart_raw = build_chart(b_moment)

    g_moon = next(p for p in g_chart_raw.planets if p.name == "Moon")
    b_moon = next(p for p in b_chart_raw.planets if p.name == "Moon")

    g_mars = next(p for p in g_chart_raw.planets if p.name == "Mars")
    b_mars = next(p for p in b_chart_raw.planets if p.name == "Mars")

    result = match_kundalis(
        # 0-indexed rashi and nakshatra become 1-indexed (1=Aries, 1=Ashwini).
        groom_rashi=g_moon.sign_index + 1,
        groom_nak_idx=g_moon.nakshatra.index + 1,
        groom_mars_house=g_mars.house,
        bride_rashi=b_moon.sign_index + 1,
        bride_nak_idx=b_moon.nakshatra.index + 1,
        bride_mars_house=b_mars.house,
    )

    return MilanResponse(
        groom_name=body.groom_name,
        bride_name=body.bride_name,
        total_guna=result["total_guna"],
        max_guna=result["max_guna"],
        percentage=result["percentage"],
        recommendation=result["recommendation"],
        verdict=result.get("verdict", ""),
        kutas=result["kutas"],
        groom_manglik=result["groom_manglik"],
        bride_manglik=result["bride_manglik"],
        manglik_compatibility=result["manglik_compatibility"],
        groom_chart=_to_schema(g_chart_raw, dasha_depth=2),
        bride_chart=_to_schema(b_chart_raw, dasha_depth=2),
    )


async def analyse(body: MilanAnalysisRequest) -> MilanAnalysisResponse | None:
    """The model's reading of the match, or None if it could not produce one.

    None rather than a fallback: unlike a report, this sits underneath a match
    that has already rendered its score and its eight kootas. A missing analysis
    leaves a useful page; an invented one does not.
    """
    match = compute_match(
        MilanRequest(
            groom=body.groom,
            bride=body.bride,
            groom_name=body.groom_name,
            bride_name=body.bride_name,
        )
    )

    try:
        response = await get_client().messages.create(
            model=model_name(),
            max_tokens=MAX_TOKENS,
            system=prompts.system_blocks(match, body.groom, body.bride, body.language),
            messages=[{"role": "user", "content": prompts.USER_PROMPT}],
            **tuning(),
        )
    except APIError as exc:
        logger.warning("milan analysis failed: %s", exc)
        return None

    if response.stop_reason == "refusal":
        logger.warning("milan analysis refused by the model")
        return None

    raw = "".join(b.text for b in response.content if getattr(b, "type", None) == "text").strip()
    return _parse(raw)


def _parse(raw: str) -> MilanAnalysisResponse | None:
    start, end = raw.find("{"), raw.rfind("}")
    if start == -1 or end <= start:
        return None
    try:
        parsed = json.loads(raw[start : end + 1])
    except json.JSONDecodeError:
        return None
    if not isinstance(parsed, dict):
        return None
    try:
        analysis = MilanAnalysisResponse(**parsed)
    except (ValueError, TypeError):
        logger.warning("model returned a malformed milan analysis")
        return None
    # A verdict with nothing behind it renders as a headline over empty space.
    if not (analysis.strengths or analysis.concerns):
        return None
    return analysis
