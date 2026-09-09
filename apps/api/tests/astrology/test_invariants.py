"""Structural invariants that must hold for every chart, verified or not.

These catch whole classes of bug that a golden fixture cannot: a golden test
tells you the output changed, these tell you the output is impossible.
"""

from __future__ import annotations

import pytest

from app.astrology_core import build_chart
from app.astrology_core.chart import whole_sign_house
from app.astrology_core.constants import DAYS_PER_YEAR, PLANETS, VIMSHOTTARI_YEARS
from app.astrology_core.models import DashaPeriod

from .conftest import birth_of, siddhanta_of


@pytest.fixture
def chart(fixture):
    return build_chart(birth_of(fixture), siddhanta_of(fixture))


def test_all_nine_grahas_present(chart):
    assert tuple(p.name for p in chart.planets) == PLANETS


def test_longitudes_in_range(chart):
    for p in chart.planets:
        assert 0.0 <= p.longitude < 360.0, p.name
        assert 0 <= p.sign_index <= 11, p.name
        assert 0.0 <= p.degree_in_sign < 30.0, p.name
        assert 1 <= p.house <= 12, p.name
        assert 1 <= p.nakshatra.pada <= 4, p.name


def test_whole_sign_relation_holds_for_every_planet(chart):
    """The defining property of whole-sign houses. If this ever fails, the
    house system silently changed."""
    for p in chart.planets:
        assert p.house == whole_sign_house(p.sign_index, chart.lagna_sign_index), p.name


def test_lagna_is_house_one(chart):
    assert chart.houses[0].sign_index == chart.lagna_sign_index
    assert 0.0 <= chart.lagna_degree < 30.0


def test_house_occupants_match_planets(chart):
    for h in chart.houses:
        expected = {p.name for p in chart.planets if p.house == h.number}
        assert set(h.occupants) == expected, h.number
    assert sum(len(h.occupants) for h in chart.houses) == len(PLANETS)


def test_nodes_are_always_opposed(chart):
    rahu, ketu = chart.planet("Rahu"), chart.planet("Ketu")
    assert (ketu.longitude - rahu.longitude) % 360.0 == pytest.approx(180.0, abs=1e-9)
    assert (ketu.house - rahu.house) % 12 == 6


def test_sun_is_never_combust_or_retrograde(chart):
    sun = chart.planet("Sun")
    assert not sun.combust
    assert not sun.retrograde


def test_nodes_have_no_dignity(chart):
    """A documented decision, not an oversight: classical sources disagree, so
    we report nothing rather than inventing a value the AI would then explain."""
    assert chart.planet("Rahu").dignity is None
    assert chart.planet("Ketu").dignity is None


def test_retrograde_flag_matches_speed(chart):
    for p in chart.planets:
        assert p.retrograde == (p.speed < 0), p.name


# --- dasha -----------------------------------------------------------------


def _walk(periods: tuple[DashaPeriod, ...]):
    for p in periods:
        yield p
        yield from _walk(p.children)


def test_dasha_balance_within_lords_span(chart):
    d = chart.dasha
    assert 0.0 <= d.balance_years <= VIMSHOTTARI_YEARS[d.birth_lord]


def test_birth_lord_matches_moon_nakshatra(chart):
    assert chart.dasha.birth_lord == chart.planet("Moon").nakshatra.lord


def test_first_mahadasha_contains_birth(chart):
    """The mahadasha running at birth started before it — only the balance is
    lived. An off-by-one in the sequence shows up here first."""
    first = chart.dasha.periods[0]
    birth = chart.birth.local_datetime.date()
    assert first.start <= birth < first.end
    assert first.lord == chart.dasha.birth_lord


def test_mahadashas_are_contiguous_and_total_120_years(chart):
    periods = chart.dasha.periods
    for a, b in zip(periods, periods[1:], strict=False):
        assert a.end == b.start, f"gap between {a.lord} and {b.lord}"
    span_days = (periods[-1].end - periods[0].start).days
    assert span_days == pytest.approx(120 * DAYS_PER_YEAR, abs=1)


def test_every_subperiod_lies_inside_its_parent(chart):
    for parent in _walk(chart.dasha.periods):
        for child in parent.children:
            assert parent.start <= child.start < child.end <= parent.end
        for a, b in zip(parent.children, parent.children[1:], strict=False):
            assert a.end == b.start


def test_children_exactly_fill_their_parent(chart):
    """Sub-periods must span the parent with no gap at either end.

    Regression: the first implementation accumulated with `date + timedelta`,
    which discards the fractional day. Every period came out short, and the
    nine mahadashas of one cycle lost exactly four days between them.
    """
    for parent in _walk(chart.dasha.periods):
        if not parent.children:
            continue
        assert parent.children[0].start == parent.start, f"{parent.lord} gap at start"
        assert parent.children[-1].end == parent.end, f"{parent.lord} gap at end"


def test_no_zero_length_periods(chart):
    """The shortest possible pratyantar is Ketu/Ketu/Ketu at ~8.7 days, so a
    zero-length period means truncation, not legitimate rounding."""
    for p in _walk(chart.dasha.periods):
        assert p.end > p.start, f"{p.lord} at level {p.level} has no duration"


def test_dasha_depth_is_three_levels(chart):
    levels = {p.level for p in _walk(chart.dasha.periods)}
    assert levels == {1, 2, 3}


def test_active_at_returns_a_chain(chart):
    birth = chart.birth.local_datetime.date()
    chain = chart.dasha.active_at(birth)
    assert [p.level for p in chain] == [1, 2, 3]
    for p in chain:
        assert p.start <= birth < p.end


# --- determinism -----------------------------------------------------------


def test_same_input_same_output(fixture):
    """Pure function. If this fails, something is reading a clock, a random
    seed, or mutable global state — and prompt caching downstream breaks too."""
    birth = birth_of(fixture)
    a, b = build_chart(birth).to_dict(), build_chart(birth).to_dict()
    a.pop("computed_at"), b.pop("computed_at")
    assert a == b
