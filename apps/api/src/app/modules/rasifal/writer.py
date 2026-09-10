"""The writer: computed findings in, Nepali rashifal out.

One call per day per language, for all twelve signs at once — the model can
see what it has already said and vary the next, which is the only reliable way
to stop twelve cards reading as one template. The result is cached on disk,
because a day's sky does not change and re-paying for the same twelve
paragraphs on every page load would be absurd.

Nothing astrological is decided here. The rating, the lucky number and colour,
the syllables and the transits all come from `astrology_core` and pass through
untouched; this fills in prose and nothing else.
"""

from __future__ import annotations

import asyncio
import json
import logging
import re
from datetime import date
from pathlib import Path

from pydantic import BaseModel, ValidationError

from app.astrology_core.rasifal import Rasifal
from app.core.config import get_settings
from app.integrations.llm import get_client, model_name, tuning
from app.modules.rasifal import prompts

logger = logging.getLogger(__name__)

MAX_TOKENS = 8000


class _Reading(BaseModel):
    sign: str
    summary: str = ""
    career: str = ""
    love: str = ""
    finance: str = ""
    health: str = ""
    remedy: str = ""
    astrological_reason: str = ""


class _Readings(BaseModel):
    signs: list[_Reading]


def _cache_path(on: date, language: str) -> Path:
    settings = get_settings()
    root = Path(getattr(settings, "CACHE_DIR", "data/cache")) / "rasifal"
    root.mkdir(parents=True, exist_ok=True)
    return root / f"{on.isoformat()}_{language}.json"


def _load(on: date, language: str) -> dict[str, _Reading] | None:
    path = _cache_path(on, language)
    if not path.exists():
        return None
    try:
        raw = json.loads(path.read_text("utf-8"))
        return {k: _Reading(**v) for k, v in raw.items()}
    except (OSError, ValueError, ValidationError):
        # A half-written or stale-shaped cache is not worth a failed page.
        return None


def _store(on: date, language: str, readings: dict[str, _Reading]) -> None:
    try:
        _cache_path(on, language).write_text(
            json.dumps({k: v.model_dump() for k, v in readings.items()}, ensure_ascii=False),
            encoding="utf-8",
        )
    except OSError as exc:
        logger.warning("could not cache rasifal for %s/%s: %s", on, language, exc)


_FENCE = re.compile(r"^```(?:json)?\s*|\s*```$", re.MULTILINE)


def _parse(text: str) -> _Readings | None:
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


#: Days already being written, so twelve simultaneous visitors do not each
#: commission their own copy of the same twelve paragraphs.
_in_flight: set[tuple[date, str]] = set()


async def readings_for(day: Rasifal, language: str) -> dict[str, _Reading]:
    """The twelve written readings, if they are ready.

    Never waits for the model. Writing a day takes the better part of a
    minute, and nobody should hold a calendar page open that long — so a miss
    returns nothing, starts the work in the background, and the next visitor
    (or a reload a minute later) gets the prose. The cards render from their
    computed findings meanwhile, which is a far better failure than a blank
    screen or a spinner.
    """
    cached = _load(day.for_date, language)
    if cached is not None:
        return cached

    key = (day.for_date, language)
    if key not in _in_flight:
        _in_flight.add(key)
        task = asyncio.create_task(_write_and_cache(day, language))
        # Without a reference the loop may collect the task mid-flight.
        _pending.add(task)
        task.add_done_callback(_pending.discard)
    return {}


_pending: set[asyncio.Task] = set()


async def _write_and_cache(day: Rasifal, language: str) -> None:
    try:
        await _generate(day, language)
    finally:
        _in_flight.discard((day.for_date, language))


async def _generate(day: Rasifal, language: str) -> dict[str, _Reading]:
    system, user = prompts.build_prompt(day, language)
    try:
        response = await get_client().messages.create(
            model=model_name(),
            max_tokens=MAX_TOKENS,
            system=system,
            messages=[{"role": "user", "content": user}],
            **tuning(),
        )
    except Exception as exc:  # noqa: BLE001 — any failure means "no prose today"
        logger.warning("rasifal writer unavailable: %s", exc)
        return {}

    # A refusal has no content to read (CLAUDE.md: check stop_reason first).
    if getattr(response, "stop_reason", None) == "refusal":
        logger.warning("rasifal writer refused")
        return {}

    text = "".join(b.text for b in response.content if getattr(b, "type", "") == "text")
    parsed = _parse(text)
    if parsed is None:
        return {}

    by_sign = {r.sign: r for r in parsed.signs}
    # Only keep it if the writer covered the whole sky; a partial day would
    # show some signs written and others bare, which looks broken.
    if len(by_sign) < len(day.signs):
        logger.warning("rasifal writer covered %d of %d signs", len(by_sign), len(day.signs))
        return {}

    _store(day.for_date, language, by_sign)
    return by_sign
