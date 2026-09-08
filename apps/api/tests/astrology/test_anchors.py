"""Non-circular sanity anchors.

Golden fixtures catch regressions but cannot establish initial correctness —
they are this engine's own output. These assert against externally-known values
instead, so a fundamentally broken ephemeris setup fails loudly.
"""

from __future__ import annotations

from datetime import datetime

import pytest

from app.astrology_core import ephemeris
from app.astrology_core.constants import DEGREES_PER_NAKSHATRA, VIMSHOTTARI_YEARS
from app.astrology_core.nakshatra import elapsed_fraction, nakshatra_at

J2000 = 2451545.0


def test_j2000_julian_day():
    """J2000.0 is 2000-01-01 12:00 TT ~ 12:00 UT. A JD off by a day means every
    planetary position is off by roughly a degree."""
    jd = ephemeris.julian_day(datetime(2000, 1, 1, 12, 0), "UTC")
    assert jd == pytest.approx(J2000, abs=1e-6)


def test_lahiri_ayanamsa_at_j2000():
    """Lahiri ayanamsa at J2000 is ~23.85 degrees, and grows ~50.3"/year.

    If this is near zero, sidereal mode is not applied and every chart is
    tropical — the most catastrophic possible failure, and an invisible one.
    """
    assert ephemeris.ayanamsa(J2000) == pytest.approx(23.85, abs=0.05)


def test_ayanamsa_precesses_forward():
    per_century = ephemeris.ayanamsa(J2000 + 36525) - ephemeris.ayanamsa(J2000)
    assert per_century == pytest.approx(1.4, abs=0.1)  # ~50.3 arcsec/yr


def test_ketu_is_opposite_rahu():
    # Positions are topocentric now, so they need an observer. Greenwich will
    # do — the identity holds from anywhere, which is the point.
    pos = ephemeris.planet_positions(J2000, latitude=51.48, longitude=0.0)
    delta = (pos["Ketu"].longitude - pos["Rahu"].longitude) % 360.0
    assert delta == pytest.approx(180.0, abs=1e-9)


def test_nakshatra_boundaries():
    assert nakshatra_at(0.0).name == "Ashwini"
    assert nakshatra_at(0.0).pada == 1
    assert nakshatra_at(DEGREES_PER_NAKSHATRA - 1e-9).pada == 4
    assert nakshatra_at(DEGREES_PER_NAKSHATRA).name == "Bharani"
    assert nakshatra_at(359.999999).name == "Revati"
    assert nakshatra_at(360.0).name == "Ashwini"  # wraps, never index 27


def test_nakshatra_lords_follow_vimshottari_order():
    """Ashwini is Ketu's, and the lord cycle repeats every 9 nakshatras."""
    assert nakshatra_at(0.0).lord == "Ketu"
    for i in range(27):
        lon = i * DEGREES_PER_NAKSHATRA + 1.0
        assert nakshatra_at(lon).lord == nakshatra_at(lon + 9 * DEGREES_PER_NAKSHATRA).lord


def test_elapsed_fraction_spans_zero_to_one():
    assert elapsed_fraction(0.0) == pytest.approx(0.0)
    assert elapsed_fraction(DEGREES_PER_NAKSHATRA / 2) == pytest.approx(0.5)
    assert elapsed_fraction(DEGREES_PER_NAKSHATRA - 1e-9) == pytest.approx(1.0, abs=1e-9)


def test_vimshottari_totals_120_years():
    assert sum(VIMSHOTTARI_YEARS.values()) == 120


def test_the_moon_is_topocentric():
    """Parallax, the correction that decides one nakshatra in five.

    The Moon seen from the ground is up to 57 arcminutes from the Moon seen
    from the centre of the Earth. Two hand-cast Nepali kundalis disagreed with
    this engine until it applied this, so a silent revert to geocentric must
    not pass. Two observers far apart must not see the same Moon.
    """
    kathmandu = ephemeris.planet_positions(J2000, latitude=27.7, longitude=85.3)
    santiago = ephemeris.planet_positions(J2000, latitude=-33.4, longitude=-70.6)

    apart = abs(kathmandu["Moon"].longitude - santiago["Moon"].longitude) * 60
    assert apart > 20, (
        f"the Moon is only {apart:.1f} arcmin apart from Kathmandu and Santiago — "
        "that is a geocentric position, and the janma nakshatra will be wrong "
        "for roughly one chart in five"
    )
    # The Sun, by contrast, has 9 arcseconds of parallax: it must barely move.
    sun_apart = abs(kathmandu["Sun"].longitude - santiago["Sun"].longitude) * 3600
    assert sun_apart < 30, f'solar parallax should be arcseconds, got {sun_apart:.1f}"'
