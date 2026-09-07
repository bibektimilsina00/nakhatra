"""Boot-time and liveness guarantees.

Both of these fail in ways that look like something else: a missing
`CORS_ORIGINS` presents as "the website is broken but the mobile app works", and
a health check that never touches the database keeps an instance in the load
balancer after its connection dies.
"""

from __future__ import annotations

import pytest
from fastapi.testclient import TestClient

from app.core.config import Settings, get_settings
from app.main import app, create_app


def test_jwt_secret_must_be_present_and_long_enough() -> None:
    for secret in ("", "short", "x" * 31):
        with pytest.raises(ValueError, match="JWT_SECRET"):
            Settings(JWT_SECRET=secret, _env_file=None)  # type: ignore[call-arg]

    assert Settings(JWT_SECRET="y" * 32, _env_file=None).JWT_SECRET  # type: ignore[call-arg]


@pytest.mark.parametrize("env", ["staging", "production"])
def test_refuses_to_boot_without_cors_origins_outside_local(
    env: str, monkeypatch: pytest.MonkeyPatch
) -> None:
    settings = get_settings().model_copy(update={"ENV": env, "CORS_ORIGINS": []})
    monkeypatch.setattr("app.main.get_settings", lambda: settings)

    with pytest.raises(RuntimeError, match="CORS_ORIGINS"):
        create_app()


def test_boots_outside_local_once_origins_are_configured(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    settings = get_settings().model_copy(
        update={"ENV": "production", "CORS_ORIGINS": ["https://nakhatra.com"]}
    )
    monkeypatch.setattr("app.main.get_settings", lambda: settings)
    assert create_app() is not None


def test_health_reports_ok_when_the_database_answers() -> None:
    res = TestClient(app).get("/health")
    assert res.status_code == 200
    assert res.json()["status"] == "ok"


def test_health_reports_degraded_when_the_database_is_gone(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    def broken():
        raise RuntimeError("connection closed")

    monkeypatch.setattr("app.main.get_engine", broken)
    res = TestClient(app).get("/health")
    assert res.status_code == 503, "a dead database must take the instance out of rotation"
    assert res.json()["database"] == "unreachable"


@pytest.mark.parametrize(
    "configured,expected",
    [
        # Routers document their endpoint with the /v1, so that is what gets
        # pasted in. The SDK appends its own, and /v1/v1/messages 404s with a
        # message that reads like a bad model id.
        ("https://openrouter.ai/api/v1", "https://openrouter.ai/api"),
        ("https://openrouter.ai/api/v1/", "https://openrouter.ai/api"),
        ("https://openrouter.ai/api", "https://openrouter.ai/api"),
        # Only an exact trailing /v1 segment goes.
        ("https://example.com/v1beta", "https://example.com/v1beta"),
        (None, None),
    ],
)
def test_llm_base_url_accepts_both_forms(configured, expected) -> None:
    from app.integrations.llm import _origin

    assert _origin(configured) == expected


@pytest.mark.parametrize(
    "model,anthropic_only",
    [
        # Anthropic's own knobs. A router forwards them verbatim, so a Gemini
        # model behind the same endpoint 400s rather than ignoring them.
        ("anthropic/claude-opus-5", True),
        ("claude-opus-5", True),
        ("claude-haiku-4-5", True),
        ("google/gemini-3.6-flash", False),
        ("qwen/qwen3.6-35b-a3b", False),
    ],
)
def test_thinking_is_sent_only_to_models_that_accept_it(
    monkeypatch, model: str, anthropic_only: bool
) -> None:
    from app.integrations import llm

    monkeypatch.setattr(llm, "model_name", lambda: model)
    knobs = llm.tuning()
    assert ("thinking" in knobs) is anthropic_only
    assert ("output_config" in knobs) is anthropic_only
