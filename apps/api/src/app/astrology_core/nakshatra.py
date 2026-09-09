"""Nakshatra, pada, and the vimshottari lord. Pure arithmetic on a longitude."""

from __future__ import annotations

from collections.abc import Callable
from datetime import datetime, timedelta

from app.astrology_core.constants import (
    DEGREES_PER_NAKSHATRA,
    DEGREES_PER_PADA,
    NAKSHATRAS,
    VIMSHOTTARI_ORDER,
)
from app.astrology_core.models import NakshatraPosition


def nakshatra_at(longitude: float) -> NakshatraPosition:
    lon = longitude % 360.0
    index = int(lon // DEGREES_PER_NAKSHATRA)
    # Guard the 359.999... case: floor could yield 27 with float error.
    index = min(index, 26)
    offset = lon - index * DEGREES_PER_NAKSHATRA
    pada = min(int(offset // DEGREES_PER_PADA) + 1, 4)
    return NakshatraPosition(
        index=index,
        name=NAKSHATRAS[index],
        pada=pada,
        lord=VIMSHOTTARI_ORDER[index % 9],
    )


def elapsed_fraction(longitude: float) -> float:
    """How far through its nakshatra a longitude sits, in [0, 1).

    This is the whole basis of the dasha balance at birth, so it is separated
    out and tested on its own.
    """
    lon = longitude % 360.0
    return (lon % DEGREES_PER_NAKSHATRA) / DEGREES_PER_NAKSHATRA


def transit(moon_at: Callable[[datetime], float], moment: datetime) -> tuple[datetime, datetime]:
    """When the Moon entered the nakshatra it is in, and when it leaves.

    A panchanga states these two as भुक्त and भभोग — elapsed and total, in
    ghatis — and computes the dasha balance from their ratio. That ratio is a
    ratio of *time*, and the Moon does not cross a nakshatra at a constant
    speed, so it is not the same as the fraction of the arc traversed. The
    difference is small, but the time figure is the one a guru writes down and
    the one a reader can check us against.

    `moon_at` is passed in rather than imported so this stays independent of
    which siddhanta is in use.
    """
    here = moon_at(moment)
    start_of = (here // DEGREES_PER_NAKSHATRA) * DEGREES_PER_NAKSHATRA

    def crossing(target: float, before: datetime, after: datetime) -> datetime:
        # Bisect on "is the Moon still behind `target`", which is well-defined
        # across the 360-degree wrap in a way that a raw comparison is not.
        for _ in range(60):
            middle = before + (after - before) / 2
            if (moon_at(middle) - target) % 360.0 > 180.0:
                before = middle
            else:
                after = middle
        return before

    window = timedelta(days=2)  # a nakshatra takes about one day to cross
    return (
        crossing(start_of, moment - window, moment),
        crossing(start_of + DEGREES_PER_NAKSHATRA, moment, moment + window),
    )
