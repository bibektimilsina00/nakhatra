"""Voice business logic: synthesis, transcription, realtime session minting.

OpenAI-specific. TTS, Whisper and the Realtime API have no OpenRouter
equivalent, so this module talks to OpenAI directly rather than through
`integrations/llm.py`, which is the Anthropic-wire client.
"""

from __future__ import annotations

import asyncio
import logging

import httpx

from app.core.config import get_settings
from app.core.errors import AppError
from app.modules.voice import cache, prompts
from app.modules.voice.schemas import (
    RealtimeSessionRequest,
    RealtimeSessionResponse,
    SpeakRequest,
    SpeakResponse,
    TranscriptResponse,
)
from app.modules.voice.text_processor import split_into_chunks, to_spoken

logger = logging.getLogger(__name__)

OPENAI_BASE = "https://api.openai.com/v1"
TTS_MODEL = "tts-1"
#: Spacing and retries for the free fallback engine, which throttles on bursts.
_CHUNK_GAP_SECONDS = 0.12
_CHUNK_ATTEMPTS = 3
TRANSCRIBE_MODEL = "whisper-1"
TIMEOUT = httpx.Timeout(30.0, connect=10.0)

# Tried in order; the first the account has access to wins.
REALTIME_MODELS = (
    "gpt-realtime",
    "gpt-4o-realtime-preview",
    "gpt-4o-mini-realtime-preview",
    "gpt-4o-realtime-preview-2024-12-17",
)

_TTS_LANGUAGE_CODES = {"ne": "ne-NP", "hi": "hi-IN", "en": "en-US"}


class VoiceUnavailableError(AppError):
    status_code = 503
    code = "voice_unavailable"


def _api_key() -> str | None:
    return get_settings().OPENAI_API_KEY or None


# --- Speech synthesis ---


async def speak(req: SpeakRequest) -> SpeakResponse:
    spoken = to_spoken(req.text)
    if not spoken:
        raise VoiceUnavailableError("There is nothing to read aloud.")

    language_code = _TTS_LANGUAGE_CODES.get(req.language, "en-US")
    name = cache.name_for(req.voice, language_code, spoken)

    if cache.read(name) is not None:
        return SpeakResponse(
            audio_url=audio_url(name),
            spoken_text=spoken,
            cached=True,
            source=f"disk_cache_{req.voice}",
        )

    audio = await _openai_speech(spoken, req.voice)
    source = f"openai_tts_{req.voice}"
    if audio is None:
        audio = await _fallback_speech(spoken, language_code)
        source = "google_tts_fallback"

    if not audio:
        raise VoiceUnavailableError("Could not synthesise audio right now.")

    cache.write(name, audio)
    return SpeakResponse(audio_url=audio_url(name), spoken_text=spoken, cached=False, source=source)


def audio_url(name: str) -> str:
    return f"/v1/tts/audio/{name}"


async def _openai_speech(text: str, voice: str) -> bytes | None:
    key = _api_key()
    if not key:
        return None
    try:
        async with httpx.AsyncClient(timeout=TIMEOUT) as client:
            res = await client.post(
                f"{OPENAI_BASE}/audio/speech",
                headers={"Authorization": f"Bearer {key}"},
                json={
                    "model": TTS_MODEL,
                    # The API caps input length; truncating beats a 400 that
                    # leaves the user with no audio at all.
                    "input": text[:4000],
                    "voice": voice,
                    "speed": 1.0,
                },
            )
        if res.status_code == 200:
            return res.content
        logger.warning("openai tts returned %s; falling back", res.status_code)
    except httpx.HTTPError as exc:
        logger.warning("openai tts failed (%s); falling back", exc)
    return None


async def _fallback_speech(text: str, language_code: str) -> bytes:
    """Free engine, one request per sentence chunk, concatenated.

    Its query string is length-limited, which is why `split_into_chunks` splits
    on sentence boundaries rather than slicing.

    A failed chunk used to `break` and return whatever had arrived, so a rate
    limit two sentences in produced a reading that stopped after the heading and
    was played as though it were the whole thing. This engine throttles quickly,
    which made that the normal outcome for a long answer rather than a rare one.
    So: retry a chunk before giving up on it, and if it still will not come,
    return nothing. A caller that gets no audio says so; one that gets half a
    reading cannot tell, and neither can the listener.
    """
    chunks = split_into_chunks(text)
    parts: list[bytes] = []

    async with httpx.AsyncClient(timeout=TIMEOUT) as client:
        for index, chunk in enumerate(chunks):
            content = await _fallback_chunk(client, chunk, language_code)
            if content is None:
                logger.warning(
                    "fallback tts gave up at chunk %d/%d; discarding %d chunks "
                    "rather than reading a truncated answer aloud",
                    index + 1,
                    len(chunks),
                    len(parts),
                )
                return b""
            parts.append(content)
            # The engine throttles on bursts. A short gap between sentences
            # costs less than the retry it avoids.
            if index + 1 < len(chunks):
                await asyncio.sleep(_CHUNK_GAP_SECONDS)

    return b"".join(parts)


