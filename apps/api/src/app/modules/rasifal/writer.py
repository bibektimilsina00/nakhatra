"""The daily publication: written once, read by everyone.

Calculate once, generate once, save once, serve many times. The engine decides
the astrology; this asks the model to say what it means, validates what comes
back, and publishes it to the database. A user request never reaches the model
— it reads the row.

Nothing astrological is decided here. The rating, the lucky number and colour,
the syllables and the transits all come from `astrology_core` and pass through
untouched; this fills in prose and nothing else.
"""

from __future__ import annotations

import json
import logging
import re
import uuid
from dataclasses import asdict
from datetime import date

from pydantic import BaseModel, ValidationError
from sqlmodel import Session

from app.astrology_core.rasifal import Rasifal
from app.integrations.llm import get_client, model_name, tuning
from app.modules.rasifal import prompts, repository
from app.modules.rasifal.models import DailyRashifal

logger = logging.getLogger(__name__)

MAX_TOKENS = 8000
SIGNS_EXPECTED = 12


class Reading(BaseModel):
    sign: str
    summary: str = ""
    career: str = ""
    love: str = ""
    finance: str = ""
    health: str = ""
    remedy: str = ""
    astrological_reason: str = ""


class _Readings(BaseModel):
    signs: list[Reading]


_FENCE = re.compile(r"^```(?:json)?\s*|\s*```$", re.MULTILINE)


def parse(text: str) -> _Readings | None:
    """The model was told to return bare JSON; models fence it anyway."""
    cleaned = _FENCE.sub("", text).strip()
    start, end = cleaned.find("{"), cleaned.rfind("}")
    if start < 0 or end <= start:
        return None
    try:
        return _Readings(**json.loads(cleaned[start : end + 1]))
    except (ValueError, ValidationError) as exc:
        logger.warning("rasifal writer returned unusable JSON: %s", exc)
        return None


def published(session: Session, on: date, language: str) -> dict[str, Reading]:
    """The day's readings if it has been published, else nothing.

    This is the whole of the user request path. It never calls the model.
    """
    row = repository.get(session, on.isoformat(), language)
    if row is None:
        return {}
    try:
        raw = json.loads(row.content_json)
        return {k: Reading(**v) for k, v in raw.items()}
    except (ValueError, ValidationError) as exc:
        # A row that cannot be read is a row worth regenerating, not a 500.
        logger.warning("daily_rashifal %s/%s is unreadable: %s", on, language, exc)
        return {}


def _findings(day: Rasifal) -> dict:
    """Exactly what the writer was told, kept beside what it wrote."""
    return {
        "for_date": day.for_date.isoformat(),
        "weekday_lord": day.weekday_lord,
        "signs": [asdict(s) for s in day.signs],
    }


async def generate(
    session: Session,
    day: Rasifal,
    language: str,
    *,
    overwrite: bool = False,
) -> dict[str, Reading]:
    """Write the day and publish it. Idempotent.

    Returns the published readings — the ones already in the table if this
    date was written before and `overwrite` is not set, so a job run twice
    costs one generation, not two.
    """
    on = day.for_date.isoformat()
    if not overwrite:
        existing = published(session, day.for_date, language)
        if existing:
            logger.info("rasifal %s/%s already published; nothing to do", on, language)
            return existing

    system, user = prompts.build_prompt(day, language)
    try:
        response = await get_client().messages.create(
            model=model_name(),
            max_tokens=MAX_TOKENS,
            system=system,
            messages=[{"role": "user", "content": user}],
            **tuning(),
        )
    except Exception as exc:  # noqa: BLE001 — any failure means "not today"
        logger.error("rasifal writer unavailable for %s/%s: %s", on, language, exc)
        return {}

    # A refusal has no content to read (CLAUDE.md: check stop_reason first).
    if getattr(response, "stop_reason", None) == "refusal":
        logger.error("rasifal writer refused for %s/%s", on, language)
        return {}

    text = "".join(b.text for b in response.content if getattr(b, "type", "") == "text")
    parsed = parse(text)
    if parsed is None:
        return {}

    by_sign = {r.sign: r for r in parsed.signs}
    # Partial days are not published. Some signs written and others bare looks
    # broken, and a half publication would satisfy the "already done" check
    # tomorrow and never be repaired.
    if len(by_sign) < SIGNS_EXPECTED:
        logger.error(
            "rasifal writer covered %d of %d signs for %s/%s; not publishing",
            len(by_sign), SIGNS_EXPECTED, on, language,
        )
        return {}

    row = DailyRashifal(
        id=uuid.uuid4().hex,
        on_date=on,
        language=language,
        content_json=json.dumps(
            {k: v.model_dump() for k, v in by_sign.items()}, ensure_ascii=False
        ),
        astrology_data_json=json.dumps(_findings(day), ensure_ascii=False, default=str),
        model=model_name(),
        prompt_version=prompts.PROMPT_VERSION,
    )
    saved = repository.replace(session, row) if overwrite else repository.publish(session, row)
    logger.info("published rasifal %s/%s (%s)", on, language, saved.id)
    return published(session, day.for_date, language)
