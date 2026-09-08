"""Vimshottari dasha.

120-year cycle keyed to the Moon's nakshatra at birth. Three levels:
mahadasha -> antardasha -> pratyantardasha.

Period arithmetic uses a fixed 365.25-day year (constants.DAYS_PER_YEAR).
Other software uses other conventions; dates will differ by days. Ours is
stated rather than accidental.

All internal arithmetic is in `datetime`, converted to `date` exactly once at
the boundary. Accumulating in `date` instead silently truncates every
fractional day: a Ketu mahadasha of 2556.75 days advances the cursor by 2556,
and across one 120-year cycle the nine truncations lose exactly four days.
At the pratyantar level the same truncation is proportionally far worse.
"""

from __future__ import annotations

from datetime import datetime, timedelta

from app.astrology_core.constants import (
    DAYS_PER_YEAR,
    VIMSHOTTARI_ORDER,
    VIMSHOTTARI_YEARS,
)
from app.astrology_core.models import Dasha, DashaPeriod
from app.astrology_core.nakshatra import elapsed_fraction, nakshatra_at

MAX_LEVEL = 3

#: Tribhagi is vimshottari with a third taken off every period — the same
#: nakshatra lords, the same order, a 80-year cycle instead of 120. Confirmed
#: against a hand-cast Nepali kundali whose printed त्रिभागी table cumulates to
#: exactly 80 and gives Venus 13y 4m against vimshottari's 20y.
TRIBHAGI_SCALE = 2.0 / 3.0


def _years_to_delta(years: float) -> timedelta:
    return timedelta(days=years * DAYS_PER_YEAR)


def _sequence_from(lord: str) -> list[str]:
    start = VIMSHOTTARI_ORDER.index(lord)
    return [VIMSHOTTARI_ORDER[(start + i) % 9] for i in range(9)]


def _subdivide(
    parent_lord: str,
    parent_years: float,
    start: datetime,
    end: datetime,
    level: int,
) -> tuple[DashaPeriod, ...]:
    """Sub-periods run in vimshottari order beginning with the parent's own lord,
    each proportional to its share of the 120-year cycle.

    The final child's end is snapped to the parent's end, so accumulated float
    error can never leave a gap at the boundary.
    """
    if level > MAX_LEVEL:
        return ()
    periods: list[DashaPeriod] = []
    cursor = start
    sequence = _sequence_from(parent_lord)
    last = len(sequence) - 1
    for i, lord in enumerate(sequence):
        # The child's share of its parent is a *ratio*, so it is unaffected by
        # the scale — tribhagi subdivides in the same proportions.
        years = parent_years * VIMSHOTTARI_YEARS[lord] / 120.0
        child_end = end if i == last else cursor + _years_to_delta(years)
        periods.append(
            DashaPeriod(
                lord=lord,
                start=cursor.date(),
                end=child_end.date(),
                level=level,
                children=_subdivide(lord, years, cursor, child_end, level + 1),
            )
        )
        cursor = child_end
    return tuple(periods)


def build_dasha(
    moon_longitude: float,
    birth: datetime,
    cycles: int = 1,
    scale: float = 1.0,
) -> Dasha:
    """Full vimshottari tree.

    `birth` is the local birth moment, not just the date — a mahadasha boundary
    is a moment, and rounding to midnight before the arithmetic shifts every
    downstream period.

    `cycles` is how many 120-year cycles to generate. One covers a human
    lifetime; the parameter exists so the bound is explicit rather than an
    accident of the loop.

    `scale` multiplies every period. 1.0 is vimshottari; `TRIBHAGI_SCALE`
    gives the 80-year tribhagi, which is the same scheme run faster and is
    read alongside it rather than instead of it.
    """
    lord = nakshatra_at(moon_longitude).lord
    total_years = float(VIMSHOTTARI_YEARS[lord]) * scale
    elapsed = elapsed_fraction(moon_longitude)
    balance_years = total_years * (1.0 - elapsed)

    # The mahadasha running at birth started before it; only the balance is lived.
    cursor = birth - _years_to_delta(total_years * elapsed)

    periods: list[DashaPeriod] = []
    order = _sequence_from(lord)
    for i in range(9 * cycles):
        current = order[i % 9]
        years = float(VIMSHOTTARI_YEARS[current]) * scale
        end = cursor + _years_to_delta(years)
        periods.append(
            DashaPeriod(
                lord=current,
                start=cursor.date(),
                end=end.date(),
                level=1,
                children=_subdivide(current, years, cursor, end, level=2),
            )
        )
        cursor = end

    return Dasha(birth_lord=lord, balance_years=balance_years, periods=tuple(periods))


def build_tribhagi(moon_longitude: float, birth: datetime, cycles: int = 1) -> Dasha:
    """The 80-year tribhagi, keyed to the same janma nakshatra."""
    return build_dasha(moon_longitude, birth, cycles, scale=TRIBHAGI_SCALE)
