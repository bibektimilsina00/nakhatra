"""Wire contract for the voice endpoints."""

from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field

from app.modules.kundali.schemas import BirthDetailsIn, ChartOut

# The Realtime and TTS voices OpenAI offers. Anything else is rejected rather
# than silently swapped, so a typo in a client shows up as an error.
Voice = Literal["onyx", "ash", "sage", "coral", "echo", "alloy", "shimmer", "ballad", "verse"]
Language = Literal["en", "ne", "hi"]


class SpeakRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=8000)
    voice: Voice = "onyx"
    language: Language = "en"


class SpeakResponse(BaseModel):
    audio_url: str = Field(description="Path to the mp3, served by GET /v1/tts/audio/{name}.")
    spoken_text: str = Field(description="What was actually synthesised, after markdown removal.")
    cached: bool
    source: str = Field(description="Which engine produced it, e.g. 'openai_tts_onyx'.")


class TranscriptResponse(BaseModel):
    text: str


class MilanKutaBrief(BaseModel):
    """One koota's score, as the engine computed it."""

    name: str = ""
    obtained: float = 0.0
    max_points: float = 0.0


class MilanContextIn(BaseModel):
    """A finished match, handed to the model as data.

    Present only when the visitor opened the consultation from a milan
    result. Every figure was computed by `astrology_core.milan`; the model
    reads it and never recomputes it.
    """

    partner_name: str = ""
    partner_chart: ChartOut | None = None
    total_guna: float | None = None
    max_guna: float | None = None
    verdict: str = ""
    kutas: list[MilanKutaBrief] = Field(default_factory=list)
    manglik_note: str = ""


class RealtimeSessionRequest(BaseModel):
    chart: ChartOut
    birth: BirthDetailsIn
    language: Language = "en"
    # Wider than the TTS Voice literal on purpose: Gemini sessions name
    # voices from Gemini's own cast (Charon, Kore, ...). Widening accepts
    # every old value, so no shipped client breaks.
    voice: str = Field(default="ash", max_length=32, pattern=r"^[A-Za-z]+$")
    provider: str | None = Field(
        default=None,
        description="Pin the realtime provider. The browser sends 'openai' "
        "when a Gemini session was granted but failed to connect — billing "
        "and regional availability are only discoverable at connect time.",
    )
    milan: MilanContextIn | None = Field(
        default=None,
        description="A finished Ashtakoota match, when the consultation was "
        "opened from one. Additive: absent for every single-chart session.",
    )


class RealtimeSessionResponse(BaseModel):
    client_secret: str | None = Field(
        default=None,
        description="Ephemeral key for the browser's WebRTC connection. Null when "
        "the Realtime API is unavailable on this account tier.",
    )
    model: str | None = None
    instructions: str | None = None
    provider: str = Field(
        default="openai",
        description="Which realtime stack the token belongs to: 'openai' "
        "(WebRTC) or 'gemini' (Live API WebSocket). Old clients ignore it "
        "and keep working, since they predate the Gemini path entirely.",
    )
    fallback: str | None = Field(
        default=None,
        description="Set to 'media_recorder_whisper' when the client should fall "
        "back to recording and transcribing instead of a live session.",
    )
