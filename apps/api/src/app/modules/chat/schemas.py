"""Wire contract for the astrologer chat endpoint."""

from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field

from app.modules.kundali.schemas import BirthDetailsIn, ChartOut


class ChatTurn(BaseModel):
    """One prior turn, as the client already stores it."""

    sender: Literal["user", "astrologer"]
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


class ChatRequest(BaseModel):
    query: str = Field(..., min_length=1, max_length=4000)
    messages: list[ChatTurn] = Field(
        default_factory=list,
        description="Conversation so far. Only the most recent turns are sent to the model.",
    )
    # Typed rather than a free-form dict: this is what generates the contract both
    # clients build against, and it means a malformed chart fails at the boundary
    # instead of producing a confidently wrong reading.
    chart: ChartOut
    birth: BirthDetailsIn
    language: Literal["en", "ne", "hi"] = "en"
    milan: MilanContextIn | None = Field(
        default=None,
        description="A finished Ashtakoota match, when the consultation was "
        "opened from one. Additive: absent for every single-chart session.",
    )


class ChatResponse(BaseModel):
    text: str
    astrological_basis: str = Field(
        default="",
        description="Short tag naming the placement the answer rests on, e.g. "
        "'10th House Virgo · Exalted Mercury in D1'.",
    )
    highlight_house: int | None = Field(
        default=None,
        ge=1,
        le=12,
        description="House for the client to highlight in the chart, if the answer "
        "is about one. Null when no single house is implicated.",
    )
