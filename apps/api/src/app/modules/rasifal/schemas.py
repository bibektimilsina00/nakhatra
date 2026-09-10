"""Wire contract for the daily rasifal.

Computed facts only. The sentence a reader sees is composed by the client in
their own language, the same way the milan kootas are — the engine names the
graha, the house and the murti, and never writes prose.
"""

from __future__ import annotations

from datetime import date

from pydantic import BaseModel, Field


class TransitOut(BaseModel):
    name: str = Field(description="Graha, e.g. 'Saturn'.")
    sign: str
    house: int = Field(description="1-12, counted inclusively from the janma rashi.")
    favourable: bool
    obstructed: bool = Field(
        description="Favourable by house, but blocked by a graha in its vedha house."
    )
    retrograde: bool


class RashiReadingOut(BaseModel):
    """The written rashifal for one sign.

    Additive and optional: a client that predates it, or a day the writer
    could not be reached for, still renders from the computed findings.
    """

    summary: str = ""
    career: str = ""
    love: str = ""
    finance: str = ""
    health: str = ""
    remedy: str = ""
    astrological_reason: str = Field(
        default="",
        description="Where the technical terms belong — grahas, houses, "
        "obstructions. Never in the fields above.",
    )


class RashiDayOut(BaseModel):
    sign: str
    sign_index: int
    lord: str
    score: float
    rating: int = Field(ge=1, le=5)
    murti: str = Field(description="Swarna, Rajata, Tamra or Loha.")
    murti_house: int
    supports: list[str] = Field(description="Grahas helping today, strongest first.")
    strains: list[str] = Field(description="Grahas hindering today.")
    lucky_number: int
    lucky_colour: str = Field(description="Colour key, not a word: 'white', 'red', ...")
    band: str = Field(
        default="",
        description="Verdict key: very_good | good | favourable | ordinary | "
        "caution | difficult. Decided by the engine, never by the writer.",
    )
    reading: RashiReadingOut | None = Field(
        default=None, description="The written rashifal, when one was generated."
    )
    transits: list[TransitOut]


class RasifalOut(BaseModel):
    for_date: date
    weekday_lord: str
    engine_version: str
    signs: list[RashiDayOut]


class RashiPeriodOut(BaseModel):
    sign: str
    sign_index: int
    lord: str
    band: str = ""
    score: float = Field(description="Mean of the daily scores across the span.")
    rating: int = Field(ge=1, le=5)
    best_date: date
    best_rating: int
    hardest_date: date
    hardest_rating: int
    steady_supports: list[str] = Field(
        description="Grahas favourable through most of the span — its theme, "
        "not a passing day."
    )
    steady_strains: list[str]
    golden_days: int = Field(description="Days whose Moon murti is Swarna.")
    iron_days: int
    lucky_number: int
    lucky_colour: str


class PeriodRasifalOut(BaseModel):
    start: date
    end: date
    days: int
    span: str = Field(description="'weekly' or 'monthly'.")
    engine_version: str
    signs: list[RashiPeriodOut]
