"""Wire contract for the generated astrology report."""

from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field

from app.modules.kundali.schemas import BirthDetailsIn, ChartOut


class ReportReason(BaseModel):
    """The placement an assertion rests on. Every section shows its working."""

    placement: str
    explanation: str


class ReportSection(BaseModel):
    id: str
    icon: str
    title: str
    subtitle: str
    summary: str
    content: list[str]
    reasoning: list[ReportReason]


class ReportRequest(BaseModel):
    chart: ChartOut
    birth: BirthDetailsIn
    language: Literal["en", "ne", "hi"] = "en"


class ReportResponse(BaseModel):
    report: list[ReportSection]
    source: Literal["llm", "rule_engine"] = Field(
        description=(
            "'rule_engine' means the deterministic generator produced this — a "
            "complete report, not a degraded one. Surfaced so the client can tell "
            "the two apart rather than guess. 'llm' covers both a freshly "
            "generated reading and one replayed from storage; the two are the "
            "same reading, and the streaming endpoint's `done` frame carries a "
            "`cached` flag if you need to tell them apart."
        )
    )
