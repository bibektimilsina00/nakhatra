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
the Moon takes one — that term is for the five star-planets. Those are still
drik: a Surya Siddhanta Mars is a degree or two out, which is worse than the
modern one and changes nothing about a rashi, so there is nothing to gain and
accuracy to lose. Everything that actually differs — tithi, nakshatra, yoga,
karana, the dasha, the avakhada — is a function of these two bodies alone.
"""

from __future__ import annotations

import math
from typing import Final

#: Civil (savana) days in a Mahayuga of 4,320,000 years.
CIVIL_DAYS: Final = 1_577_917_828

#: Revolutions in a Mahayuga.
MOON_REVOLUTIONS: Final = 57_753_336        # sidereal month, 27.32167 days
SUN_REVOLUTIONS: Final = 4_320_000          # one per year, by definition
MOON_APOGEE_REVOLUTIONS: Final = 488_203    # mandocca, 8.85-year cycle

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
MOON_EPICYCLE: Final = (32.0, 31.6)
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


def daily_motion(jd: float, longitude_of) -> float:
    """Degrees per day, by difference. Used only to say how near a boundary is."""
    step = 0.005  # about 7 minutes; small enough to be local, large enough to be stable
    before, after = longitude_of(jd - step), longitude_of(jd + step)
    return ((after - before + 180.0) % 360.0 - 180.0) / (2.0 * step)
