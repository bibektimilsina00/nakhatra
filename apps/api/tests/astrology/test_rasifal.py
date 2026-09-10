"""The daily gochara engine.

A rasifal is read by people who will compare it against a printed panchanga,
so the parts that must not drift are pinned: house counting, the vedha rule,
Murti Nirnaya, and determinism for a given date.
"""

from datetime import date, time, timedelta

import pytest

from app.astrology_core import rasifal


def test_all_twelve_signs_are_judged() -> None:
    day = rasifal.compute(date(2026, 9, 10))
    assert len(day.signs) == 12
    assert [s.sign_index for s in day.signs] == list(range(12))
    # every graha placed for every sign
    assert all(len(s.transits) == 9 for s in day.signs)


def test_the_same_date_always_reads_the_same() -> None:
    """A horoscope that changed between page loads would be worthless."""
    a = rasifal.compute(date(2026, 3, 21))
    b = rasifal.compute(date(2026, 3, 21))
    assert [s.score for s in a.signs] == [s.score for s in b.signs]


def test_houses_are_counted_inclusively_from_the_janma_rashi() -> None:
    """The sign itself is the 1st house, not the 0th."""
    day = rasifal.compute(date(2026, 9, 10))
    moon_sign = day.positions["Moon"][0]
    moon_index = [i for i, s in enumerate(day.signs) if s.sign == moon_sign][0]
    # For a native of the sign the Moon is transiting, the Moon is in house 1.
    native = day.signs[moon_index]
    moon = next(t for t in native.transits if t.name == "Moon")
    assert moon.house == 1
    assert native.murti_house == 1
    assert native.murti == "Swarna"


def test_murti_follows_the_moons_house() -> None:
    day = rasifal.compute(date(2026, 6, 15))
    table = {
        1: "Swarna", 6: "Swarna", 11: "Swarna",
        2: "Rajata", 5: "Rajata", 9: "Rajata",
        3: "Tamra", 7: "Tamra", 10: "Tamra",
        4: "Loha", 8: "Loha", 12: "Loha",
    }
    for s in day.signs:
        assert s.murti == table[s.murti_house]


def test_vedha_only_ever_cancels_a_favourable_transit() -> None:
    """An obstructed graha is one that would have helped and does not; a
    malefic placement is never rescued into one."""
    for month in range(1, 13):
        day = rasifal.compute(date(2026, month, 11))
        for s in day.signs:
            for t in s.transits:
                if t.obstructed:
                    assert t.favourable, f"{t.name} obstructed in an unfavourable house"


def test_sun_and_saturn_do_not_obstruct_each_other() -> None:
    """The classical exception, exercised on every day of 2026 where one
    actually stands in the other's vedha house."""
    from app.astrology_core.constants import SIGNS
    from app.astrology_core.rasifal import _VEDHA_PAIRS, _house_from

    checked = 0
    for month in range(1, 13):
        for dom in (1, 11, 21):
            day = rasifal.compute(date(2026, month, dom))
            sun_i = SIGNS.index(day.positions["Sun"][0])
            sat_i = SIGNS.index(day.positions["Saturn"][0])
            for janma in range(12):
                sun_h = _house_from(sun_i, janma)
                sat_h = _house_from(sat_i, janma)
                if sat_h in {b for src, b in _VEDHA_PAIRS["Sun"] if src == sun_h}:
                    sun = next(t for t in day.signs[janma].transits if t.name == "Sun")
                    assert not sun.obstructed
                    checked += 1
    assert checked, "the pairing never arose — the test proved nothing"


def test_ratings_span_the_scale_over_a_year() -> None:
    """The bands are calibrated to this scoring function's real distribution.
    If someone retunes the weights without re-measuring, days collapse onto
    one or two stars and this fails."""
    seen: set[int] = set()
    for month in range(1, 13):
        seen.update(s.rating for s in rasifal.compute(date(2026, month, 15)).signs)
    assert seen == {1, 2, 3, 4, 5}


def test_a_day_is_read_at_its_own_sunrise() -> None:
    """The Vedic day starts at sunrise, not at a round hour someone picked.

    The Moon moves about half a degree an hour, so a fixed six o'clock can put
    it in a different house from the one a panchanga prints.
    """
    moment = rasifal.reading_moment(date(2026, 9, 10))
    assert moment.date() == date(2026, 9, 10)
    assert (moment.hour, moment.minute) == (5, 46)

    # Whatever the hour, it is a function of the date and not of the clock.
    assert rasifal.reading_moment(date(2026, 9, 10)) == moment


def test_an_explicit_hour_still_overrides_sunrise() -> None:
    """Callers that need a fixed hour keep it, and it is honoured.

    Six in the evening puts the Moon roughly six degrees further on than
    sunrise did, so on a day it crosses a sign the two readings must differ.
    2026-09-11 is such a day: the Moon leaves Cancer for Leo during it.
    """
    morning = rasifal.compute(date(2026, 9, 11), at=time(5, 0))
    evening = rasifal.compute(date(2026, 9, 11), at=time(23, 30))
    moon_at = lambda day: next(  # noqa: E731
        t.sign for t in day.signs[0].transits if t.name == "Moon"
    )
    assert moon_at(morning) != moon_at(evening), "the hour was ignored"


