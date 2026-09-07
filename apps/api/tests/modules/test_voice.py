"""Phase 5: the voice endpoints.

No network. What is tested is the parts that are ours: what gets read aloud,
which filenames the cache will accept, and that nothing here is reachable
without a token — these endpoints cost money per call.
"""

from __future__ import annotations

import uuid

import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.modules.voice import cache, service
from app.modules.voice.text_processor import split_into_chunks, to_spoken

client = TestClient(app)


@pytest.fixture
def headers() -> dict[str, str]:
    email = f"voice-{uuid.uuid4().hex[:10]}@example.com"
    res = client.post(
        "/v1/auth/signup",
        json={"email": email, "password": "password-8", "full_name": "Voice User"},
    )
    assert res.status_code == 200, res.text
    return {"Authorization": f"Bearer {res.json()['access_token']}"}


# --- What gets read aloud ---


@pytest.mark.parametrize(
    "raw,expected",
    [
        ("**Saturn** rules", "Saturn rules"),
        ("### Heading", "Heading"),
        ("Lagna at 27°30 exactly", "Lagna at 27 degrees 30 minutes exactly"),
        ("Lagna at 27° exactly", "Lagna at 27 degrees exactly"),
        ("A 75% match", "A 75 percent match"),
        ("line one\nline two", "line one line two"),
        ("before ```code here``` after", "before after"),
    ],
)
def test_markdown_and_symbols_become_words(raw: str, expected: str) -> None:
    # Read aloud, "**" is spoken and "°" is dropped — losing the unit from a
    # degree is losing the astrology.
    assert to_spoken(raw) == expected


def test_chunks_split_on_sentences_never_mid_word() -> None:
    text = " ".join(f"Sentence number {i} about your chart." for i in range(40))
    chunks = split_into_chunks(text, max_len=100)

    assert len(chunks) > 1
    for chunk in chunks:
        assert len(chunk) <= 100 or chunk.count(" ") == 0
    # Nothing may be silently dropped.
    assert "".join(chunks).replace(" ", "") == to_spoken(text).replace(" ", "")


def test_a_single_oversized_sentence_still_produces_audio() -> None:
    assert split_into_chunks("word " * 200, max_len=50) != []


def test_empty_text_produces_no_chunks() -> None:
    assert split_into_chunks("   ") == []


# --- Cache naming and path safety ---


def test_cache_name_is_stable_and_voice_specific() -> None:
    a = cache.name_for("onyx", "en-US", "Your Saturn is strong.")
    assert a == cache.name_for("onyx", "en-US", "  Your Saturn is strong.  ")
    assert a != cache.name_for("ash", "en-US", "Your Saturn is strong.")
    assert a != cache.name_for("onyx", "ne-NP", "Your Saturn is strong.")


@pytest.mark.parametrize(
    "name",
    [
        "../../../../etc/passwd",
        "..%2Fsecret.mp3",
        "onyx_enUS_/etc/passwd.mp3",
        "arbitrary.mp3",
        "onyx_enUS_short.mp3",
        "",
    ],
)
def test_cache_rejects_anything_it_did_not_write(name: str) -> None:
    # This path is exposed unauthenticated so an <audio> tag can reach it, which
    # makes it the one place a traversal would actually be reachable.
    assert cache.path_for(name) is None


def test_cache_accepts_a_name_it_generated() -> None:
    name = cache.name_for("onyx", "en-US", "hello")
    assert cache.path_for(name) is not None


def test_unknown_audio_is_a_404_not_a_500() -> None:
    res = client.get("/v1/tts/audio/onyx_enUS_" + "a" * 20 + ".mp3")
    assert res.status_code == 404
    assert res.json()["error"]["code"] == "not_found"


def test_traversal_attempt_is_refused() -> None:
    res = client.get("/v1/tts/audio/..%2F..%2Fpyproject.toml")
    assert res.status_code in (400, 404), res.text


# --- Authentication ---


@pytest.mark.parametrize(
    "method,path,kwargs",
    [
        ("post", "/v1/tts", {"json": {"text": "hello"}}),
        ("post", "/v1/transcribe", {"files": {"file": ("a.webm", b"x", "audio/webm")}}),
        ("post", "/v1/realtime-session", {"json": {}}),
    ],
)
def test_every_paid_endpoint_requires_a_token(method: str, path: str, kwargs: dict) -> None:
    res = getattr(client, method)(path, **kwargs)
    assert res.status_code == 401, f"{path} is an open endpoint that spends money"
    assert res.json()["error"]["code"] == "not_authenticated"


