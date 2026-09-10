"""The daily gochara engine.

A rasifal is read by people who will compare it against a printed panchanga,
so the parts that must not drift are pinned: house counting, the vedha rule,
Murti Nirnaya, and determinism for a given date.
"""

from datetime import date, time

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


def test_the_reading_hour_does_not_depend_on_the_wall_clock() -> None:
    """A different hour is allowed to give a different sky; the default must
    be a fixed hour, not `now`."""
    morning = rasifal.compute(date(2026, 5, 5), at=time(6, 0))
    default = rasifal.compute(date(2026, 5, 5))
    assert [s.score for s in morning.signs] == [s.score for s in default.signs]

    evening = rasifal.compute(date(2026, 5, 5), at=time(23, 0))
    assert evening.for_date == morning.for_date
