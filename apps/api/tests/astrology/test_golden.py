"""Golden-chart regression, and the Phase 0 exit criterion.

`test_reproduces_expected` is the regression net. `test_phase0_complete` is the
forcing function: it fails until every fixture has been confirmed by a human
against an independent implementation, because a golden test built from this
engine's own unverified output is a test that faithfully preserves a bug.
"""

from __future__ import annotations

import pytest

from app.astrology_core import build_chart

from .conftest import birth_of, siddhanta_of

# Fields that legitimately differ between runs or between environments.
VOLATILE = {"computed_at"}


def _strip(d: dict) -> dict:
    return {k: v for k, v in d.items() if k not in VOLATILE}


def test_reproduces_expected(fixture):
    if fixture["expected"] is None:
        pytest.skip(
            f"{fixture['name']} has no expected values yet — see tests/astrology/fixtures/README.md"
        )
    actual = _strip(build_chart(birth_of(fixture), siddhanta_of(fixture)).to_dict())
    expected = _strip(fixture["expected"])

    if actual == expected:
        return

    # Point at the first real difference rather than dumping two large blobs.
    diffs = [
        f"  {k}: expected {expected.get(k)!r}, got {actual.get(k)!r}"
        for k in sorted(set(expected) | set(actual))
        if expected.get(k) != actual.get(k)
    ]
    pytest.fail(
        f"{fixture['name']} no longer reproduces "
        f"(verified against {fixture['verified_against']}).\n"
        + "\n".join(diffs[:10])
        + "\n\nIf this change is intended: bump ENGINE_VERSION, re-verify against a "
        "reference tool, and re-write the fixture with --verified-against."
    )


def test_engine_version_is_recorded(fixture):
    if fixture["expected"] is None:
        pytest.skip("not yet populated")
    assert fixture["expected"]["engine_version"], (
        "a fixture without an engine_version cannot be invalidated safely"
    )


def test_phase0_complete(fixtures):
    """Phase 0 is done when every fixture is verified. Until then, fail loudly.

    Deliberately not a skip: docs/roadmap.md makes verified golden charts the
    gate on starting Phase 1, and a gate nothing enforces is a comment.
    """
    unpopulated = [f["name"] for f in fixtures if f["expected"] is None]
    unverified = [
        f["name"] for f in fixtures if f["expected"] is not None and not f.get("verified_against")
    ]
    if not unpopulated and not unverified:
        return

    lines = ["Phase 0 incomplete — the astrology engine is not yet trustworthy.\n"]
    if unpopulated:
        lines.append(f"  no expected values ({len(unpopulated)}): {', '.join(unpopulated)}")
    if unverified:
        lines.append(f"  frozen but unverified ({len(unverified)}): {', '.join(unverified)}")
    lines.append(
        "\nFor each one:\n"
        "  1. make chart FIXTURE=<name>\n"
        "  2. compare against Jagannatha Hora / AstroSage / an astrologer,\n"
        "     with Lahiri ayanamsa + whole-sign houses + mean node\n"
        "  3. uv run python scripts/verify_chart.py --fixture <name> --write \\\n"
        '       --verified-against "<tool and version>"\n'
    )
    pytest.fail("\n".join(lines))
