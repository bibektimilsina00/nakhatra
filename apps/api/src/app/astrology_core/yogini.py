"""Yogini dasha — the eight yoginis, thirty-six years.

A second timing scheme, read alongside vimshottari rather than instead of it.
Where vimshottari keys nine grahas to a 120-year cycle, this keys eight
yoginis to a 36-year one, so it repeats three times inside a long life and is
used for finer timing.

The order and the year-counts are fixed and are simply 1 through 8. Which
yogini a person starts in comes from the janma nakshatra:

    start = (nakshatra number + 3) mod 8      (0 means Sankata, the eighth)

Confirmed against a hand-cast Nepali kundali: Magha is the tenth nakshatra,
(10 + 3) mod 8 = 5, and the guru's printed योगिनी महादशा table begins at
Bhadrika — the fifth — running 5, 6, 7, 8, 1, 2, 3, 4 and cumulating to 36.

The balance at birth is the unelapsed part of the nakshatra, exactly as in
vimshottari: the same Moon, a different cycle laid over it.
"""

from __future__ import annotations

from datetime import datetime, timedelta

from app.astrology_core.constants import DAYS_PER_YEAR
from app.astrology_core.models import Dasha, DashaPeriod
from app.astrology_core.nakshatra import elapsed_fraction, nakshatra_at

#: (name, years, ruling graha) in cycle order. The years are the position.
YOGINIS: tuple[tuple[str, int, str], ...] = (
    ("Mangala", 1, "Moon"),
    ("Pingala", 2, "Sun"),
    ("Dhanya", 3, "Jupiter"),
    ("Bhramari", 4, "Mars"),
    ("Bhadrika", 5, "Mercury"),
    ("Ulka", 6, "Saturn"),
    ("Siddha", 7, "Venus"),
    ("Sankata", 8, "Rahu"),
)

CYCLE_YEARS = 36  # 1+2+3+4+5+6+7+8


def starting_index(nakshatra_number: int) -> int:
    """Zero-based index into `YOGINIS` for a 1-based nakshatra number."""
    # The classical rule is stated 1-based with 0 meaning the eighth; expressed
    # zero-based it is just this, with no special case to forget.
    return (nakshatra_number + 2) % 8


def build_yogini(moon_longitude: float, birth: datetime, cycles: int = 3) -> Dasha:
    """The yogini tree. Three cycles covers 108 years, so a whole life.

    Sub-periods divide a mahadasha in the same eight-fold order beginning with
    itself, each in proportion to its own years — the same shape vimshottari
    uses, against 36 rather than 120.
    """
    position = nakshatra_at(moon_longitude)
    start = starting_index(position.index + 1)
    elapsed = elapsed_fraction(moon_longitude)

    first_name, first_years, _ = YOGINIS[start]
    balance_years = first_years * (1.0 - elapsed)

    # The yogini running at birth began before it; only the balance is lived.
    cursor = birth - timedelta(days=first_years * elapsed * DAYS_PER_YEAR)

    periods: list[DashaPeriod] = []
    for step in range(8 * cycles):
        name, years, _lord = YOGINIS[(start + step) % 8]
        end = cursor + timedelta(days=years * DAYS_PER_YEAR)
        periods.append(
            DashaPeriod(
                lord=name,
                start=cursor.date(),
                end=end.date(),
                level=1,
                children=_subdivide(start + step, years, cursor, end),
            )
        )
        cursor = end

    return Dasha(birth_lord=first_name, balance_years=balance_years, periods=tuple(periods))


def _subdivide(
    parent: int, parent_years: float, start: datetime, end: datetime
) -> tuple[DashaPeriod, ...]:
    periods: list[DashaPeriod] = []
    cursor = start
    for step in range(8):
        name, years, _lord = YOGINIS[(parent + step) % 8]
        share = parent_years * years / CYCLE_YEARS
        # The last child is snapped to the parent's end so float drift can
        # never leave a gap at the boundary.
        child_end = end if step == 7 else cursor + timedelta(days=share * DAYS_PER_YEAR)
        periods.append(
            DashaPeriod(lord=name, start=cursor.date(), end=child_end.date(), level=2)
        )
        cursor = child_end
    return tuple(periods)
