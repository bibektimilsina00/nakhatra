"""Chat business logic: build the prompt, call the model, parse the answer.

No FastAPI, no SQL. The chart arrives already computed — nothing here derives a
degree or a date (CLAUDE.md rule 1).
"""

from __future__ import annotations

import json
import logging

from anthropic import APIError

from app.core.errors import AppError
from app.integrations.llm import get_client, model_name, tuning
from app.modules.chat import prompts
from app.modules.chat.schemas import ChatRequest, ChatResponse

logger = logging.getLogger(__name__)

# Thinking shares this budget with the visible answer, so it needs headroom or
# long readings truncate mid-sentence (docs/ai-astrologer.md).
MAX_TOKENS = 4000

# Enough for continuity without resending a whole consultation every turn.
HISTORY_TURNS = 6


class AstrologerUnavailableError(AppError):
    status_code = 503
    code = "astrologer_unavailable"


class AstrologerDeclinedError(AppError):
    status_code = 422
    code = "astrologer_declined"


async def answer(req: ChatRequest) -> ChatResponse:
    messages = [
        {"role": "user" if turn.sender == "user" else "assistant", "content": turn.text}
        for turn in req.messages[-HISTORY_TURNS:]
        if turn.text.strip()
    ]
    messages.append({"role": "user", "content": req.query})

    try:
        response = await get_client().messages.create(
            model=model_name(),
            max_tokens=MAX_TOKENS,
            system=prompts.system_blocks(req.chart, req.birth, req.language),
            messages=messages,
            **tuning(),
        )
    except APIError as exc:
        # The upstream message can carry request context; it does not go to the
        # client (rule 9). Log it, return something a user can act on.
        logger.warning("astrologer call failed: %s", exc)
        raise AstrologerUnavailableError(
            "The astrologer is unavailable right now. Please try again shortly."
        ) from exc

    if response.stop_reason == "refusal":
        # Must be checked before reading content, which is empty on a refusal.
        raise AstrologerDeclinedError(
            "The astrologer cannot answer that question. Try rephrasing it."
        )

    return _parse(_text_of(response), req)


def _text_of(response) -> str:
    """Concatenate the text blocks, skipping thinking blocks."""
    return "".join(
        block.text for block in response.content if getattr(block, "type", None) == "text"
    ).strip()


def _parse(raw: str, req: ChatRequest) -> ChatResponse:
    """The model is asked for JSON. Degrade to prose rather than to an error."""
    basis_fallback = f"{req.chart.lagna_sign} Ascendant · Vedic Reading"
    raw = raw.strip()
    if not raw:
        raise AstrologerUnavailableError(
            "The astrologer returned an empty answer. Please try again."
        )

    start, end = raw.find("{"), raw.rfind("}")
    if start != -1 and end > start:
        try:
            parsed = json.loads(raw[start : end + 1])
        except json.JSONDecodeError:
            parsed = None
        if isinstance(parsed, dict) and parsed.get("text"):
            return ChatResponse(
                text=str(parsed["text"]),
                astrological_basis=str(parsed.get("astrologicalBasis") or basis_fallback),
                highlight_house=_house(parsed.get("highlightHouse")),
            )

    # Valid prose that simply is not JSON is a worse answer, not a failed one.
    return ChatResponse(text=raw, astrological_basis=basis_fallback)


def _house(value: object) -> int | None:
    """The schema bounds this 1-12; a model that invents 0 or 14 must not 500."""
    try:
        house = int(value)  # type: ignore[arg-type]
    except (TypeError, ValueError):
        return None
    return house if 1 <= house <= 12 else None
