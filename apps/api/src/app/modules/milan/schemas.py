"""Schemas for Kundali Milan (Matchmaking)."""

from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field

from app.modules.kundali.schemas import BirthDetailsIn, ChartOut


class MilanRequest(BaseModel):
    groom: BirthDetailsIn
    bride: BirthDetailsIn
    groom_name: str = Field("Groom", min_length=1)
    bride_name: str = Field("Bride", min_length=1)


class KutaOut(BaseModel):
    name: str
    obtained: float
    max_points: float
    description: str


class ManglikOut(BaseModel):
    is_manglik: bool
    houses: list[int]
    severity: str
    is_canceled: bool
    cancellation_reason: str | None = None


class ManglikCompatibilityOut(BaseModel):
    compatible: bool
    canceled: bool
    reason: str


class MilanResponse(BaseModel):
    groom_name: str
    bride_name: str
    total_guna: float
    max_guna: float = 36.0
    percentage: float
    recommendation: str
    kutas: list[KutaOut]
    groom_manglik: ManglikOut
    bride_manglik: ManglikOut
    manglik_compatibility: ManglikCompatibilityOut
    groom_chart: ChartOut
    bride_chart: ChartOut


class MilanAnalysisRequest(MilanRequest):
    """Birth details, not a finished match.

    The match is recomputed server-side so the model can only ever read a score
    the engine produced — and so the request stays four fields wide instead of
    carrying two full charts back up the wire.
    """

    language: Literal["en", "ne", "hi"] = "en"


class MilanPointOut(BaseModel):
    """One thing that matches, or one that does not, and what it rests on."""

    title: str
    detail: str
    basis: str = Field(description="The koota or placement behind this, quoted with its score.")


class MilanDoshaOut(BaseModel):
    name: str
    severity: Literal["none", "mild", "moderate", "serious"]
    affects: str
    detail: str


class MilanRemedyOut(BaseModel):
    title: str
    detail: str
    timing: str


class MilanAnalysisResponse(BaseModel):
    verdict: str
    outlook: str
    strengths: list[MilanPointOut]
    concerns: list[MilanPointOut]
    doshas: list[MilanDoshaOut]
    remedies: list[MilanRemedyOut]
