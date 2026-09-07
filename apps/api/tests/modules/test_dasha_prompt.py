"""Which dasha the model is told is running.

The prompt used to list every period with its dates and nothing else, while the
system prompt deliberately carries no date (prompt caching). So the model was
asked "what is the current dasha?" with no way to know what "current" means, and
answered with the first row — reporting a mahadasha that ended in 2013 as the
one running in 2026. The engine knew; it just was not saying.
"""

from __future__ import annotations

import json
from datetime import date
from pathlib import Path

from app.modules.chat.prompts import format_chart_for_ai
from app.modules.kundali.schemas import BirthDetailsIn, ChartOut

FIXTURES = Path(__file__).parent / "report_fixtures"
CASE = json.loads((FIXTURES / "charts.json").read_text())[0]
CHART = ChartOut(**CASE["chart"])
BIRTH = BirthDetailsIn(**CASE["birth"])


def _running_line(today: date) -> str:
    text = format_chart_for_ai(CHART, BIRTH, today=today)
    return next(line for line in text.splitlines() if line.startswith("• RUNNING NOW:"))


def test_the_running_period_is_named_outright() -> None:
    """Not left to be inferred from a table of date ranges."""
    maha = CHART.dasha.periods[0]
    inside = maha.start + (maha.end - maha.start) / 2
    assert maha.lord in _running_line(inside)


def test_a_period_that_has_ended_is_not_reported_as_current() -> None:
    """The exact bug: first row in the list treated as the current one."""
    first = CHART.dasha.periods[0]
    later = next(d for d in CHART.dasha.periods if d.start > first.end)
    midway = later.start + (later.end - later.start) / 2

    line = _running_line(midway)
    assert later.lord in line
    if later.lord != first.lord:
        assert first.lord not in line


def test_today_is_stated_so_the_model_need_not_assume_one() -> None:
    text = format_chart_for_ai(CHART, BIRTH, today=date(2026, 9, 7))
    assert "• Today: 2026-09-07" in text


def test_a_date_outside_the_timeline_says_so_rather_than_inventing() -> None:
    assert "none" in _running_line(date(1800, 1, 1))


def test_only_the_running_mahadasha_spends_tokens_on_its_antardashas() -> None:
    """The antardashas of a period that ended in 1997 are noise."""
    maha = CHART.dasha.periods[0]
    inside = maha.start + (maha.end - maha.start) / 2
    text = format_chart_for_ai(CHART, BIRTH, today=inside)
    assert text.count("Antardasha:") == len(maha.children)