async def _fallback_chunk(
    client: httpx.AsyncClient, chunk: str, language_code: str
) -> bytes | None:
    """One sentence, with retries. `None` once it is genuinely unavailable."""
    for attempt in range(_CHUNK_ATTEMPTS):
        try:
            res = await client.get(
                "https://translate.google.com/translate_tts",
                params={"ie": "UTF-8", "q": chunk, "tl": language_code, "client": "tw-ob"},
                headers={"User-Agent": "Mozilla/5.0"},
            )
        except httpx.HTTPError as exc:
            logger.warning("fallback tts chunk error: %s", exc)
            res = None

        if res is not None and res.status_code == 200 and res.content:
            return res.content

        # Backs off, because the failure this hits is a rate limit.
        await asyncio.sleep(_CHUNK_GAP_SECONDS * (attempt + 1) * 2)

    return None


# --- Transcription ---


async def transcribe(audio: bytes, filename: str, language: str | None) -> TranscriptResponse:
    key = _api_key()
    if not key:
        raise VoiceUnavailableError("Speech recognition is not configured.")

    data = {"model": TRANSCRIBE_MODEL}
    if language:
        data["language"] = language

    try:
        async with httpx.AsyncClient(timeout=TIMEOUT) as client:
            res = await client.post(
                f"{OPENAI_BASE}/audio/transcriptions",
                headers={"Authorization": f"Bearer {key}"},
                files={"file": (filename, audio, "audio/webm")},
                data=data,
            )
    except httpx.HTTPError as exc:
        logger.warning("transcription failed: %s", exc)
        raise VoiceUnavailableError("Could not transcribe that audio.") from exc

    if res.status_code != 200:
        logger.warning("transcription returned %s", res.status_code)
        raise VoiceUnavailableError("Could not transcribe that audio.")

    return TranscriptResponse(text=res.json().get("text", ""))


# --- Realtime session ---


async def create_realtime_session(req: RealtimeSessionRequest) -> RealtimeSessionResponse:
    """Mint an ephemeral key for the browser's WebRTC connection.

    The key is short-lived and scoped to one session, which is the entire reason
    this endpoint exists: the account key must never reach a browser.
    """
    instructions = prompts.build_realtime_prompt(req.chart, req.birth, req.language)
    key = _api_key()
    if not key:
        # Instructions are returned either way: the client shows them in its
        # debug panel, and a special case that omits them is a second shape to
        # handle for no benefit.
        return RealtimeSessionResponse(fallback="media_recorder_whisper", instructions=instructions)

    def session(model: str) -> dict:
        """The session as the current API wants it.

        `POST /realtime/sessions` was retired and now answers `404 Invalid URL`
        for every model — which the old loop treated as "this tier lacks
        access" and fell back from, silently, forever. Voice and turn detection
        moved under `audio.input` / `audio.output` at the same time.
        """
        return {
            "type": "realtime",
            "model": model,
            "instructions": instructions,
            "audio": {
                "input": {
                    "transcription": {"model": TRANSCRIBE_MODEL},
                    # Server-side cleanup of the caller's microphone, on top of
                    # the browser's own echo cancellation. `near_field` is the
                    # right profile for a laptop or a headset held close.
                    "noise_reduction": {"type": "near_field"},
                    # Semantic rather than energy-based. `server_vad` answers
                    # anything louder than a threshold, so a door, a cough or a
                    # television started a turn and the astrologer replied to
                    # noise. This one judges whether a *thought* finished, which
                    # is the difference between "heard a sound" and "was asked
                    # something". It also stops cutting people off mid-sentence
                    # when they pause to think, which a fixed silence timer does.
                    "turn_detection": {
                        "type": "semantic_vad",
                        "eagerness": "medium",
                        "create_response": True,
                        # Half-duplex, deliberately. Talking over the astrologer
                        # sounds good in a demo and is miserable in a room with
                        # any noise in it: the reply gets cut off by a cough and
                        # nobody can tell why. The caller stops it themselves
                        # when they want the turn, and the microphone is muted
                        # while it speaks so nothing else can.
                        "interrupt_response": False,
                    },
                },
                "output": {"voice": req.voice, "speed": 1.0},
            },
        }

    async with httpx.AsyncClient(timeout=TIMEOUT) as client:
        for model in REALTIME_MODELS:
            try:
                res = await client.post(
                    f"{OPENAI_BASE}/realtime/client_secrets",
                    headers={"Authorization": f"Bearer {key}"},
                    json={"session": session(model)},
                )
            except httpx.HTTPError as exc:
                logger.warning("realtime session request failed for %s: %s", model, exc)
                continue

            if res.status_code == 200:
                secret = res.json().get("value")
                if secret:
                    return RealtimeSessionResponse(
                        client_secret=secret, model=model, instructions=instructions
                    )

            # This was a bare `continue`. A retired endpoint and an account
            # without access looked identical from the outside, which is how a
            # 404 went unnoticed long enough to become "live voice is buggy".
            logger.warning(
                "realtime session refused for %s: %s %s",
                model,
                res.status_code,
                res.text[:200],
            )

    # Not an error: the client has a working path without a live session, and
    # the Realtime API is not on every account tier.
    logger.info("realtime unavailable on all candidate models; client will fall back")
    return RealtimeSessionResponse(fallback="media_recorder_whisper", instructions=instructions)
