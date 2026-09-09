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
    pos = ephemeris.planet_positions(J2000)
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


def test_positions_are_geocentric():
    """The Moon must not depend on where the observer stands.

    This was topocentric for one commit, on evidence from a single hand-cast
    kundali. Across three of them the two conventions score 16/27 and 17/27 —
    parallax is not constant (+53', +54' and -36' on those three), so it fixes
    one chart and breaks another. `planet_positions` takes no observer for
    exactly that reason, and this test is here so the choice stays deliberate.
    """
    import inspect

    params = set(inspect.signature(ephemeris.planet_positions).parameters)
    assert params == {"jd"}, (
        f"planet_positions grew {sorted(params - {'jd'})} — if that is a "
        "topocentric correction, read its docstring first: it was tried and "
        "measured worse against four hand-cast kundalis."
    )


def test_surya_siddhantas_year_is_long_and_its_frame_slips():
    """The known, unfixed limitation of using Surya Siddhanta uncorrected.

    Its sidereal year is 365.258756 days against a true 365.256363 — long by
    about three and a half minutes. So its zero point falls behind the star
    frame at roughly 8.5 arcseconds a year: a quarter degree per millennium's
    tenth, 14 arcminutes per century, 2.4 degrees per thousand years.

    This is the text's, not ours. It is also the whole reason the living
    tradition never used raw Surya Siddhanta: practitioners applied बीज (bija)
    corrections to the mean motions to absorb exactly this. The bija stanzas
    are not in Burgess's translation — they survive as twenty-one later verses
    in a Bengali edition, between XIV.23 and XIV.24 — and no published set of
    values has been found to implement, so none is applied here. Fitting one
    to the four hand-cast charts would reproduce them and mean nothing.

    The test exists so the limitation is a measured number in the suite rather
    than a remark in a docstring. If someone applies a bija, this fails, and
    the commit that changes it has to say which source the values came from.
    """
    from app.astrology_core.surya import CIVIL_DAYS, SUN_REVOLUTIONS

    ss_year = CIVIL_DAYS / SUN_REVOLUTIONS
    true_sidereal_year = 365.256363004
    slip_arcsec_per_year = (ss_year - true_sidereal_year) / true_sidereal_year * 360 * 3600

    assert ss_year == pytest.approx(365.258756, abs=1e-6)
    assert slip_arcsec_per_year == pytest.approx(8.49, abs=0.05), (
        "The Surya Siddhanta year length changed. That is the parameter the "
        "whole system's frame rests on, so this is either a typo or a bija."
    )

    # Over the range of births the product actually serves, the slip stays
    # under half a degree — small against Surya Siddhanta's own 1.4 degree
    # Moon error, which is why it is documented rather than papered over.
    century_slip = abs(slip_arcsec_per_year * 100 / 3600)
    assert century_slip < 0.5, "a century of slip should stay under half a degree"
