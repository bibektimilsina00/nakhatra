"""Patro days for a range. Shaping only — the reading is astrology_core's."""

from __future__ import annotations

from datetime import date, datetime
from zoneinfo import ZoneInfo

from app.astrology_core import patro
from app.modules.patro.schemas import (
    ElementOut,
    GrahaPlaceOut,
    PatroDayOut,
    PatroRangeOut,
)

ENGINE_VERSION = "patro-1.0.0"
NEPAL = ZoneInfo("Asia/Kathmandu")


def today_in_nepal() -> date:
    return datetime.now(NEPAL).date()


def _element(e: patro.Element) -> ElementOut:
    return ElementOut(name=e.name, ends_at=e.ends_at, next_name=e.next_name)


def for_range(start: date, days: int) -> PatroRangeOut:
    computed = patro.month(start, days)
    return PatroRangeOut(
        start=computed[0].on,
        end=computed[-1].on,
        engine_version=ENGINE_VERSION,
        days=[
            PatroDayOut(
                on=d.on,
                weekday=d.weekday,
                sunrise=d.sunrise,
                sunset=d.sunset,
                moonrise=d.moonrise,
                moonset=d.moonset,
                paksha=d.paksha,
                tithi=_element(d.tithi),
                nakshatra=_element(d.nakshatra),
                yoga=_element(d.yoga),
                karana=_element(d.karana),
                moon_sign=d.moon_sign,
                sun_sign=d.sun_sign,
                ayana=d.ayana,
                ritu=d.ritu,
                masa=d.masa,
                festivals=d.festivals,
                grahas=[
                    GrahaPlaceOut(
                        name=g.name,
                        sign=g.sign,
                        degree_in_sign=g.degree_in_sign,
                        retrograde=g.retrograde,
                    )
                    for g in d.grahas
                ],
            )
            for d in computed
        ],
    )
