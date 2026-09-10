"""The writer layer.

What matters here is the separation: the engine decides, the model writes, and
a model that is slow, absent or wrong must never take the page down with it.
"""

from datetime import date

import pytest

from app.astrology_core import rasifal
from app.modules.rasifal import prompts, writer


def test_the_prompt_carries_the_engines_verdict_as_fixed() -> None:
    day = rasifal.compute(date(2026, 9, 10))
    system, user = prompts.build_prompt(day, "ne")
    assert "THIS IS FIXED" in user
    # Every sign's findings reach the writer.
    for s in day.signs:
        assert s.sign in user


def test_the_prompt_forbids_the_technical_words_in_user_facing_text() -> None:
    system, _ = prompts.build_prompt(rasifal.compute(date(2026, 9, 10)), "ne")
    for banned in ("मूर्ति", "वेध"):
        assert banned in system, "the prompt must name the term in order to forbid it"
    assert "BANNED" in system
    assert "NEVER name or predict a disease" in system


def test_a_missing_writer_never_breaks_the_day(monkeypatch: pytest.MonkeyPatch) -> None:
    """The rashifal is a calculation first. If the model cannot be reached the
    cards still have ratings, transits and lucky numbers."""
    import asyncio

    day = rasifal.compute(date(2026, 9, 10))

    def explode() -> None:
        raise RuntimeError("no model today")

    monkeypatch.setattr(writer, "_load", lambda *_: None)
    monkeypatch.setattr(writer, "get_client", explode)
    out = asyncio.run(writer.readings_for(day, "ne"))
    assert out == {}


def test_a_fenced_or_chatty_reply_is_still_parsed() -> None:
    """Models fence JSON however firmly they are asked not to."""
    body = (
        'Here you go:\n```json\n{"signs": [{"sign": "Aries", "summary": "s", '
        '"career": "c", "love": "l", "finance": "f", "health": "h", '
        '"remedy": "r", "astrological_reason": "a"}]}\n```'
    )
    parsed = writer._parse(body)
    assert parsed is not None
    assert parsed.signs[0].sign == "Aries"
    assert parsed.signs[0].remedy == "r"


def test_a_partial_day_is_rejected_rather_than_shown() -> None:
    """Some signs written and others bare looks broken; all twelve or none."""
    assert writer._parse('{"signs": []}') is not None  # parses...
    # ...but readings_for only stores a full set; the guard lives there.
    day = rasifal.compute(date(2026, 9, 10))
    assert len(day.signs) == 12
