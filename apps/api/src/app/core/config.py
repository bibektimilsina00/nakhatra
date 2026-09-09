"""Typed settings, validated at startup.

Fail fast and loudly: a missing LLM_BASE_URL that defaults to empty means
requests silently go to api.anthropic.com with a router key and 401 like
a bad key (docs/ai-astrologer.md). Better to refuse to boot.
"""

from __future__ import annotations

from functools import lru_cache
from typing import Literal

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    ENV: Literal["local", "staging", "production"] = "local"
    DEBUG: bool = False

    # Astrology. Optional: without it the engine uses Moshier analytical theory,
    # which needs no data files and is accurate to ~1 arcsecond.
    EPHEMERIS_PATH: str | None = None

    # LLM (Phase 2). Declared now so a misconfigured deploy fails at boot rather
    # than on the first user question.
    LLM_BASE_URL: str = "https://openrouter.ai/api"
    LLM_API_KEY: str = ""
    LLM_MODEL: str = "google/gemini-3.6-flash"

    # Voice. OpenAI-specific: TTS, Whisper and the Realtime API have no
    # OpenRouter equivalent, so this is a second provider rather than the same
    # key under another name.
    OPENAI_API_KEY: str = ""
    GEMINI_API_KEY: str = ""
    TTS_CACHE_DIR: str = ""
    #: Where profile photographs are written. Empty means a directory beside
    #: the database, which is right for one machine and wrong for several.
    MEDIA_DIR: str = ""

    # --- Calls ---
    #
    # STUN alone gets two browsers connected on most home and office networks.
    # It does not on symmetric NAT and on many mobile carriers, which is
    # roughly one connection in five — those need a TURN relay, and without one
    # the call simply never connects while both sides show "connecting".
    #
    # Left empty, calls still work for most people and fail silently for the
    # rest, so `/v1/calls/ice` reports whether a relay is configured and the
    # client says so rather than spinning.
    STUN_URLS: str = "stun:stun.l.google.com:19302,stun:stun1.l.google.com:19302"
    TURN_URL: str = ""
    TURN_USERNAME: str = ""
    TURN_PASSWORD: str = ""

    # Google sign-in. Empty disables the endpoint rather than accepting any
    # audience — a blank client id would make every Google token valid here.
    GOOGLE_CLIENT_ID: str = ""
    # Needed only for the popup auth-code flow the web client uses, which is
    # what lets the button be ours rather than one Google draws. The ID-token
    # flow (mobile) needs the id alone.
    GOOGLE_CLIENT_SECRET: str = ""

    CORS_ORIGINS: list[str] = []

    # No default. A committed fallback secret means anyone who can read this
    # repository can mint a token for any user in any deployment that forgot to
    # set it — and a default guarantees nothing ever tells you it was forgotten.
    JWT_SECRET: str = ""
    JWT_ALGORITHM: str = "HS256"
    DATABASE_URL: str | None = None

    @field_validator("JWT_SECRET")
    @classmethod
    def _usable_secret(cls, value: str) -> str:
        if len(value) < 32:
            raise ValueError(
                "JWT_SECRET must be at least 32 characters. Generate one with "
                "`openssl rand -hex 32` and put it in apps/api/.env. Refusing to "
                "boot rather than sign tokens with a weak or absent secret."
            )
        return value


@lru_cache
def get_settings() -> Settings:
    return Settings()