def test_unknown_voice_is_rejected_rather_than_substituted(headers: dict) -> None:
    res = client.post("/v1/tts", json={"text": "hi", "voice": "morgan"}, headers=headers)
    assert res.status_code == 422


def test_transcription_without_a_key_says_so(
    headers: dict, monkeypatch: pytest.MonkeyPatch
) -> None:
    monkeypatch.setattr(service, "_api_key", lambda: None)
    res = client.post(
        "/v1/transcribe",
        files={"file": ("a.webm", b"audio", "audio/webm")},
        headers=headers,
    )
    assert res.status_code == 503
    assert res.json()["error"]["code"] == "voice_unavailable"


def test_realtime_falls_back_when_no_key_is_configured(
    headers: dict, monkeypatch: pytest.MonkeyPatch
) -> None:
    monkeypatch.setattr(service, "_api_key", lambda: None)
    chart = client.post(
        "/v1/kundali",
        json={
            "name": "N",
            "date": "1975-06-14",
            "time": "08:30",
            "tz_name": "Asia/Kathmandu",
            "latitude": 27.7,
            "longitude": 85.3,
            "place_label": "KTM",
            "time_accuracy": "exact",
        },
    ).json()
    res = client.post(
        "/v1/realtime-session",
        json={
            "chart": chart,
            "birth": {
                "name": "N",
                "date": "1975-06-14",
                "time": "08:30",
                "tz_name": "Asia/Kathmandu",
                "latitude": 27.7,
                "longitude": 85.3,
                "place_label": "KTM",
                "time_accuracy": "exact",
            },
        },
        headers=headers,
    )
    # A missing key must not deny the feature — the client records and
    # transcribes instead of holding a live session.
    assert res.status_code == 200, res.text
    body = res.json()
    assert body["client_secret"] is None
    assert body["fallback"] == "media_recorder_whisper"
    assert "Lagna (Ascendant)" in body["instructions"]


@pytest.mark.anyio
async def test_a_throttled_fallback_returns_nothing_rather_than_half_a_reading(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """The bug this guards: a reading that stopped after the first heading.

    The free engine throttles a few sentences in. The old loop `break`ed on the
    first non-200 and returned the bytes it already had, so the listener got the
    opening line played as though it were the whole answer — with nothing, in
    the audio or the UI, to say otherwise.
    """
    calls = {"n": 0}

    class Res:
        def __init__(self, status: int, content: bytes) -> None:
            self.status_code = status
            self.content = content

    class Client:
        async def __aenter__(self):
            return self

        async def __aexit__(self, *_):
            return False

        async def get(self, *_args, **_kwargs):
            calls["n"] += 1
            # The first sentence succeeds, everything after is throttled.
            return Res(200, b"AUDIO") if calls["n"] == 1 else Res(429, b"")

    monkeypatch.setattr(service.httpx, "AsyncClient", lambda **_: Client())
    monkeypatch.setattr(service, "_CHUNK_GAP_SECONDS", 0)

    long_text = " ".join(f"Sentence number {i} about the chart." for i in range(6))
    audio = await service._fallback_speech(long_text, "en-US")

    assert audio == b"", "a partial reading must not be returned as a whole one"
    assert calls["n"] > 2, "the failing chunk should have been retried before giving up"


@pytest.mark.anyio
async def test_every_chunk_arriving_is_concatenated_in_order(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    seen: list[str] = []

    class Res:
        status_code = 200

        def __init__(self, content: bytes) -> None:
            self.content = content

    class Client:
        async def __aenter__(self):
            return self

        async def __aexit__(self, *_):
            return False

        async def get(self, _url, params=None, headers=None):
            seen.append(params["q"])
            return Res(params["q"].encode()[:4])

    monkeypatch.setattr(service.httpx, "AsyncClient", lambda **_: Client())
    monkeypatch.setattr(service, "_CHUNK_GAP_SECONDS", 0)

    audio = await service._fallback_speech("One. Two. Three.", "en-US")
    assert len(seen) >= 1
    assert audio == b"".join(q.encode()[:4] for q in seen)
