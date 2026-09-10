"""Wire contract for the patro."""

from __future__ import annotations

from datetime import date, datetime

from pydantic import BaseModel, Field


class ElementOut(BaseModel):
    name: str
    ends_at: datetime | None = Field(
        default=None, description="Local time the element gives way to the next."
    )
    next_name: str | None = None


class GrahaPlaceOut(BaseModel):
    name: str
    sign: str
    degree_in_sign: float
    retrograde: bool


class PatroDayOut(BaseModel):
    on: date
    weekday: str
    sunrise: datetime | None
    sunset: datetime | None
    moonrise: datetime | None
    moonset: datetime | None
    paksha: str
    tithi: ElementOut
    nakshatra: ElementOut
    yoga: ElementOut
    karana: ElementOut
    moon_sign: str
    sun_sign: str
    ayana: str
    ritu: str
    masa: str
    festivals: list[str]
    grahas: list[GrahaPlaceOut]


class PatroRangeOut(BaseModel):
    start: date
    end: date
    days: list[PatroDayOut]
    engine_version: str
