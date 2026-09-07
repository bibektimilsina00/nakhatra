"""Report generation: try the model, fall back to the deterministic generator.

The fallback is a full report, not a degraded one — `generator.py` produces the
same seven sections from the same chart. That is why a model failure here
returns 200 with `source: "rule_engine"` rather than an error.
"""

from __future__ import annotations

import json
import logging
from collections.abc import AsyncIterator

from anthropic import APIError
from pydantic import ValidationError
from sqlmodel import Session

from app.integrations.llm import get_client, model_name, tuning
from app.modules.report import generator, prompts, repository
from app.modules.report.cache_key import chart_key
from app.modules.report.schemas import ReportRequest, ReportResponse, ReportSection
from app.modules.report.streaming import SectionScanner

logger = logging.getLogger(__name__)

MAX_TOKENS = 8000
MIN_SECTIONS = 5


async def generate_report(
    req: ReportRequest, session: Session | None = None, user_id: str | None = None
) -> ReportResponse:
    """The whole report in one response. Served from storage when it exists.

    `session` and `user_id` are optional so the function stays callable without
    a database — the tests that only exercise the model-vs-fallback decision
    should not have to stand one up.
    """
    stored = _stored(session, user_id, req)
    if stored is not None:
        return ReportResponse(report=stored, source="llm")

    sections = await _from_model(req)
    if sections:
        _store(session, user_id, req, sections)
        return ReportResponse(report=sections, source="llm")
    # The rule engine's output is deliberately not stored: it is a stand-in for
    # a reading that failed, and caching it would make one bad minute permanent.
    return ReportResponse(
        report=generator.generate(req.chart, req.birth, req.language),
        source="rule_engine",
    )


def _stored(
    session: Session | None, user_id: str | None, req: ReportRequest
) -> list[ReportSection] | None:
    if session is None or user_id is None:
        return None
    try:
        key = chart_key(req.birth, req.chart.engine_version)
        row = repository.get(session, user_id, key, req.language)
    except Exception:
        # The cache is an optimisation. An unmigrated database or a dropped
        # connection must degrade to generating the reading, not kill a
        # response that had already begun streaming — which is exactly what an
        # exception raised inside the generator does: a 200 with an empty body.
        logger.exception("could not read the stored report; generating instead")
        return None

    if row is None:
        return None
    try:
        return [ReportSection(**section) for section in row.sections]
    except (ValidationError, TypeError):
        # A row written by an older shape of the schema. Regenerate rather than
        # serve something the client cannot render.
        logger.warning("stored report %s no longer validates; regenerating", row.id)
        return None


def _store(
    session: Session | None,
    user_id: str | None,
    req: ReportRequest,
    sections: list[ReportSection],
) -> None:
    if session is None or user_id is None:
        return
    try:
        repository.put(
            session,
            user_id=user_id,
            key=chart_key(req.birth, req.chart.engine_version),
            language=req.language,
            engine_version=req.chart.engine_version,
            model=model_name(),
            sections=[s.model_dump() for s in sections],
        )
    except Exception:
        # The reading is already generated and on its way to the reader. Failing
        # the request because the cache write failed would be the worse trade.
        logger.exception("could not store the generated report")


async def _from_model(req: ReportRequest) -> list[ReportSection] | None:
    """The model's seven sections, or None if anything about them is unusable."""
    try:
        response = await get_client().messages.create(
            model=model_name(),
            max_tokens=MAX_TOKENS,
            system=prompts.system_blocks(req.chart, req.birth, req.language),
            messages=[{"role": "user", "content": prompts.USER_PROMPT}],
            **tuning(),
        )
    except APIError as exc:
        logger.warning("report generation fell back to the rule engine: %s", exc)
        return None

    if response.stop_reason == "refusal":
        logger.warning("report generation refused by the model; using rule engine")
        return None

    raw = "".join(b.text for b in response.content if getattr(b, "type", None) == "text").strip()
    sections = _parse(raw)
    if sections is None:
        # Every fallback is visible in the log now. Silence here meant a model
        # that had been failing for weeks looked exactly like one that worked.
        logger.warning(
            "report fell back to the rule engine: %s (stop_reason=%s, %d chars)",
            _why(raw),
            response.stop_reason,
            len(raw),
        )
    return sections


