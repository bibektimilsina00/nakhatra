"""Stored readings: when a reading is reused, and when it must not be.

A reading costs a minute of model time and real money, and for one chart in one
language it is the same reading every time — so a refresh should read it back,
not re-bill it. The risk runs the other way too: reuse it too eagerly and
somebody reads a stranger's chart, or last year's ephemeris.
"""

from __future__ import annotations

import json
import uuid
from pathlib import Path
from types import SimpleNamespace

import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.modules.report import service

client = TestClient(app)

FIXTURES = Path(__file__).parent / "report_fixtures"
CASE = json.loads((FIXTURES / "charts.json").read_text())[0]
GOOD = json.loads((FIXTURES / "expected_reports.json").read_text())["0-en"]


@pytest.fixture
def headers() -> dict[str, str]:
    email = f"cache-{uuid.uuid4().hex[:10]}@example.com"
    res = client.post(
        "/v1/auth/signup",
        json={"email": email, "password": "password-8", "full_name": "Cache User"},
    )
    assert res.status_code == 200, res.text
    return {"Authorization": f"Bearer {res.json()['access_token']}"}


class CountingModel:
    """A stand-in that records how many times the model was actually called."""

    def __init__(self) -> None:
        self.calls = 0

    def __call__(self):
        async def create(**_kwargs):
            self.calls += 1
            return SimpleNamespace(
                stop_reason="end_turn",
                content=[SimpleNamespace(type="text", text=json.dumps(GOOD))],
            )

        return SimpleNamespace(messages=SimpleNamespace(create=create))


def _post(
    headers: dict, *, language: str = "en", birth: dict | None = None, chart: dict | None = None
):
    return client.post(
        "/v1/report",
        json={
            "chart": chart or CASE["chart"],
            "birth": birth or CASE["birth"],
            "language": language,
        },
        headers=headers,
    )


def test_the_same_reading_is_not_generated_twice(
    headers: dict, monkeypatch: pytest.MonkeyPatch
) -> None:
    """The bug this table exists for: a refresh used to re-bill the model."""
    model = CountingModel()
    monkeypatch.setattr(service, "get_client", model)

    first = _post(headers)
    second = _post(headers)

    assert first.status_code == 200 and second.status_code == 200
    assert model.calls == 1, "the second request should have been served from storage"
    assert first.json()["report"] == second.json()["report"]
    assert second.json()["source"] == "llm"


@pytest.mark.parametrize("language", ["ne", "hi"])
def test_each_language_is_its_own_reading(
    headers: dict, monkeypatch: pytest.MonkeyPatch, language: str
) -> None:
    """Three languages are three readings, not one translated three ways."""
    model = CountingModel()
    monkeypatch.setattr(service, "get_client", model)

    _post(headers, language="en")
    _post(headers, language=language)
    assert model.calls == 2

    # ...and each is then cached in its own right.
    _post(headers, language="en")
    _post(headers, language=language)
    assert model.calls == 2


def test_the_same_instant_in_a_different_city_is_a_different_reading(
    headers: dict, monkeypatch: pytest.MonkeyPatch
) -> None:
    """The Julian-day trap: same moment, different ascendant.

    Keying on the birth instant alone would serve a Kathmandu chart's reading
    to someone born at the same second in London.
    """
    model = CountingModel()
    monkeypatch.setattr(service, "get_client", model)

    _post(headers)
    elsewhere = {
        **CASE["birth"],
        "latitude": 51.5072,
        "longitude": -0.1276,
        "tz_name": "Europe/London",
    }
    _post(headers, birth=elsewhere)

    assert model.calls == 2


def test_a_renamed_chart_is_a_different_reading(
    headers: dict, monkeypatch: pytest.MonkeyPatch
) -> None:
    """The model is given the name and writes with it."""
    model = CountingModel()
    monkeypatch.setattr(service, "get_client", model)

    _post(headers)
    _post(headers, birth={**CASE["birth"], "name": "Someone Else"})
    assert model.calls == 2


