from __future__ import annotations

import json
from datetime import datetime
from pathlib import Path

import pytest

from app.astrology_core.models import BirthMoment

FIXTURE_DIR = Path(__file__).parent / "fixtures"


def all_fixtures() -> list[dict]:
    out = []
    for path in sorted(FIXTURE_DIR.glob("*.json")):
        data = json.loads(path.read_text())
        data["_path"] = path
        out.append(data)
    return out


def siddhanta_of(fixture: dict) -> str:
    """Which system this fixture was verified against.

    Defaults to drik: every fixture predating 0.6.0 was checked against
    AstroTalk or a modern tool, so that is the system its expected values
    belong to, whatever the product default happens to be.
    """
    return fixture.get("siddhanta", "drik")


def birth_of(fixture: dict) -> BirthMoment:
    b = fixture["birth"]
    return BirthMoment(
        local_datetime=datetime.fromisoformat(f"{b['date']}T{b['time']}"),
        tz_name=b["tz_name"],
        latitude=b["latitude"],
        longitude=b["longitude"],
        time_accuracy=b.get("time_accuracy", "exact"),
    )


def pytest_generate_tests(metafunc):
    if "fixture" in metafunc.fixturenames:
        fixtures = all_fixtures()
        metafunc.parametrize("fixture", fixtures, ids=[f["name"] for f in fixtures])


@pytest.fixture(scope="session")
def fixtures() -> list[dict]:
    return all_fixtures()