def _why(raw: str) -> str:
    """One line naming which parse step rejected the model's output."""
    start, end = raw.find("["), raw.rfind("]")
    if start == -1:
        return "no JSON array in the response"
    if end <= start:
        return "opened '[' but never closed it — truncated, raise MAX_TOKENS"
    try:
        parsed = json.loads(raw[start : end + 1])
    except json.JSONDecodeError as exc:
        return f"invalid JSON at char {exc.pos}: {exc.msg}"
    if not isinstance(parsed, list):
        return "JSON was not an array"
    if len(parsed) < MIN_SECTIONS:
        return f"only {len(parsed)} sections, need {MIN_SECTIONS}"
    return "a section failed schema validation"


def _parse(raw: str) -> list[ReportSection] | None:
    start, end = raw.find("["), raw.rfind("]")
    if start == -1 or end <= start:
        return None
    try:
        parsed = json.loads(raw[start : end + 1])
    except json.JSONDecodeError:
        return None
    if not isinstance(parsed, list) or len(parsed) < MIN_SECTIONS:
        # A three-section report is worse than the deterministic seven.
        return None
    try:
        return [ReportSection(**section) for section in parsed]
    except (ValidationError, TypeError):
        # A malformed section would render as a broken card. The rule engine's
        # output is always well-formed, so prefer it.
        return None


async def stream_report(
    req: ReportRequest, session: Session | None = None, user_id: str | None = None
) -> AsyncIterator[str]:
    """The report as server-sent events, one section at a time.

    A section lands the moment the model closes its brace rather than a minute
    later when the array closes, so the page fills in as it is written.

    The fallback still exists, it just arrives differently: a non-streaming call
    can swap the rule engine in silently before responding, whereas here the
    first sections are already on screen. So a stream that fails partway sends
    `error`, and the client — which knows what it has rendered — decides whether
    to keep them or drop back to its own copy.
    """
    # A reading already written for this chart and language replays instantly.
    # Same frames in the same order, so the client cannot tell the difference
    # apart from the speed — and the model is not billed for it twice.
    stored = _stored(session, user_id, req)
    if stored is not None:
        for section in stored:
            yield _event({"type": "section", "section": section.model_dump()})
        yield _event({"type": "done", "source": "llm", "count": len(stored), "cached": True})
        return

    scanner = SectionScanner()
    sent = 0
    collected: list[ReportSection] = []

    try:
        async with get_client().messages.stream(
            model=model_name(),
            max_tokens=MAX_TOKENS,
            system=prompts.system_blocks(req.chart, req.birth, req.language),
            messages=[{"role": "user", "content": prompts.USER_PROMPT}],
            **tuning(),
        ) as stream:
            async for text in stream.text_stream:
                for raw in scanner.feed(text):
                    try:
                        section = ReportSection(**raw)
                    except (ValidationError, TypeError):
                        # One malformed section is not worth killing a report
                        # that is otherwise arriving fine.
                        logger.warning("skipped a malformed streamed section")
                        continue
                    sent += 1
                    collected.append(section)
                    yield _event({"type": "section", "section": section.model_dump()})

            final = await stream.get_final_message()
            if final.stop_reason == "refusal":
                logger.warning("report stream refused by the model")
                yield _event({"type": "error", "reason": "refusal"})
                return
    except APIError as exc:
        logger.warning("report stream failed after %d sections: %s", sent, exc)
        yield _event({"type": "error", "reason": "upstream"})
        return

    if sent < MIN_SECTIONS:
        # Same bar as the non-streaming path: a three-section report reads as a
        # truncated one, and the deterministic seven are better.
        logger.warning("report stream produced only %d sections", sent)
        yield _event({"type": "error", "reason": "incomplete"})
        return

    # Stored only once the whole reading arrived: a stream that died after four
    # sections must not be cached as if it were the finished thing.
    _store(session, user_id, req, collected)
    yield _event({"type": "done", "source": "llm", "count": sent, "cached": False})


def _event(payload: dict) -> str:
    """One SSE frame. `ensure_ascii=False` keeps Devanagari from tripling in size."""
    return f"data: {json.dumps(payload, ensure_ascii=False)}\n\n"
