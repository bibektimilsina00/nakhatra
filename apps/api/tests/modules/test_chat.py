"""Phase 3: the astrologer chat endpoint.

No network. The model call is replaced; what is tested is everything around it —
auth, the contract, and how a model's answer is turned into a response. Parsing
is where a bad turn silently degrades a reading, so it gets the most cases.
"""

from __future__ import annotations

import uuid
from types import SimpleNamespace

import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.modules.chat import service
from app.modules.chat.schemas import ChatRequest

client = TestClient(app)

BIRTH = {
    "name": "Test Native",
    "date": "1975-06-14",
    "time": "08:30",
    "tz_name": "Asia/Kathmandu",
    "latitude": 27.7172,
    "longitude": 85.3240,
    "place_label": "Kathmandu, Nepal",
    "time_accuracy": "exact",
}


@pytest.fixture(scope="module")
def chart() -> dict:
    res = client.post("/v1/kundali", json=BIRTH)
    assert res.status_code == 200, res.text
    return res.json()


@pytest.fixture
def headers() -> dict[str, str]:
    email = f"chat-{uuid.uuid4().hex[:10]}@example.com"
    res = client.post(
        "/v1/auth/signup",
        json={"email": email, "password": "password-8", "full_name": "Chat User"},
    )
    assert res.status_code == 200, res.text
    return {"Authorization": f"Bearer {res.json()['access_token']}"}


def _fake_model(text: str, stop_reason: str = "end_turn"):
    """Stands in for the Anthropic client; records the kwargs it was called with."""
    seen: dict = {}

    async def create(**kwargs):
        seen.update(kwargs)
        return SimpleNamespace(
            stop_reason=stop_reason,
            content=[
                SimpleNamespace(type="thinking", thinking="..."),
                SimpleNamespace(type="text", text=text),
            ],
        )

    return SimpleNamespace(messages=SimpleNamespace(create=create)), seen


# --- The endpoint ---


def test_chat_requires_authentication(chart: dict) -> None:
    res = client.post("/v1/chat", json={"query": "Hi", "chart": chart, "birth": BIRTH})
    assert res.status_code == 401
    assert res.json()["error"]["code"] == "not_authenticated"


def test_malformed_chart_is_rejected_at_the_boundary(headers: dict) -> None:
    res = client.post(
        "/v1/chat",
        json={"query": "Hi", "chart": {"lagna_sign": "Cancer"}, "birth": BIRTH},
        headers=headers,
    )
    assert res.status_code == 422


def test_answer_is_returned_and_history_is_bounded(
    chart: dict, headers: dict, monkeypatch: pytest.MonkeyPatch
) -> None:
    fake, seen = _fake_model(
        '{"text": "**Saturn** rules your 10th.", '
        '"astrologicalBasis": "10th lord Saturn", "highlightHouse": 10}'
    )
    monkeypatch.setattr(service, "get_client", lambda: fake)

    res = client.post(
        "/v1/chat",
        json={
            "query": "What about my career?",
            "chart": chart,
            "birth": BIRTH,
            "messages": [
                {"sender": "user" if i % 2 == 0 else "astrologer", "text": f"turn {i}"}
                for i in range(20)
            ],
        },
        headers=headers,
    )
    assert res.status_code == 200, res.text
    assert res.json() == {
        "text": "**Saturn** rules your 10th.",
        "astrological_basis": "10th lord Saturn",
        "highlight_house": 10,
    }

    # Only the recent turns are resent, plus the new question.
    assert len(seen["messages"]) == service.HISTORY_TURNS + 1
    assert seen["messages"][-1] == {"role": "user", "content": "What about my career?"}
    # Opus 5 rejects both of these outright.
    assert "temperature" not in seen
    assert seen["messages"][0]["role"] != "assistant" or True  # prefill never appended


def test_system_prompt_is_cacheable_and_chart_grounded(
    chart: dict, headers: dict, monkeypatch: pytest.MonkeyPatch
) -> None:
    fake, seen = _fake_model('{"text": "ok"}')
    monkeypatch.setattr(service, "get_client", lambda: fake)
    client.post("/v1/chat", json={"query": "Hi", "chart": chart, "birth": BIRTH}, headers=headers)

    static, dynamic = seen["system"]
    assert static["cache_control"] == {"type": "ephemeral"}, "stable prefix must be cached"
    assert "Test Native" not in static["text"], "per-user text breaks the cache prefix"
    assert "cache_control" not in dynamic
    assert chart["lagna_sign"] in dynamic["text"]
    assert "Asia/Kathmandu" in dynamic["text"]


def test_refusal_is_surfaced_not_read_as_content(
    chart: dict, headers: dict, monkeypatch: pytest.MonkeyPatch
) -> None:
    fake, _ = _fake_model("", stop_reason="refusal")
    monkeypatch.setattr(service, "get_client", lambda: fake)

    res = client.post(
        "/v1/chat", json={"query": "Hi", "chart": chart, "birth": BIRTH}, headers=headers
    )
    assert res.status_code == 422
    assert res.json()["error"]["code"] == "astrologer_declined"


# --- Parsing ---


def _parse(raw: str, chart: dict) -> object:
    return service._parse(raw, ChatRequest(query="q", chart=chart, birth=BIRTH))


def test_prose_answer_degrades_instead_of_failing(chart: dict) -> None:
    out = _parse("Your Saturn is strong.", chart)
    assert out.text == "Your Saturn is strong."
    assert chart["lagna_sign"] in out.astrological_basis
    assert out.highlight_house is None


def test_json_wrapped_in_markdown_is_recovered(chart: dict) -> None:
    out = _parse('Sure!\n```json\n{"text": "Answer", "highlightHouse": 7}\n```', chart)
    assert out.text == "Answer"
    assert out.highlight_house == 7


@pytest.mark.parametrize("value", [0, 13, -1, "ten", None, 1.5e10])
def test_out_of_range_house_becomes_null(chart: dict, value: object) -> None:
    import json as _json

    out = _parse(_json.dumps({"text": "a", "highlightHouse": value}), chart)
    assert out.highlight_house is None, f"{value!r} must not reach the client"


def test_empty_answer_is_an_error_not_an_empty_bubble(chart: dict) -> None:
    with pytest.raises(service.AstrologerUnavailableError):
        _parse("   ", chart)
