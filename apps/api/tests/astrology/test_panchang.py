"""Panchang and Avakhada, verified against an independent implementation.

Unlike the golden fixtures — which are this engine's own output and therefore
only catch regressions — every expected value below was taken from AstroTalk's
published kundli for the same birth. That makes this file the first genuine
external check in the suite, and the reason it exists is that a chart that is
wrong looks exactly like a chart that is right.

Reference: 11 Jan 2002, 19:30, Lumbini, Nepal (27.4823N, 83.2778E),
Asia/Kathmandu (+05:45 in 2002).
"""

from __future__ import annotations

from datetime import datetime

import pytest

from app.astrology_core import build_chart
from app.astrology_core.avakhada import build_avakhada
from app.astrology_core.models import BirthMoment
from app.astrology_core.panchang import karana, nitya_yoga, tithi

REFERENCE_BIRTH = BirthMoment(
    local_datetime=datetime(2002, 1, 11, 19, 30),
    tz_name="Asia/Kathmandu",
    latitude=27.4823,
    longitude=83.2778,
)


@pytest.fixture(scope="module")
def chart():
    return build_chart(REFERENCE_BIRTH)


# --- what the reference platform publishes ---------------------------------


def test_ascendant_matches_reference(chart) -> None:
    assert chart.lagna_sign == "Cancer"
    assert chart.panchang.ascendant_lord == "Moon"


def test_moon_nakshatra_matches_reference(chart) -> None:
    # The dasha hangs entirely off this, so it is the second thing to check
    # after the ascendant.
    moon = chart.planet("Moon")
    assert moon.nakshatra.name == "Mula"
    assert moon.nakshatra.lord == "Ketu"
    assert moon.nakshatra.pada == 2
    assert moon.sign == "Sagittarius"


def test_panchang_matches_reference(chart) -> None:
    p = chart.panchang
    assert p.paksha == "Krishna"
    assert p.tithi_name == "Chaturdashi"
    assert p.karana == "Vishti"
    assert p.yoga == "Dhruva"


def test_avakhada_matches_reference(chart) -> None:
    a = chart.avakhada
    assert a.varna == "Kshatriya"
    assert a.vashya == "Nara"
    assert a.yoni == "Dog"
    assert a.gana == "Rakshasa"
    assert a.nadi == "Adi"
    assert a.sign == "Sagittarius"
    assert a.sign_lord == "Jupiter"
    assert a.charan == 2
    assert a.tatva == "Fire"
    assert a.name_syllable == "Yo"
    assert a.yunja == "Antya"


def test_sunrise_close_to_reference(chart) -> None:
    """Within a minute of the reference.

    Not exact, and that is expected: implementations differ on limb (upper vs
    centre), refraction model, and observer altitude. A minute of sunrise moves
    nothing except a birth within a minute of dawn.
    """
    sunrise = chart.panchang.sunrise
    assert sunrise is not None
    assert (sunrise.hour, sunrise.minute) == (7, 3)
    sunset = chart.panchang.sunset
    assert sunset is not None
    assert (sunset.hour, sunset.minute) == (17, 36)


# --- rules, independent of the reference ------------------------------------


def test_tithi_spans_the_lunar_month() -> None:
    assert tithi(0.0, 0.0)[:2] == (0, "Pratipada")
    # Purnima is the last tithi of the bright fortnight, ending at exactly 180
    # degrees of elongation — 180 itself is already Krishna Pratipada.
    assert tithi(0.0, 179.9)[1:] == ("Purnima", "Shukla")
    assert tithi(0.0, 180.0)[1:] == ("Pratipada", "Krishna")
    assert tithi(0.0, 359.9)[1:] == ("Amavasya", "Krishna")

    # Full sweep: 30 tithis, 15 per paksha, no gaps.
    seen = [tithi(0.0, e * 12.0 + 1.0) for e in range(30)]
    assert [i for i, _, _ in seen] == list(range(30))
    assert sum(1 for _, _, paksha in seen if paksha == "Shukla") == 15


def test_karana_covers_all_sixty_slots() -> None:
    names = {karana(0.0, i * 6.0 + 0.5) for i in range(60)}
    # Seven movable plus four fixed.
    assert names == {
        "Kimstughna",
        "Bava",
        "Balava",
        "Kaulava",
        "Taitila",
        "Gara",
        "Vanija",
        "Vishti",
        "Shakuni",
        "Chatushpada",
        "Naga",
    }


def test_all_twenty_seven_yogas_are_reachable() -> None:
    assert len({nitya_yoga(0.0, i * 13.5) for i in range(27)}) == 27


def test_every_nakshatra_yields_a_complete_avakhada() -> None:
    for i in range(27):
        for pada in range(4):
            a = build_avakhada(i * (360 / 27) + pada * (360 / 108) + 0.1)
            assert a.yoni and a.gana and a.nadi and a.name_syllable
            assert a.nadi in {"Adi", "Madhya", "Antya"}
            assert a.gana in {"Deva", "Manushya", "Rakshasa"}
            assert 1 <= a.charan <= 4


def test_vedic_day_turns_at_sunrise() -> None:
    """A birth before dawn belongs to the previous weekday. 11 Jan 2002 was a
    Friday; a 4am birth that morning is Vedically Thursday."""
    before = build_chart(
        BirthMoment(
            local_datetime=datetime(2002, 1, 11, 4, 0),
            tz_name="Asia/Kathmandu",
            latitude=27.4823,
            longitude=83.2778,
        )
    )
    assert before.panchang.vara == "Thursday"
    assert build_chart(REFERENCE_BIRTH).panchang.vara == "Friday"


def test_polar_birth_has_no_sunrise() -> None:
    """Tromso in midwinter: the Sun neither rises nor sets. Not an error — the
    chart is still valid, the panchang simply has no sunrise."""
    polar = build_chart(
        BirthMoment(
            local_datetime=datetime(2020, 12, 21, 12, 0),
            tz_name="Europe/Oslo",
            latitude=69.6,
            longitude=18.95,
        )
    )
    assert polar.panchang.sunrise is None
    assert polar.panchang.vara  # still resolves, falling back to the calendar day
