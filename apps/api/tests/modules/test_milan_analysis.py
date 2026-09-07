"""The Milan analysis endpoint, and specifically when it must NOT trust the model.

Unlike the report there is no deterministic fallback here — the match itself has
already rendered its score and its eight kootas, so a missing reading leaves a
useful page and an invented one does not. That makes "when do we refuse to show
the model's output" the whole of the logic worth testing.
"""

from __future__ import annotations

import json
import uuid
from types import SimpleNamespace

import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.modules.milan import service

client = TestClient(app)

GROOM = {
    "name": "Groom",
    "date": "1990-05-15",
    "time": "10:30",
    "place_label": "Kathmandu, Nepal",
    "latitude": 27.7172,
    "longitude": 85.324,
    "tz_name": "Asia/Kathmandu",
}
BRIDE = {**GROOM, "name": "Bride", "date": "1992-08-20", "time": "14:15"}

GOOD = {
    "verdict": "A workable match with one real friction point.",
    "outlook": "Twenty-four of thirty-six gunas is a solid base.",
    "strengths": [{"title": "Nadi", "detail": "Different nadis.", "basis": "Nadi 8/8"}],
    "concerns": [
        {"title": "Bhakoot", "detail": "Money will need talking about.", "basis": "Bhakoot 0/7"}
    ],
    "doshas": [
        {
            "name": "Mangal Dosha",
            "severity": "none",
            "affects": "Nothing here.",
            "detail": "Neither chart carries it.",
        }
    ],
    "remedies": [
        {"title": "Counsel", "detail": "Sit with an elder.", "timing": "before the wedding"}
    ],
}


@pytest.fixture
def headers() -> dict[str, str]:
    email = f"milan-{uuid.uuid4().hex[:10]}@example.com"
    res = client.post(
        "/v1/auth/signup",
        json={"email": email, "password": "password-8", "full_name": "Milan User"},
    )
    assert res.status_code == 200, res.text
    return {"Authorization": f"Bearer {res.json()['access_token']}"}


def _model_returning(text: str, stop_reason: str = "end_turn"):
    async def create(**_kwargs):
        return SimpleNamespace(
            stop_reason=stop_reason, content=[SimpleNamespace(type="text", text=text)]
        )

    return SimpleNamespace(messages=SimpleNamespace(create=create))


def _post(headers: dict, language: str = "en"):
    return client.post(
        "/v1/milan/analysis",
        json={
            "groom": GROOM,
            "bride": BRIDE,
            "groom_name": "Ram",
            "bride_name": "Sita",
            "language": language,
        },
        headers=headers,
    )


def test_analysis_requires_authentication() -> None:
    res = client.post("/v1/milan/analysis", json={"groom": GROOM, "bride": BRIDE})
    assert res.status_code == 401


def test_well_formed_analysis_is_returned(headers: dict, monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(service, "get_client", lambda: _model_returning(json.dumps(GOOD)))
    res = _post(headers)
    assert res.status_code == 200, res.text
    body = res.json()
    assert body["verdict"] == GOOD["verdict"]
    assert body["concerns"][0]["basis"] == "Bhakoot 0/7"


def test_prose_around_the_json_is_tolerated(headers: dict, monkeypatch: pytest.MonkeyPatch) -> None:
    wrapped = f"Here is the reading:\n```json\n{json.dumps(GOOD)}\n```"
    monkeypatch.setattr(service, "get_client", lambda: _model_returning(wrapped))
    assert _post(headers).status_code == 200


@pytest.mark.parametrize(
    "bad,why",
    [
        ("no json at all", "no object"),
        ("{}", "missing every field"),
        ('{"verdict": "ok"}', "missing the rest"),
        ("[1, 2, 3]", "an array, not an object"),
    ],
)
def test_unusable_model_output_is_refused(
    headers: dict, monkeypatch: pytest.MonkeyPatch, bad: str, why: str
) -> None:
    monkeypatch.setattr(service, "get_client", lambda: _model_returning(bad))
    assert _post(headers).status_code == 503, why


def test_a_verdict_with_nothing_behind_it_is_refused(
    headers: dict, monkeypatch: pytest.MonkeyPatch
) -> None:
    """Schema-valid but empty: a headline over blank space is worse than none."""
    hollow = {**GOOD, "strengths": [], "concerns": []}
    monkeypatch.setattr(service, "get_client", lambda: _model_returning(json.dumps(hollow)))
    assert _post(headers).status_code == 503


def test_refusal_does_not_500(headers: dict, monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(service, "get_client", lambda: _model_returning("", stop_reason="refusal"))
    assert _post(headers).status_code == 503


def test_the_model_reads_a_match_it_did_not_compute(
    headers: dict, monkeypatch: pytest.MonkeyPatch
) -> None:
    """The koota scores in the prompt come from the engine (CLAUDE.md rule 1)."""
    seen: dict = {}

    async def create(**kwargs):
        seen.update(kwargs)
        return SimpleNamespace(
            stop_reason="end_turn", content=[SimpleNamespace(type="text", text=json.dumps(GOOD))]
        )

    monkeypatch.setattr(
        service, "get_client", lambda: SimpleNamespace(messages=SimpleNamespace(create=create))
    )
    assert _post(headers).status_code == 200

    data_block = seen["system"][1]["text"]
    assert "=== KOOTA BY KOOTA ===" in data_block
    assert "DO NOT RECALCULATE" in data_block
    # Both charts go in, so the reading can reach past the eight kootas.
    assert "GROOM'S COMPLETE VERIFIED SIDEREAL BIRTH CHART" in data_block
    assert "BRIDE'S COMPLETE VERIFIED SIDEREAL BIRTH CHART" in data_block
    # The instruction block is the cached prefix and carries no couple data.
    assert seen["system"][0]["cache_control"] == {"type": "ephemeral"}
    assert "Ram" not in seen["system"][0]["text"]
