"""A second implementation of the chart frame, written to disagree.

`test_golden.py` refuses to freeze a fixture that no independent source has
confirmed, because a golden test built from this engine's own output preserves
whatever bug it contains. For a Nepali birth the independent source is a
kundali cast by hand, and nothing else will do. But most of the fixtures are
not Nepali births — Reykjavik at 64N, a 1905 Indian birth before IST existed,
a wartime DST case — and no jyotish will ever cast those. They still need
confirming, so this is the other kind of independence available: the same
quantities computed a second time, from published formulae, by code that
shares nothing with `app.astrology_core`.

What it covers, and what that is worth:

  UTC offset      read from the IANA database via `zoneinfo`. This is the one
                  that matters most — rule 5 exists because a wrong historical
                  offset silently rotates the whole chart, and Nepal's
                  +5:41:16 -> +5:30 -> +5:45 history is exactly where an
                  engine gets it wrong.
  Julian Day      Meeus, *Astronomical Algorithms* ch. 7.
  sidereal time   Meeus ch. 12.
  obliquity       Meeus ch. 22.
  ascendant       spherical trigonometry from those three. The engine gets
                  its ascendant from `swe.houses_ex`; this never calls it.

What it does not cover: planetary longitudes. Reproducing those independently
means reimplementing an ephemeris, which is the one thing this project
deliberately does not do. They stay pinned by the hand-cast graha sphuta table
in `test_textbook.py` and by the invariants.

The ayanamsa is taken from the engine, because Lahiri is a defined constant
rather than something to re-derive — and it is separately checked against a
printed value in `test_ayanamsa_matches_the_book`.
"""

from __future__ import annotations

import math
from datetime import datetime
from zoneinfo import ZoneInfo


def utc_offset_hours(local: datetime, tz_name: str) -> float:
    """The offset the IANA database gives for this instant at this place."""
    return ZoneInfo(tz_name).utcoffset(local).total_seconds() / 3600.0


def julian_day(local: datetime, tz_name: str) -> float:
    """Meeus ch. 7. Gregorian only — every fixture is post-1582."""
    hours = local.hour + local.minute / 60 + local.second / 3600
    day = local.day + (hours - utc_offset_hours(local, tz_name)) / 24.0
    year, month = local.year, local.month
    if month <= 2:
        year -= 1
        month += 12
    a = year // 100
    b = 2 - a + a // 4
    return (
        int(365.25 * (year + 4716))
        + int(30.6001 * (month + 1))
        + day
        + b
        - 1524.5
    )


def gmst_degrees(jd: float) -> float:
    """Greenwich mean sidereal time. Meeus ch. 12, eq. 12.4."""
    t = (jd - 2451545.0) / 36525.0
    theta = (
        280.46061837
        + 360.98564736629 * (jd - 2451545.0)
        + 0.000387933 * t * t
        - t * t * t / 38710000.0
    )
    return theta % 360.0


def obliquity_degrees(jd: float) -> float:
    """Mean obliquity of the ecliptic. Meeus ch. 22, eq. 22.2."""
    t = (jd - 2451545.0) / 36525.0
    seconds = 46.8150 * t + 0.00059 * t * t - 0.001813 * t * t * t
    return 23.0 + 26.0 / 60.0 + (21.448 - seconds) / 3600.0


def tropical_ascendant(jd: float, latitude: float, longitude: float) -> float:
    """The rising degree of the ecliptic, from spherical trigonometry.

    tan(Asc) = cos(RAMC) / -(sin(RAMC) cos e + tan(phi) sin e)
    """
    ramc = math.radians((gmst_degrees(jd) + longitude) % 360.0)
    e = math.radians(obliquity_degrees(jd))
    phi = math.radians(latitude)
    asc = math.degrees(
        math.atan2(
            math.cos(ramc),
            -(math.sin(ramc) * math.cos(e) + math.tan(phi) * math.sin(e)),
        )
    )
    return asc % 360.0


def sidereal_ascendant(jd: float, latitude: float, longitude: float, ayanamsa: float) -> float:
    return (tropical_ascendant(jd, latitude, longitude) - ayanamsa) % 360.0
