"""The port of `report-generator.ts` must not change a single reading.

`report_fixtures/expected_reports.json` was produced by running the original
TypeScript over `report_fixtures/charts.json` before any Python existed. If a
character of user-facing copy shifts, this fails — which is the only way to
port 440 lines of templated prose without silently rewriting people's reports.

Regenerating the fixtures to make this pass defeats the point. Change them only
when the copy is *meant* to change, and say so in the commit.
"""

from __future__ import annotations

import json
from pathlib import Path

import pytest

from app.modules.kundali.schemas import BirthDetailsIn, ChartOut
from app.modules.report.generator import _fixed, generate

FIXTURES = Path(__file__).parent / "report_fixtures"
CASES = json.loads((FIXTURES / "charts.json").read_text())
EXPECTED = json.loads((FIXTURES / "expected_reports.json").read_text())

LANGUAGES = ("en", "ne", "hi")


@pytest.mark.parametrize("index", range(len(CASES)))
@pytest.mark.parametrize("language", LANGUAGES)
def test_matches_the_typescript_it_replaces(index: int, language: str) -> None:
    case = CASES[index]
    produced = [
        section.model_dump()
        for section in generate(
            ChartOut(**case["chart"]), BirthDetailsIn(**case["birth"]), language
        )
    ]
    assert produced == EXPECTED[f"{index}-{language}"]


def test_every_language_produces_the_same_seven_sections() -> None:
    case = CASES[0]
    chart, birth = ChartOut(**case["chart"]), BirthDetailsIn(**case["birth"])
    ids = {lang: [s.id for s in generate(chart, birth, lang)] for lang in LANGUAGES}
    assert ids["en"] == ids["ne"] == ids["hi"]
    assert ids["en"] == [
        "personality",
        "strengths-weaknesses",
        "career-finance",
        "love-marriage",
        "travel-spirituality",
        "current-dasha",
        "remedies",
    ]


def test_unknown_language_falls_back_to_english() -> None:
    case = CASES[0]
    chart, birth = ChartOut(**case["chart"]), BirthDetailsIn(**case["birth"])
    assert [s.model_dump() for s in generate(chart, birth, "fr")] == EXPECTED["0-en"]


@pytest.mark.parametrize(
    "value,expected",
    # Verified against `node -e "v.toFixed(2)"`, not assumed.
    [
        (0.125, "0.13"),  # exact in binary; format() gives 0.12, toFixed gives 0.13
        (1.005, "1.00"),  # really 1.00499…, so both languages round down
        (2.675, "2.67"),  # really 2.67499…
        (27.735, "27.73"),
        (11.5, "11.50"),
        (0.0, "0.00"),
    ],
)
def test_fixed_matches_javascript_tofixed(value: float, expected: str) -> None:
    """JS rounds half away from zero; Python's format rounds half to even.

    2.675 is the classic case: it is really 2.67499999... in binary, so both
    languages print 2.67. 0.125 is exact in binary and the two disagree —
    `format` gives 0.12, `toFixed` gives 0.13. A printed ascendant must not
    depend on which language rendered it.
    """
    assert _fixed(value) == expected
