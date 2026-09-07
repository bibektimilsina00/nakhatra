"""Report endpoint. Routes only."""

from __future__ import annotations

from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse

from app.core.db import SessionDep
from app.modules.auth.router_deps import get_current_user
from app.modules.report import service
from app.modules.report.schemas import ReportRequest, ReportResponse

router = APIRouter(prefix="/v1", tags=["report"])


@router.post(
    "/report",
    response_model=ReportResponse,
    summary="Generate a seven-section reading for a chart",
    description=(
        "Reads an already-computed chart. `source` says whether the model or the "
        "deterministic generator produced it; both return the same seven sections."
    ),
)
async def report(
    body: ReportRequest,
    session: SessionDep,
    user_id: str = Depends(get_current_user),
) -> ReportResponse:
    return await service.generate_report(body, session, user_id)


@router.post(
    "/report/stream",
    summary="The same report, streamed section by section",
    description=(
        "Server-sent events. Each `section` frame carries one finished section "
        "the moment the model closes it, rather than making the reader wait a "
        "minute for the whole array; the stream ends with `done` or, if it "
        "could not be completed, `error`. `/v1/report` is unchanged and still "
        "returns the whole report in one response."
    ),
    response_class=StreamingResponse,
)
async def report_stream(
    body: ReportRequest,
    session: SessionDep,
    user_id: str = Depends(get_current_user),
) -> StreamingResponse:
    return StreamingResponse(
        service.stream_report(body, session, user_id),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            # nginx and Caddy will otherwise sit on the whole response, which
            # turns a stream back into the thing it was meant to replace.
            "X-Accel-Buffering": "no",
        },
    )
