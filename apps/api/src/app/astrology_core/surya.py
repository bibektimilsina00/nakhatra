"""सूर्य सिद्धान्त — the Sun and Moon by the traditional system.

Nepali kundalis are cast from a Surya Siddhanta panchanga, not from a modern
ephemeris, and the two disagree by enough to matter. Measured against four
charts hand-cast in Parbat and Kaski, this system reproduces them where the
modern one does not: 24 of 27 checked values against 16, and one of the four
becomes exact.

The difference is small and it is not a bias that can be faked with an offset.
Against Swiss Ephemeris over 1970-2010 this Moon has an RMS of 1.43 degrees
and this Sun 0.335 — which is precisely the accuracy Surya Siddhanta is known
to have, and the best evidence that the implementation is right rather than
merely tuned. It is *less* accurate than the modern ephemeris as astronomy.
That is the point: it is the almanac Nepali astrology is actually written in.

How it works, in the text's own terms:

  ahargana   days elapsed since the Kali epoch, reckoned at Ujjain
  mean       revolutions in a Mahayuga, prorated over the ahargana
  manda      the equation of centre, from an epicycle whose circumference
             is given in degrees and interpolated across the quadrants

There is no shighra (conjunction) correction here because neither the Sun nor
the Moon takes one — that term is for the five star-planets. Those are
deliberately left drik, and that was measured rather than assumed. Surya
Siddhanta star-planets were implemented in full (manda and shighra, the
four-step process of II.43-45) and checked against the two hand-cast graha
sphuta tables we can read to the arcsecond. They lose:

  Venus and Mars   Surya Siddhanta is nearer — Venus by 26 arcseconds against
                   the 2004 table, which is a striking match
  Jupiter          Surya Siddhanta puts it in Virgo; the guru writes Leo
  Mars (2002)      Surya Siddhanta puts it in Aquarius; the guru writes Pisces
  Saturn           5.3 degrees out, its documented weak point

A wrong rashi is a worse error than any number of arcminutes, and drik gets
every star-planet sign right in both charts and their degrees to about a
degree. So the split is not a compromise: the Sun and Moon are Surya
Siddhanta because the panchanga is reckoned from them and it matches across
all four charts, and the star-planets are drik because that is what the
practitioners' own tables agree with. The test named for the graha sphuta
table holds the second half of that in place.
"""

from __future__ import annotations

import math
from typing import Final

# What is deliberately NOT corrected here
# ---------------------------------------
# This system's sidereal year is 365.258756 days against a true 365.256363 —
# long by about three and a half minutes. Its zero point therefore falls
# behind the star frame at ~8.5 arcseconds a year: 14 arcminutes per century,
# 2.4 degrees per millennium. Measured against Swiss Ephemeris the Sun's bias
# runs -0.10 degrees in the 1900s, -0.34 in the 2000s, -0.46 by the 2050s.
#
# That is the text's limitation, and it is exactly why the living tradition
# never used raw Surya Siddhanta: practitioners applied बीज (bija) corrections
# to the mean motions to absorb it. Kapoor notes the text itself "spoke of
# bija corrections to be applied", and Graha Laghava (Ganesha Daivajna, 1520),
# a bija-corrected derivative, carries a Sun error of 0 degrees 0 minutes —
# the drift below, already removed.
#
# No bija is applied here because none could be sourced. The stanzas are not
# in Burgess's translation; they survive as twenty-one later verses in a
# Bengali edition between XIV.23 and XIV.24, and no published table of values
# has been found. A bija fitted to the four hand-cast charts would reproduce
# them and prove nothing, which is the one thing this engine must not do.
#
# It is left uncorrected on evidence, not by default: raw Surya Siddhanta is
# what matches all four charts on every panchanga value we can check. If a
# guru names the almanac he casts from, that settles it and this changes.
# `test_surya_siddhantas_year_is_long_and_its_frame_slips` holds the number.

#: Civil (savana) days in a Mahayuga of 4,320,000 years.
CIVIL_DAYS: Final = 1_577_917_828

#: Revolutions in a Mahayuga.
MOON_REVOLUTIONS: Final = 57_753_336        # sidereal month, 27.32167 days
SUN_REVOLUTIONS: Final = 4_320_000          # one per year, by definition
MOON_APOGEE_REVOLUTIONS: Final = 488_203    # mandocca, 8.85-year cycle
JUPITER_REVOLUTIONS: Final = 364_220        # 11.86 years — the samvatsara cycle