def test_a_new_engine_version_does_not_serve_the_old_reading(
    headers: dict, monkeypatch: pytest.MonkeyPatch
) -> None:
    """A bumped engine can move positions; the old reading describes the old
    ones, which makes it wrong rather than merely old (CLAUDE.md rule 4)."""
    model = CountingModel()
    monkeypatch.setattr(service, "get_client", model)

    _post(headers)
    bumped = {**CASE["chart"], "engine_version": CASE["chart"]["engine_version"] + "-next"}
    _post(headers, chart=bumped)
    assert model.calls == 2


def test_one_users_reading_is_never_served_to_another(
    headers: dict, monkeypatch: pytest.MonkeyPatch
) -> None:
    """Identical birth data, different account: still generated fresh."""
    model = CountingModel()
    monkeypatch.setattr(service, "get_client", model)

    _post(headers)

    other = client.post(
        "/v1/auth/signup",
        json={
            "email": f"other-{uuid.uuid4().hex[:8]}@example.com",
            "password": "password-8",
            "full_name": "Other",
        },
    ).json()["access_token"]
    _post({"Authorization": f"Bearer {other}"})

    assert model.calls == 2


def test_a_failed_reading_is_not_stored(headers: dict, monkeypatch: pytest.MonkeyPatch) -> None:
    """Caching the rule-engine stand-in would make one bad minute permanent."""
    calls = {"n": 0}

    def failing():
        async def create(**_kwargs):
            calls["n"] += 1
            return SimpleNamespace(
                stop_reason="end_turn", content=[SimpleNamespace(type="text", text="not json")]
            )

        return SimpleNamespace(messages=SimpleNamespace(create=create))

    monkeypatch.setattr(service, "get_client", failing)
    assert _post(headers).json()["source"] == "rule_engine"

    # The next request must try the model again rather than serve the stand-in.
    model = CountingModel()
    monkeypatch.setattr(service, "get_client", model)
    assert _post(headers).json()["source"] == "llm"
    assert model.calls == 1


def _stream(headers: dict, language: str = "en") -> list[dict]:
    with client.stream(
        "POST",
        "/v1/report/stream",
        json={"chart": CASE["chart"], "birth": CASE["birth"], "language": language},
        headers=headers,
    ) as res:
        assert res.status_code == 200, res.read()
        frames = []
        for line in res.iter_lines():
            if line.startswith("data:"):
                frames.append(json.loads(line[5:]))
        return frames


def test_a_stored_reading_replays_through_the_stream(
    headers: dict, monkeypatch: pytest.MonkeyPatch
) -> None:
    """Refreshing the reading page must not re-bill the model either.

    The replay sends the same frames in the same order, so the client cannot
    tell the two apart — only the `cached` flag on `done` says which happened.
    """
    model = CountingModel()
    monkeypatch.setattr(service, "get_client", model)
    _post(headers)  # generate and store once
    assert model.calls == 1

    frames = _stream(headers)
    sections = [f["section"] for f in frames if f["type"] == "section"]
    done = next(f for f in frames if f["type"] == "done")

    assert model.calls == 1, "the stream should have replayed, not regenerated"
    assert done["cached"] is True
    assert [s["id"] for s in sections] == [s["id"] for s in GOOD]


def test_a_stream_that_dies_partway_is_not_stored(
    headers: dict, monkeypatch: pytest.MonkeyPatch
) -> None:
    """Four sections cached as if they were seven would be permanent."""
    truncated = json.dumps(GOOD[:3])[:-1]  # three sections, array never closed

    class Stream:
        async def __aenter__(self):
            return self

        async def __aexit__(self, *_):
            return False

        @property
        def text_stream(self):
            async def gen():
                yield truncated

            return gen()

        async def get_final_message(self):
            return SimpleNamespace(stop_reason="max_tokens")

    monkeypatch.setattr(
        service,
        "get_client",
        lambda: SimpleNamespace(messages=SimpleNamespace(stream=lambda **_: Stream())),
    )
    frames = _stream(headers)
    assert frames[-1]["type"] == "error"

    # Nothing was stored, so a later request generates properly.
    model = CountingModel()
    monkeypatch.setattr(service, "get_client", model)
    assert _post(headers).json()["source"] == "llm"
    assert model.calls == 1
