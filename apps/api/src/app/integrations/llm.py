"""The one place an LLM client is constructed.

The provider is an OpenAI-style router, not Anthropic directly, but it serves
Anthropic's wire format at `/v1/messages` — so this stays the official
`anthropic` SDK with `base_url` overridden, and the three call sites never learn
which provider is behind it.

Both the URL and the key are passed explicitly: the SDK otherwise reads
`ANTHROPIC_BASE_URL` from the environment, and when that variable is missing a
router key goes to api.anthropic.com and comes back as a 401 that reads exactly
like a bad key (docs/ai-astrologer.md).
"""

from __future__ import annotations

from functools import lru_cache

from anthropic import AsyncAnthropic

from app.core.config import get_settings


@lru_cache(maxsize=1)
def get_client() -> AsyncAnthropic:
    settings = get_settings()
    if not settings.LLM_API_KEY:
        raise RuntimeError(
            "LLM_API_KEY is not set. Put an OpenRouter key in apps/api/.env; "
            "see apps/api/.env.example."
        )
    return AsyncAnthropic(
        api_key=settings.LLM_API_KEY,
        base_url=_origin(settings.LLM_BASE_URL),
    )


def model_name() -> str:
    """Whatever `LLM_MODEL` says. Changing provider or model is a .env change."""
    return get_settings().LLM_MODEL


def tuning() -> dict:
    """Request knobs that only some models accept.

    `thinking` and `output_config` are Anthropic's own; a router will forward
    them verbatim, and a Gemini or Qwen model behind the same endpoint rejects
    the request rather than ignoring the fields. Gating on the model id keeps
    one call shape across every provider instead of a branch at each call site.

    Opus 5 gotchas the callers must still respect (docs/ai-astrologer.md):
      - `temperature` / `top_p` / `top_k` are rejected. Steer with prompting.
      - Assistant prefill is rejected. Use output_config.format for forced JSON.
      - Thinking shares the `max_tokens` budget with the text, so size
        max_tokens with headroom or answers truncate mid-sentence.
      - Check `stop_reason == "refusal"` before reading `content`.
    """
    if not _is_anthropic(model_name()):
        return {}
    return {"thinking": {"type": "adaptive"}, "output_config": {"effort": "medium"}}


def _is_anthropic(model: str) -> bool:
    """`anthropic/claude-opus-5` on a router, `claude-opus-5` first-party."""
    name = model.rsplit("/", 1)[-1]
    return model.startswith("anthropic/") or name.startswith("claude-")


def _origin(base_url: str | None) -> str | None:
    """Drop a trailing `/v1` — the SDK appends its own.

    Routers document their endpoint with the `/v1` on the end, so that is what
    ends up pasted into `.env`. The SDK then requests `/v1/v1/messages` and the
    404 comes back as `Invalid URL`, which reads like the model id is wrong
    rather than the base. Normalising here fixes it for chat, report and milan
    at once, and accepts both forms of the setting.
    """
    if not base_url:
        return base_url
    trimmed = base_url.rstrip("/")
    return trimmed[: -len("/v1")] if trimmed.endswith("/v1") else trimmed