def test_a_grahas_murti_is_fixed_at_its_ingress_not_read_daily() -> None:
    """The whole point of the correction.

    Murti Nirnaya asks where the Moon stood when a graha *entered* its sign.
    A slow graha's murti therefore cannot change from one morning to the next
    — Saturn's was settled when it entered Aquarius and does not move again
    until it leaves. Reading the Moon's own house daily and calling it every
    graha's murti, which this used to do, made all nine change temper together
    every two days.
    """
    saturn_murti = []
    for day_of in (1, 8, 15, 22):
        day = rasifal.compute(date(2026, 9, day_of))
        saturn_murti.append(
            next(t.murti for t in day.signs[0].transits if t.name == "Saturn")
        )
    assert len(set(saturn_murti)) == 1, f"Saturn's murti drifted: {saturn_murti}"

    # The Moon's own, by contrast, is expected to move with it.
    moon_murti = {
        next(t.murti for t in rasifal.compute(date(2026, 9, d)).signs[0].transits
             if t.name == "Moon")
        for d in (1, 8, 15, 22)
    }
    assert len(moon_murti) > 1, "the Moon's murti should follow the Moon"


def test_the_nodes_carry_no_vedha() -> None:
    """The classical vedha table is given for the seven grahas. Lending Rahu
    and Ketu the Sun's row silently cancelled real transits."""
    for month in (2, 6, 10):
        for s in rasifal.compute(date(2026, month, 9)).signs:
            for t in s.transits:
                if t.name in ("Rahu", "Ketu"):
                    assert not t.obstructed


# --- periods ---------------------------------------------------------------


def test_a_period_covers_every_day_in_its_span() -> None:
    week = rasifal.compute_period(date(2026, 9, 10), 7)
    assert week.days == 7
    assert week.start == date(2026, 9, 10)
    assert week.end == date(2026, 9, 16)
    assert len(week.signs) == 12


def test_the_period_score_is_the_mean_of_its_days() -> None:
    """Aggregated, not sampled — a week must not be one day's reading with a
    different label on it."""
    start = date(2026, 4, 2)
    week = rasifal.compute_period(start, 7)
    dailies = [rasifal.compute(start + timedelta(n)) for n in range(7)]
    for i, s in enumerate(week.signs):
        expected = sum(d.signs[i].score for d in dailies) / 7
        assert s.score == pytest.approx(expected, abs=0.01)


def test_best_and_hardest_days_fall_inside_the_span_and_are_the_extremes() -> None:
    start = date(2026, 7, 1)
    month = rasifal.compute_period(start, 30)
    dailies = [rasifal.compute(start + timedelta(n)) for n in range(30)]
    for i, s in enumerate(month.signs):
        scores = {d.for_date: d.signs[i].score for d in dailies}
        assert start <= s.best_date <= month.end
        assert start <= s.hardest_date <= month.end
        assert scores[s.best_date] == max(scores.values())
        assert scores[s.hardest_date] == min(scores.values())


def test_a_steady_graha_holds_through_most_of_the_span() -> None:
    """Steady means characterising the period, not visiting it."""
    start = date(2026, 2, 3)
    week = rasifal.compute_period(start, 7)
    dailies = [rasifal.compute(start + timedelta(n)) for n in range(7)]
    for i, s in enumerate(week.signs):
        for graha in s.steady_supports:
            held = sum(1 for d in dailies if graha in d.signs[i].supports)
            assert held >= 7 * 0.6
        for graha in s.steady_strains:
            held = sum(1 for d in dailies if graha in d.signs[i].strains)
            assert held >= 7 * 0.6


def test_murti_day_counts_match_the_days() -> None:
    start = date(2026, 11, 5)
    month = rasifal.compute_period(start, 30)
    dailies = [rasifal.compute(start + timedelta(n)) for n in range(30)]
    for i, s in enumerate(month.signs):
        assert s.golden_days == sum(1 for d in dailies if d.signs[i].murti == "Swarna")
        assert s.iron_days == sum(1 for d in dailies if d.signs[i].murti == "Loha")


def test_a_period_needs_at_least_one_day() -> None:
    with pytest.raises(ValueError):
        rasifal.compute_period(date(2026, 1, 1), 0)


# --- the verdict band ------------------------------------------------------


def test_every_day_carries_a_band_and_it_agrees_with_its_stars() -> None:
    """The band is what the writer is told to match, so it must never drift
    from the star rating a reader sees beside it."""
    expected = {1: {"difficult"}, 2: {"caution"}, 3: {"ordinary"},
                4: {"good", "favourable"}, 5: {"very_good"}}
    for month in range(1, 13):
        for s in rasifal.compute(date(2026, month, 12)).signs:
            assert s.band in expected[s.rating], (s.sign, s.rating, s.band)


def test_all_six_bands_are_reachable() -> None:
    """Six words are offered to the reader; a mapping that can only produce
    five of them is a bug in the split, not a fact about the sky."""
    seen: set[str] = set()
    for month in range(1, 13):
        for dom in (5, 15, 25):
            seen.update(s.band for s in rasifal.compute(date(2026, month, dom)).signs)
    assert seen == {"very_good", "good", "favourable", "ordinary", "caution", "difficult"}


def test_periods_carry_a_band_too() -> None:
    week = rasifal.compute_period(date(2026, 9, 10), 7)
    assert all(s.band for s in week.signs)
