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


# --- wall-clock readings that are not a moment -----------------------------


def test_a_repeated_hour_is_flagged():
    """A DST fall-back hour happens twice, and the chart says so.

    Resolving silently is the failure this engine exists to avoid: the chart
    comes out confident and up to an hour wrong, which is fifteen degrees of
    ascendant and often a different lagna sign.
    """
    from app.astrology_core.ephemeris import local_time_anomaly

    warning = local_time_anomaly(datetime(2023, 11, 5, 1, 30), "America/New_York")
    assert warning is not None
    assert "occurred twice" in warning
    assert "UTC-04:00" in warning and "UTC-05:00" in warning


def test_a_skipped_hour_is_flagged_as_skipped_not_repeated():
    """At a spring-forward gap both folds report different offsets too, so the
    ambiguity test must not run first or every skipped hour reads as repeated."""
    from app.astrology_core.ephemeris import local_time_anomaly

    warning = local_time_anomaly(datetime(2023, 3, 12, 2, 30), "America/New_York")
    assert warning is not None
    assert "never happened" in warning
    assert "occurred twice" not in warning


def test_ordinary_births_carry_no_warning():
    """The flag is worthless if it cries wolf. Nepal's own offset changes are
    not DST and must stay silent."""
    from app.astrology_core.ephemeris import local_time_anomaly

    for when, tz in (
        (datetime(2023, 7, 4, 12, 0), "America/New_York"),
        (datetime(1975, 11, 23, 20, 18), "Asia/Kathmandu"),
        (datetime(1985, 12, 31, 23, 59), "Asia/Kathmandu"),
        (datetime(1986, 1, 1, 0, 20), "Asia/Kathmandu"),
        (datetime(2004, 8, 17, 7, 40), "Asia/Kathmandu"),
    ):
        assert local_time_anomaly(when, tz) is None, f"false positive for {when} {tz}"


def test_a_day_with_no_sunrise_says_the_vara_is_a_convention():
    """Above the arctic circle the Vedic day has nothing to turn on."""
    from app.astrology_core import build_chart
    from app.astrology_core.models import BirthMoment

    chart = build_chart(
        BirthMoment(
            local_datetime=datetime(2000, 6, 21, 12, 0),
            tz_name="UTC",
            latitude=78.0,
            longitude=15.0,
            time_accuracy="exact",
        )
    )
    assert chart.panchang.sunrise is None
    assert any("no sunrise" in w for w in chart.time_warnings)
    # It still produces a chart — refusing is worse than saying why.
    assert chart.lagna_sign


def test_nepals_own_1986_change_opens_a_gap_too():
    """The detector is not just about DST — and this is the case rule 5 is for.

    Nepal moved +5:30 to +5:45 at midnight on 1 January 1986, so the clock
    jumped straight from 00:00 to 00:15. Every wall-clock reading in that
    quarter hour is a time no clock in the country ever showed. A birth
    recorded there is a transcription error, and the chart must say so rather
    than quietly resolve it.
    """
    from app.astrology_core.ephemeris import local_time_anomaly

    for minute in (0, 5, 14):
        warning = local_time_anomaly(datetime(1986, 1, 1, 0, minute), "Asia/Kathmandu")
        assert warning is not None and "never happened" in warning, (
            f"00:{minute:02d} on 1986-01-01 did not exist in Kathmandu"
        )

    # A minute either side of the gap is an ordinary moment.
    assert local_time_anomaly(datetime(1985, 12, 31, 23, 59), "Asia/Kathmandu") is None
    assert local_time_anomaly(datetime(1986, 1, 1, 0, 15), "Asia/Kathmandu") is None
