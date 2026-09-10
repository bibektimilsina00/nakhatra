"""The daily publication.

Calculate once, generate once, save once, serve many times. What matters here
is that the user path never reaches the model, that a job run twice publishes
once, and that a bad reply is never stored as a day's publication.
"""

import json
from datetime import date

import pytest
from sqlmodel import Session, SQLModel, create_engine, select

from app.astrology_core import rasifal
from app.modules.rasifal import prompts, repository, writer
from app.modules.rasifal.models import DailyRashifal


@pytest.fixture
def session():
    engine = create_engine("sqlite://")
    SQLModel.metadata.create_all(engine)
    with Session(engine) as s:
        yield s


def _reply(signs: list[str]) -> str:
    return json.dumps(
        {
            "signs": [
                {
                    "sign": s, "summary": f"{s} summary", "career": "c", "love": "l",
                    "finance": "f", "health": "h", "remedy": "r",
                    "astrological_reason": "a",
                }
                for s in signs
            ]
        }
    )


class _Block:
    type = "text"

    def __init__(self, text: str) -> None:
        self.text = text


class _Response:
    stop_reason = "end_turn"

    def __init__(self, text: str) -> None:
        self.content = [_Block(text)]


def _client_returning(text: str, calls: list[int]):
    class _Messages:
        async def create(self, **_):
            calls.append(1)
            return _Response(text)

    class _Client:
        messages = _Messages()

    return lambda: _Client()


ALL_TWELVE = [
    "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo", "Libra",
    "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces",
]


# --- the prompt ------------------------------------------------------------


def test_the_prompt_carries_the_engines_verdict_as_fixed() -> None:
    day = rasifal.compute(date(2026, 9, 10))
    _, user = prompts.build_prompt(day, "ne")
    assert "THIS IS FIXED" in user
    for s in day.signs:
        assert s.sign in user


def test_the_prompt_forbids_the_technical_words_and_the_stock_opening() -> None:
    system, _ = prompts.build_prompt(rasifal.compute(date(2026, 9, 10)), "ne")
    for banned in ("मूर्ति", "वेध"):
        assert banned in system, "the prompt must name a term in order to forbid it"
    assert "BANNED" in system
    assert "आजको दिन" in system, "the stock opening must be named and refused"
    assert "NEVER name or predict a disease" in system


def test_the_prompt_is_versioned() -> None:
    """Stored beside every publication, so a bad day can be traced to the
    instructions that produced it."""
    assert prompts.PROMPT_VERSION


# --- generation ------------------------------------------------------------


@pytest.mark.anyio
async def test_generation_makes_one_call_and_publishes_twelve(session, monkeypatch) -> None:
    calls: list[int] = []
    monkeypatch.setattr(writer, "get_client", _client_returning(_reply(ALL_TWELVE), calls))
    day = rasifal.compute(date(2026, 9, 10))

    out = await writer.generate(session, day, "ne")
    assert len(calls) == 1
    assert len(out) == 12
    row = repository.get(session, "2026-09-10", "ne")
    assert row is not None
    assert row.prompt_version == prompts.PROMPT_VERSION
    # The findings are kept so a reading can be traced to what produced it.
    assert json.loads(row.astrology_data_json)["for_date"] == "2026-09-10"


@pytest.mark.anyio
async def test_running_the_job_twice_publishes_once(session, monkeypatch) -> None:
    calls: list[int] = []
    monkeypatch.setattr(writer, "get_client", _client_returning(_reply(ALL_TWELVE), calls))
    day = rasifal.compute(date(2026, 9, 10))

    await writer.generate(session, day, "ne")
    await writer.generate(session, day, "ne")

    assert len(calls) == 1, "the second run must not reach the model"
    rows = list(session.exec(select(DailyRashifal)).all())
    assert len(rows) == 1, "the date is unique; a re-run must not add a row"


@pytest.mark.anyio
async def test_a_partial_reply_is_never_published(session, monkeypatch) -> None:
    """Some signs written and others bare looks broken — and a half
    publication would satisfy tomorrow's "already done" check forever."""
    calls: list[int] = []
    monkeypatch.setattr(writer, "get_client", _client_returning(_reply(ALL_TWELVE[:5]), calls))
    day = rasifal.compute(date(2026, 9, 10))

    assert await writer.generate(session, day, "ne") == {}
    assert repository.get(session, "2026-09-10", "ne") is None


@pytest.mark.anyio
async def test_an_unreachable_model_publishes_nothing(session, monkeypatch) -> None:
    def explode():
        raise RuntimeError("no model today")

    monkeypatch.setattr(writer, "get_client", explode)
    day = rasifal.compute(date(2026, 9, 10))
    assert await writer.generate(session, day, "ne") == {}
    assert repository.get(session, "2026-09-10", "ne") is None


@pytest.mark.anyio
async def test_a_refusal_publishes_nothing(session, monkeypatch) -> None:
    class _Refused(_Response):
        stop_reason = "refusal"

    class _Messages:
        async def create(self, **_):
            return _Refused("")

    class _Client:
        messages = _Messages()

    monkeypatch.setattr(writer, "get_client", lambda: _Client())
    day = rasifal.compute(date(2026, 9, 10))
    assert await writer.generate(session, day, "ne") == {}


# --- serving ---------------------------------------------------------------


def test_reading_a_day_never_needs_the_model(session, monkeypatch) -> None:
    """The user path. If this ever reaches the client, the architecture is
    broken."""
    def explode():
        raise AssertionError("the read path called the model")

    monkeypatch.setattr(writer, "get_client", explode)
    assert writer.published(session, date(2026, 9, 10), "ne") == {}


def test_an_unreadable_row_reads_as_unpublished(session) -> None:
    """Corrupt content is a day to regenerate, not a 500."""
    repository.publish(
        session,
        DailyRashifal(
            id="x", on_date="2026-09-10", language="ne",
            content_json="{not json", astrology_data_json="{}",
        ),
    )
    assert writer.published(session, date(2026, 9, 10), "ne") == {}


def test_a_fenced_or_chatty_reply_is_still_parsed() -> None:
    """Models fence JSON however firmly they are asked not to."""
    parsed = writer.parse("Here you go:\n```json\n" + _reply(["Aries"]) + "\n```")
    assert parsed is not None
    assert parsed.signs[0].sign == "Aries"
