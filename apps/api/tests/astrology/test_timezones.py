"""Historical timezone resolution.

Not circular: these offsets come from the IANA database, independent of our
engine. If these fail, every chart for those eras is silently wrong.
"""

from __future__ import annotations

from datetime import UTC, datetime, timedelta, timezone

import pytest

from app.astrology_core.ephemeris import to_utc


def offset(local: str, tz: str) -> timedelta:
    dt = datetime.fromisoformat(local)
    return dt - to_utc(dt, tz).replace(tzinfo=None)


@pytest.mark.parametrize(
    ("local", "tz", "expected", "why"),
    [
        (
            "1910-06-15T08:30",
            "Asia/Kathmandu",
            timedelta(hours=5, minutes=41, seconds=16),
            "Nepal ran local mean time until 1920",
        ),
        (
            "1975-06-15T08:30",
            "Asia/Kathmandu",
            timedelta(hours=5, minutes=30),
            "Nepal was +5:30 until 1986",
        ),
        (
            "1995-06-15T08:30",
            "Asia/Kathmandu",
            timedelta(hours=5, minutes=45),
            "Nepal moved to +5:45 in 1986",
        ),
        (
            "1942-09-01T06:00",
            "Asia/Kolkata",
            timedelta(hours=6, minutes=30),
            "India ran wartime +6:30 from Sep 1942",
        ),
        ("1990-06-15T12:00", "Asia/Kolkata", timedelta(hours=5, minutes=30), "modern IST"),
    ],
)
def test_historical_offsets(local, tz, expected, why):
    assert offset(local, tz) == expected, why


def test_a_stored_offset_would_be_wrong():
    """The whole reason birth_profile stores tz_name and not a UTC offset.

    Assume '+05:45 always' for Nepal and a 1975 birth lands a quarter hour off.
    Fifteen minutes is about 3.75 degrees of ascendant motion, so roughly one
    birth in eight gets the wrong lagna sign — and therefore every wrong house.
    """
    dt = datetime(1975, 6, 15, 8, 30)
    correct = to_utc(dt, "Asia/Kathmandu")
    naive = dt.replace(tzinfo=timezone(timedelta(hours=5, minutes=45))).astimezone(UTC)
    assert correct - naive == timedelta(minutes=15)


def test_rejects_aware_datetime():
    with pytest.raises(ValueError, match="naive"):
        to_utc(datetime(1990, 1, 1, tzinfo=UTC), "Asia/Kathmandu")
