"""The patro.

Pinned against a published Nepali calendar for Bhadra 2083, because a patro
that disagrees with the one on the wall is worthless however defensible its
arithmetic. The festival dates below were read off that calendar.
"""

from datetime import date

import pytest

from app.astrology_core import patro


def test_a_day_reads_at_its_own_sunrise() -> None:
    """The Vedic day starts at sunrise, so that is where the tithi is read."""
    d = patro.day(date(2026, 9, 10))
    assert d.sunrise is not None
    assert d.sunrise.hour == 5
    assert d.tithi.name == "Chaturdashi"
    assert d.paksha == "Krishna"


def test_elements_report_when_they_end_and_what_follows() -> None:
    d = patro.day(date(2026, 9, 10))
    for element in (d.tithi, d.nakshatra, d.yoga, d.karana):
        assert element.ends_at is not None, element.name
        assert element.next_name and element.next_name != element.name
        # The boundary must fall after the sunrise it was read from.
        assert element.ends_at > d.sunrise


def test_tithi_and_karana_change_together_at_a_tithi_boundary() -> None:
    """A karana is half a tithi, so every tithi boundary is a karana boundary."""
    d = patro.day(date(2026, 9, 10))
    assert abs((d.tithi.ends_at - d.karana.ends_at).total_seconds()) < 120


def test_positions_are_sidereal_not_tropical() -> None:
    """The whole point of an ayanamsa.

    A well-known Nepali calendar prints Magha and Leo for this date, which are
    the *tropical* Moon's nakshatra and sign — it never subtracts the ayanamsa,
    so its tithi agrees with ours (elongation cancels it) while its nakshatra
    is a full 24 degrees out. This test exists so nobody "fixes" us to match.
    """
    d = patro.day(date(2026, 9, 10))
    assert d.nakshatra.name == "Pushya"
    assert d.moon_sign == "Cancer"


def test_moonrise_and_moonset_are_read() -> None:
    d = patro.day(date(2026, 9, 10))
    assert d.moonrise is not None and d.moonset is not None
    assert d.moonrise.hour == 4
    assert d.moonset.hour == 17


@pytest.mark.parametrize(
    ("on", "festival"),
    [
        (date(2026, 8, 28), "जनै पूर्णिमा"),
        (date(2026, 8, 29), "गाई जात्रा"),
        (date(2026, 9, 4), "कृष्ण जन्माष्टमी"),
        (date(2026, 9, 14), "हरितालिका तीज"),
        (date(2026, 9, 16), "ऋषि पञ्चमी"),
    ],
)
def test_festivals_fall_where_the_published_calendar_puts_them(on: date, festival: str) -> None:
    days = {d.on: d for d in patro.month(date(2026, 8, 26), 24)}
    assert any(festival in f for f in days[on].festivals), days[on].festivals


def test_an_amavasya_belongs_to_the_lunation_it_closes() -> None:
    """A day still running Amavasya at sunrise closes the previous lunar
    month; naming it from that morning's conjunction pushed every amavasya
    festival a month forward."""
    days = {d.on: d for d in patro.month(date(2026, 9, 5), 12)}
    aunsi = days[date(2026, 9, 11)]
    assert aunsi.tithi.name == "Amavasya"
    assert aunsi.festivals, "the aunsi festival went missing"
    assert patro.lunar_month(aunsi.on, aunsi.paksha, "Asia/Kathmandu", "Amavasya") == "Bhadra"


def test_purnimanta_puts_the_dark_fortnight_in_the_next_month() -> None:
    """Janmashtami is Bhadra Krishna Ashtami while the Sun is still in
    Shrawan's sign — the difference between purnimanta and amanta."""
    d = patro.day(date(2026, 9, 4))
    assert d.paksha == "Krishna"
    assert d.masa == "Shrawan"  # solar
    assert patro.lunar_month(d.on, d.paksha, "Asia/Kathmandu", d.tithi.name) == "Bhadra"
