"""The wire contract for charts.

Deliberately explicit rather than dumping `Chart.to_dict()`: this file is what
generates `contracts/openapi.json`, which both clients build their types from
(docs/architecture.md §7). If the response shape were an accident of an
internal dataclass, every refactor of that dataclass would be a breaking API
change.
"""

from __future__ import annotations

from datetime import date, datetime
from typing import Annotated, Literal
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

from pydantic import BaseModel, Field, field_validator

TimeAccuracy = Literal["exact", "approximate", "unknown"]


class BirthDetailsIn(BaseModel):
    name: Annotated[str, Field(min_length=1, max_length=100)]
    date: date
    time: Annotated[str, Field(pattern=r"^\d{2}:\d{2}(:\d{2})?$", examples=["08:30"])]

    tz_name: Annotated[
        str,
        Field(
            examples=["Asia/Kathmandu"],
            description=(
                "IANA zone name. NOT a UTC offset: the offset for a place "
                "changes over time, and sending a fixed one silently corrupts "
                "historical charts."
            ),
        ),
    ]
    latitude: Annotated[float, Field(ge=-90, le=90)]
    longitude: Annotated[float, Field(ge=-180, le=180, description="East positive")]
    place_label: Annotated[str, Field(min_length=1, max_length=200)]
    time_accuracy: TimeAccuracy = "exact"

    @field_validator("tz_name")
    @classmethod
    def _known_zone(cls, value: str) -> str:
        # The single highest-value validation in the API. An unknown or
        # offset-shaped zone here produces a chart that looks completely normal
        # and is wrong by minutes of arc.
        try:
            ZoneInfo(value)
        except (ZoneInfoNotFoundError, ValueError) as exc:
            raise ValueError(
                f"{value!r} is not an IANA time zone name (e.g. 'Asia/Kathmandu'). "
                "UTC offsets such as '+05:45' are rejected: the offset for a "
                "place changes over time."
            ) from exc
        return value


class NakshatraOut(BaseModel):
    name: str
    pada: int
    lord: str


class PlanetOut(BaseModel):
    name: str
    sign: str
    sign_index: int
    degree_in_sign: float
    house: int
    nakshatra: NakshatraOut
    retrograde: bool
    combust: bool
    avastha: str = Field(
        default="",
        description="Baladi avastha — the planet's 'age' in its sign: Bala, "
        "Kumara, Yuva, Vriddha, Mrita.",
    )
    dignity: str | None = Field(
        default=None,
        description="Null for Rahu and Ketu — classical sources disagree, so "
        "the engine declines to invent one. Clients must render the absence.",
    )
    aspects_houses: list[int]


class HouseOut(BaseModel):
    number: int
    sign: str
    sign_index: int = Field(
        description="0-11, Aries=0. The traditional North Indian chart prints "
        "the rashi number (sign_index + 1) in each house."
    )
    lord: str
    occupants: list[str]


class DashaPeriodOut(BaseModel):
    lord: str
    start: date
    end: date
    level: int = Field(description="1 maha, 2 antar, 3 pratyantar")
    children: list[DashaPeriodOut] = []


class DashaOut(BaseModel):
    birth_lord: str
    balance_years: float
    periods: list[DashaPeriodOut]


class VargaPlacementOut(BaseModel):
    planet: str
    sign: str
    sign_index: int
    house: int


class VargaChartOut(BaseModel):
    """A divisional chart is a full chart in its own right — its own ascendant,
    its own houses."""

    code: str = Field(description="D1, D9, D10 …")
    name: str
    meaning: str
    divisions: int
    lagna_sign: str
    lagna_sign_index: int
    placements: list[VargaPlacementOut]


