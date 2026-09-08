"""Every fixture's frame, recomputed by code that shares nothing with the engine.

This is what stands in for a reference tool on the fixtures no astrologer will
ever cast — Reykjavik at 64N, a 1905 Indian birth predating IST, a wartime DST
case. `independent.py` derives the UTC offset from the IANA database and the
Julian Day, sidereal time, obliquity and ascendant from Meeus, calling neither
`swe.houses_ex` nor anything in `app.astrology_core`.

Agreement is not proof the chart is right — planetary longitudes are outside
what this can reach, and they stay pinned by the hand-cast graha sphuta table
in `test_textbook.py` and by `test_invariants.py`. What it does establish is
that the *frame* is right: the instant, the meridian, and the rising degree.
That is the part that fails silently and catastrophically. A historical offset
taken from memory instead of `zoneinfo` — rule 5's whole subject — moves a
1975 Kathmandu birth by fifteen minutes and the ascendant by nearly four
degrees, and every downstream value stays perfectly self-consistent while
being wrong.
"""

from __future__ import annotations

from app.astrology_core import build_chart

from .conftest import birth_of, siddhanta_of
from .independent import julian_day, sidereal_ascendant, utc_offset_hours

#: The two implementations differ in the last decimals of the sidereal-time
#: series, not in method, so they agree far inside an arcminute. A gap wider
#: than this is a real disagreement, not rounding.
ASCENDANT_TOLERANCE_ARCMIN = 1.0

#: Julian Day must agree to well under a second.
JULIAN_DAY_TOLERANCE_SECONDS = 0.01


def test_julian_day_matches_an_independent_computation(fixture):
    birth = birth_of(fixture)
    chart = build_chart(birth, siddhanta_of(fixture))
    theirs = julian_day(birth.local_datetime, birth.tz_name)
    off_seconds = abs(theirs - chart.julian_day) * 86400

    assert off_seconds < JULIAN_DAY_TOLERANCE_SECONDS, (
        f"{fixture['name']}: the engine puts this birth at JD {chart.julian_day:.9f}, "
        f"Meeus ch.7 at {theirs:.9f} — {off_seconds:.4f} seconds apart. Since both "
        f"start from the same civil time, this is the UTC offset disagreeing."
    )


def test_utc_offset_comes_from_the_iana_database(fixture):
    """Rule 5, enforced against the database rather than against our reading of it."""
    birth = birth_of(fixture)
    chart = build_chart(birth, siddhanta_of(fixture))
    offset = utc_offset_hours(birth.local_datetime, birth.tz_name)

    # The engine never exposes an offset; it is implied by the Julian Day it
    # produced from this local time. Recovering it is the check.
    implied = (
        (birth.local_datetime.hour + birth.local_datetime.minute / 60)
        - ((chart.julian_day + 0.5) % 1.0) * 24.0
    )
    implied = (implied + 12) % 24 - 12

    assert abs(implied - offset) < 1 / 60, (
        f"{fixture['name']}: {birth.tz_name} was {offset:+.4f}h from UTC at "
        f"{birth.local_datetime}, but the engine's Julian Day implies "
        f"{implied:+.4f}h. Never assert a historical offset from memory — "
        f"Kathmandu ran +5:41:16, then +5:30, then +5:45."
    )


def test_ascendant_matches_an_independent_computation(fixture):
    """The rising degree, from spherical trigonometry instead of Swiss Ephemeris.

    The ascendant is checked first when verifying a chart by hand, because if
    it is right the whole-sign house structure is right and most other errors
    become visible.
    """
    birth = birth_of(fixture)
    chart = build_chart(birth, siddhanta_of(fixture))
    theirs = sidereal_ascendant(
        julian_day(birth.local_datetime, birth.tz_name),
        birth.latitude,
        birth.longitude,
        chart.ayanamsa_value,
    )
    ours = chart.lagna_sign_index * 30 + chart.lagna_degree
    off_arcmin = abs((ours - theirs + 180) % 360 - 180) * 60

    assert off_arcmin < ASCENDANT_TOLERANCE_ARCMIN, (
        f"{fixture['name']}: engine has the ascendant at {ours:.5f}°, "
        f"an independent spherical-trig computation at {theirs:.5f}° — "
        f"{off_arcmin:.2f} arcminutes apart."
    )
