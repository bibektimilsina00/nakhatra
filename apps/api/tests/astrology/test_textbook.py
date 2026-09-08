"""The engine, checked against a printed textbook.

Every number here is a worked example from Deepak Kapoor's *Astronomy and
Mathematical Astrology* (8th English edition, 2011), the Bharatiya Vidya
Bhawan course text. The fixture records the page and the sentence the value
comes from.

This is a different kind of golden test from `test_golden.py`. Those are whole
charts and rest on the ephemeris; these are the derived quantities alone —
given a longitude, what nakshatra, what tithi, what dasha — so they isolate
our arithmetic from Swiss Ephemeris and can be checked by anyone holding the
book. Rule 4 asks which reference confirmed a value; an ISBN and a page number
answer that better than a website that may not exist next year.

A failure here means one of two things: the arithmetic broke, or it was
changed deliberately. If deliberately, bump `engine_version` and say in the
commit which page the new value disagrees with and why.
"""

from __future__ import annotations

import json
import re
from datetime import datetime
from pathlib import Path

import pytest

from app.astrology_core import dasha, ephemeris, nakshatra, panchang

BOOK = json.loads(
    (Path(__file__).parent / "fixtures" / "textbook" / "kapoor_2011.json").read_text()
)

_DMS = re.compile(r"""^\s*(\d+)°(?:(\d+)')?(?:(\d+)")?\s*$""")


def deg(printed: str) -> float:
    """`236°43'` -> 236.7166…  The fixture stores what the page prints."""
    match = _DMS.match(printed)
    if not match:
        raise ValueError(f"not a degree-minute-second string: {printed!r}")
    d, m, s = (int(g) if g else 0 for g in match.groups())
    return d + m / 60 + s / 3600


def cite(case: dict) -> str:
    return f"Kapoor p.{case['page']}: {case['quote']}"


# --- ayanamsa ---


def test_ayanamsa_matches_the_book():
    case = BOOK["ayanamsa"]
    jd = ephemeris.julian_day(datetime.fromisoformat(case["instant_utc"]), "UTC")
    actual = ephemeris.ayanamsa(jd)
    drift_arcmin = abs(actual - deg(case["expect"])) * 60

    assert drift_arcmin < case["tolerance_arcmin"], (
        f"{cite(case)}\n"
        f"  engine: {actual:.6f}° — {drift_arcmin:.2f}' away, tolerance "
        f"{case['tolerance_arcmin']}'.\n"
        f"  A gap this size usually means the ayanamsa was switched, not that "
        f"the series was refined."
    )


# --- panchanga ---


@pytest.mark.parametrize("case", BOOK["nakshatra"], ids=lambda c: f"p{c['page']}")
def test_nakshatra_matches_the_book(case):
    got = nakshatra.nakshatra_at(deg(case["longitude"]))
    want = case["expect"]
    # Only what the page states. One example gives the nakshatra and its lord
    # and no pada, so no pada is checked for it.
    # The book counts from 1; the engine indexes from 0.
    actual = {"number": got.index + 1, "name": got.name, "pada": got.pada}
    assert {k: actual[k] for k in want} == want, cite(case)


@pytest.mark.parametrize("case", BOOK["tithi"], ids=lambda c: f"p{c['page']}")
def test_tithi_matches_the_book(case):
    index, name, paksha = panchang.tithi(deg(case["sun"]), deg(case["moon"]))
    want = case["expect"]
    assert (index + 1, name, paksha) == (want["number"], want["name"], want["paksha"]), cite(case)


@pytest.mark.parametrize("case", BOOK["karana"], ids=lambda c: f"p{c['page']}")
def test_karana_matches_the_book(case):
    got = panchang.karana(deg(case["sun"]), deg(case["moon"]))
    assert got == case["expect"]["name"], f"{cite(case)}\n  {case['numbering']}"


@pytest.mark.parametrize("case", BOOK["yoga"], ids=lambda c: f"p{c['page']}")
def test_yoga_matches_the_book(case):
    got = panchang.nitya_yoga(deg(case["sun"]), deg(case["moon"]))
    assert got == case["expect"]["name"], cite(case)


# --- vimshottari ---


def test_dasha_balance_matches_the_book():
    case = BOOK["vimshottari"]["balance"]
    moon = deg(case["moon"])
    position = nakshatra.nakshatra_at(moon)
    remaining = (1 - nakshatra.elapsed_fraction(moon)) * dasha.VIMSHOTTARI_YEARS[position.lord]

    assert position.lord == case["expect"]["lord"], cite(case)
    # Four decimals: the book prints 13.7, and 13.7 is what the arithmetic
    # gives exactly (548' remaining of 800', times 20 years).
    assert round(remaining, 4) == case["expect"]["years"], (
        f"{cite(case)}\n  engine: {remaining:.4f} years"
    )


def test_dasha_succession_matches_the_printed_dates():
    """The whole chain, against five dates set in type.

    Nakshatra to lord to balance to calendar date — if any link moves, one of
    these five stops matching.
    """
    case = BOOK["vimshottari"]["succession"]
    birth = datetime.fromisoformat(f"{case['birth_date']}T00:00:00")
    periods = dasha.build_dasha(deg(case["moon"]), birth).periods
    by_lord = {p.lord: p for p in periods}

    for want in case["expect"]:
        period = by_lord.get(want["lord"])
        assert period is not None, f"{cite(case)}\n  no {want['lord']} mahadasha"
        assert str(period.end) == want["ends"], (
            f"{cite(case)}\n"
            f"  {want['lord']} ends {period.end}, book says {want['ends']}\n"
            f"  {case['why_this_matters']}"
        )


@pytest.mark.parametrize(
    "case", BOOK["vimshottari"]["subperiods"], ids=lambda c: "/".join(c["path"])
)
def test_dasha_subperiod_lengths_match_the_book(case):
    root = BOOK["vimshottari"]["succession"]
    birth = datetime.fromisoformat(f"{root['birth_date']}T00:00:00")
    periods = dasha.build_dasha(deg(root["moon"]), birth).periods

    node = None
    for lord in case["path"]:
        pool = periods if node is None else node.children
        node = next((p for p in pool if p.lord == lord), None)
        assert node is not None, f"{cite(case)}\n  no {lord} under {'/'.join(case['path'])}"

    actual = (node.end - node.start).days
    off_by = abs(actual - case["expect_days"])
    assert off_by <= case["tolerance_days"], (
        f"{cite(case)}\n"
        f"  engine: {actual} days, book: {case['expect_days']} — off by {off_by}\n"
        f"  {BOOK['vimshottari']['subperiod_note']}"
    )