class BoundaryWarningOut(BaseModel):
    """A panchanga element close to changing.

    Present because a traditional Nepali almanac's Moon runs 10-20 arcminutes
    ahead of a modern ephemeris, which matters only near a boundary — and
    there it decides the nakshatra, and with it the dasha lord and the name
    syllable. A reading that says "Magha" flatly when Purva Phalguni is nine
    minutes away is claiming more than the arithmetic supports.
    """

    element: str = Field(description="tithi | karana | nakshatra | yoga")
    current: str
    upcoming: str = Field(description="What it becomes when it changes.")
    minutes: float = Field(description="Minutes from the birth moment until it changes.")


class PanchangOut(BaseModel):
    """The five limbs of the Vedic calendar, plus the day boundary they hang off."""

    tithi_index: int = Field(description="0-29 across the lunar month")
    tithi_name: str
    paksha: str = Field(description="Shukla (waxing) or Krishna (waning)")
    karana: str
    yoga: str = Field(description="Nitya yoga — from Sun + Moon longitude")
    nakshatra: str
    nakshatra_lord: str
    nakshatra_pada: int
    vara: str = Field(
        description="Weekday by Vedic reckoning: the day turns at sunrise, so a "
        "pre-dawn birth belongs to the previous weekday."
    )
    vara_lord: str
    moon_sign: str
    moon_sign_lord: str
    ayana: str = Field(
        default="",
        description="Uttarayana or Dakshinayana — the Sun's half of the year, "
        "by its sidereal sign.",
    )
    ritu: str = Field(default="", description="Season: two solar months to each of six.")
    masa: str = Field(
        default="",
        description="Solar month by the Sun's sidereal sign — Bhadra when it is "
        "in Leo. These are the Bikram Sambat month names.",
    )
    vikram_samvat: int = Field(
        default=0,
        description="Bikram Sambat year. Rolls at Mesha Sankranti in mid-April, "
        "not on 1 January.",
    )
    shaka_samvat: int = Field(default=0, description="Shalivahana Shaka year.")
    samvatsara: str = Field(
        default="",
        description="Name of the year in the sixty-year Jovian cycle, e.g. Vibhava.",
    )
    near_boundary: list[BoundaryWarningOut] = Field(
        default_factory=list,
        description="Elements within an hour of changing. Usually empty; when it "
        "is not, a traditional panchanga may well name the upcoming value instead.",
    )
    ascendant_sign: str
    ascendant_lord: str
    sunrise: datetime | None = Field(
        default=None,
        description="Local time. Null above the polar circles, where the Sun "
        "may neither rise nor set — a valid chart, not an error.",
    )
    sunset: datetime | None = None


class AvakhadaOut(BaseModel):
    """Traditional birth attributes, all derived from the Moon.

    `paya` is deliberately absent: the rules in circulation disagree and give
    different metals for the same chart, so the engine declines to invent one.
    """

    varna: str
    vashya: str
    yoni: str
    gana: str
    nadi: str
    sign: str
    sign_lord: str
    charan: int = Field(description="The Moon's nakshatra pada, 1-4")
    tatva: str
    nakshatra: str
    name_syllable: str = Field(description="Syllable traditionally used to name the child")
    yunja: str


class ChartOut(BaseModel):
    engine_version: str = Field(
        description="Bumped whenever a calculation rule changes. Surfacing it "
        "makes 'why did my chart change?' answerable."
    )
    computed_at: datetime
    julian_day: float
    ayanamsa_name: str
    ayanamsa_value: float
    lagna_sign: str
    lagna_sign_index: int
    lagna_degree: float
    planets: list[PlanetOut]
    houses: list[HouseOut]
    dasha: DashaOut
    #: Two further timing schemes over the same janma nakshatra, read beside
    #: vimshottari rather than instead of it. Defaulted rather than required,
    #: so an older client that does not know about them is unaffected.
    tribhagi: DashaOut | None = Field(
        default=None,
        description="Vimshottari with a third removed — an 80-year cycle.",
    )
    yogini: DashaOut | None = Field(
        default=None,
        description="The eight yoginis over 36 years. `birth_lord` and each "
        "period's `lord` name a yogini, not a graha.",
    )
    panchang: PanchangOut
    avakhada: AvakhadaOut
    vargas: list[VargaChartOut]