#: Which samvatsara name Jupiter-year zero carries. The cycle of sixty is a
#: naming convention, so its phase has to be anchored on something; this is
#: anchored on three kundalis hand-cast in Parbat, which agree on it. Unlike a
#: fixed offset from the Shaka year, a phase does not decay — it is the same
#: number in 1900 and in 2200.
BARHASPATYA_PHASE: Final = 25

#: Julian Day of the Kali epoch — midnight at Ujjain, 18 February 3102 BCE.
KALI_EPOCH_JD: Final = 588_465.5

#: Ujjain, the meridian the ahargana is reckoned from.
UJJAIN_LONGITUDE: Final = 75.7683

#: Where the Moon's apogee stood at the Kali epoch. The Sun's mandocca is
#: fixed in this system; the Moon's moves, so it needs a starting point.
MOON_APOGEE_AT_EPOCH: Final = 90.0

#: The Sun's mandocca, which Surya Siddhanta treats as stationary.
SUN_APOGEE: Final = 77.0 + 17.0 / 60.0

#: Manda epicycle circumferences, in degrees, at the ends of the even and odd
#: quadrants (SS II.34-38). The value between them is interpolated.
MOON_EPICYCLE: Final = (32.0, 31.0 + 40.0 / 60.0)
SUN_EPICYCLE: Final = (14.0, 13.0 + 40.0 / 60.0)


def ahargana(jd: float) -> float:
    """Days since the Kali epoch, at Ujjain rather than at Greenwich."""
    return (jd + UJJAIN_LONGITUDE / 360.0) - KALI_EPOCH_JD


def _mean(revolutions: int, days: float) -> float:
    return (revolutions * days / CIVIL_DAYS * 360.0) % 360.0


def _manda(mean: float, apogee: float, epicycle: tuple[float, float]) -> float:
    """Apply the equation of centre.

    The epicycle's circumference is stated at the quadrant ends and varies
    between them, so it is interpolated on |sin| of the anomaly — which is
    also the term the correction itself is proportional to.
    """
    even, odd = epicycle
    kendra = math.radians(mean - apogee)
    circumference = even - (even - odd) * abs(math.sin(kendra))
    correction = math.degrees(math.asin((circumference / 360.0) * math.sin(kendra)))
    return (mean - correction) % 360.0


def moon_longitude(jd: float) -> float:
    """Sidereal longitude of the Moon, by Surya Siddhanta."""
    days = ahargana(jd)
    apogee = (_mean(MOON_APOGEE_REVOLUTIONS, days) + MOON_APOGEE_AT_EPOCH) % 360.0
    return _manda(_mean(MOON_REVOLUTIONS, days), apogee, MOON_EPICYCLE)


def sun_longitude(jd: float) -> float:
    """Sidereal longitude of the Sun, by Surya Siddhanta."""
    return _manda(_mean(SUN_REVOLUTIONS, ahargana(jd)), SUN_APOGEE, SUN_EPICYCLE)


def barhaspatya_year(jd: float) -> int:
    """Elapsed Barhaspatya (Jupiter) years since the Kali epoch.

    The sixty-year samvatsara cycle is Jupiter's, not the Sun's: one
    samvatsara is one sign of Jupiter's mean motion, about 361.02 days. That
    is four days short of a solar year, so the two reckonings separate by a
    whole samvatsara roughly every eighty-five years — the kshaya, the
    expunged year.

    This is why the samvatsara cannot be a fixed offset from the Shaka year.
    An offset fitted in one era reads correctly for a few decades either side
    and then silently names the wrong year: measured against this function,
    a fixed offset drifts from a lead of 11 in 1900 to 15 by 2200.
    """
    return math.floor((JUPITER_REVOLUTIONS * ahargana(jd) / CIVIL_DAYS) * 12.0)


def daily_motion(jd: float, longitude_of) -> float:
    """Degrees per day, by difference. Used only to say how near a boundary is."""
    step = 0.005  # about 7 minutes; small enough to be local, large enough to be stable
    before, after = longitude_of(jd - step), longitude_of(jd + step)
    return ((after - before + 180.0) % 360.0 - 180.0) / (2.0 * step)
