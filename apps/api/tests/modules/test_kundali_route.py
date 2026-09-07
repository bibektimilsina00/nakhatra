"""End-to-end through the API: request -> engine -> wire schema.

These assert the *contract*, not the astrology. Chart correctness is the golden
suite's job (tests/astrology); this file's job is that the shape both clients
generate from stays what they expect.
"""

from __future__ import annotations

import pytest
from fastapi.testclient import TestClient

from app.main import create_app

VALID = {
    "name": "Test",
    "date": "1975-06-15",
    "time": "08:30",
    "tz_name": "Asia/Kathmandu",
    "latitude": 27.7172,
    "longitude": 85.3240,
    "place_label": "Kathmandu, Nepal",
    "time_accuracy": "exact",
}


@pytest.fixture(scope="module")
def client() -> TestClient:
    return TestClient(create_app())


def test_health(client: TestClient) -> None:
    assert client.get("/health").json() == {"status": "ok"}


def test_generates_a_chart(client: TestClient) -> None:
    response = client.post("/v1/kundali", json=VALID)
    assert response.status_code == 200, response.text
    body = response.json()

    assert body["lagna_sign"] == "Cancer"
    assert len(body["planets"]) == 9
    assert body["engine_version"]
    assert body["ayanamsa_name"].startswith("Lahiri")


def test_response_matches_what_the_flutter_dto_parses(client: TestClient) -> None:
    """The mobile DTO reads these exact keys (apps/mobile .../kundali_dto.dart).

    Until DTO generation is wired, this test is the contract. Renaming a key
    here breaks the app silently at runtime rather than at compile time.
    """
    body = client.post("/v1/kundali", json=VALID).json()

    for key in ("lagna_sign", "lagna_degree", "engine_version", "planets", "houses", "dasha"):
        assert key in body, key

    planet = body["planets"][0]
    for key in ("name", "sign", "degree_in_sign", "house", "nakshatra", "retrograde", "combust"):
        assert key in planet, key
    for key in ("name", "pada", "lord"):
        assert key in planet["nakshatra"], key

    assert "periods" in body["dasha"]
    maha = body["dasha"]["periods"][0]
    for key in ("lord", "start", "end", "level", "children"):
        assert key in maha, key


def test_nodes_report_no_dignity(client: TestClient) -> None:
    """A documented engine decision that clients must render, so it is part of
    the contract rather than an implementation detail."""
    body = client.post("/v1/kundali", json=VALID).json()
    by_name = {p["name"]: p for p in body["planets"]}
    assert by_name["Rahu"]["dignity"] is None
    assert by_name["Ketu"]["dignity"] is None
    assert by_name["Sun"]["dignity"] is not None


def test_dasha_tree_is_nested_and_levelled(client: TestClient) -> None:
    maha = client.post("/v1/kundali", json=VALID).json()["dasha"]["periods"][0]
    assert maha["level"] == 1
    assert maha["children"][0]["level"] == 2


# --- the validation that matters most --------------------------------------


@pytest.mark.parametrize(
    "tz_name",
    ["+05:45", "05:45", "GMT+5:45", "Asia/Nowhere", "", "UTC+5", "Kathmandu"],
)
def test_rejects_anything_that_is_not_an_iana_zone(client: TestClient, tz_name: str) -> None:
    """A UTC offset is accepted by nothing downstream and produces a chart that
    looks entirely normal while being wrong by minutes of arc. Reject at the
    boundary (docs/astrology-methodology.md)."""
    response = client.post("/v1/kundali", json={**VALID, "tz_name": tz_name})
    assert response.status_code == 422
    assert response.json()["error"]["code"] == "validation_error"


def test_accepts_legacy_iana_aliases(client: TestClient) -> None:
    """`Asia/Katmandu` and `Asia/Calcutta` are real backward-compatibility
    aliases in the tz database, not typos — they resolve to the same rules as
    `Asia/Kathmandu` and `Asia/Kolkata`. Geocoders and older device locales
    still emit them, so rejecting them would reject valid births.

    Pinned because "tighten the zone validation" looks like an improvement and
    would break real users.
    """
    for alias, canonical in (
        ("Asia/Katmandu", "Asia/Kathmandu"),
        ("Asia/Calcutta", "Asia/Kolkata"),
    ):
        aliased = client.post("/v1/kundali", json={**VALID, "tz_name": alias})
        assert aliased.status_code == 200, alias
        canonical_chart = client.post("/v1/kundali", json={**VALID, "tz_name": canonical})
        assert aliased.json()["julian_day"] == canonical_chart.json()["julian_day"]


def test_historical_zone_actually_changes_the_chart(client: TestClient) -> None:
    """Same wall-clock birth, same city, either side of Nepal's 1986 change
    from +5:30 to +5:45. If the API ever starts ignoring the date when
    resolving the offset, these two become identical."""
    before = client.post("/v1/kundali", json={**VALID, "date": "1975-06-15"}).json()
    after = client.post("/v1/kundali", json={**VALID, "date": "1995-06-15"}).json()
    assert before["julian_day"] != after["julian_day"]


# --- error envelope ---------------------------------------------------------


def test_validation_errors_use_the_shared_envelope(client: TestClient) -> None:
    """FastAPI's default 422 body is a bare list, which no client parses."""
    response = client.post("/v1/kundali", json={**VALID, "latitude": 999})
    assert response.status_code == 422
    body = response.json()
    assert set(body) == {"error"}
    assert set(body["error"]) == {"code", "message", "details"}
    assert "latitude" in body["error"]["details"]


def test_missing_field_is_reported_by_name(client: TestClient) -> None:
    payload = {k: v for k, v in VALID.items() if k != "tz_name"}
    body = client.post("/v1/kundali", json=payload).json()
    assert "tz_name" in body["error"]["details"]


# --- payload size -----------------------------------------------------------


def test_dasha_depth_defaults_to_two(client: TestClient) -> None:
    """Measured: three levels is 819 periods / ~78KB, two is 90 / ~12KB. The
    timeline shows roughly twenty at a time, so the third level is 66KB of
    payload on a phone connection for data almost nobody opens."""
    maha = client.post("/v1/kundali", json=VALID).json()["dasha"]["periods"][0]
    assert maha["children"], "antardasha should be present by default"
    assert maha["children"][0]["children"] == [], "pratyantar should not be"


def test_dasha_depth_three_is_available_on_request(client: TestClient) -> None:
    body = client.post("/v1/kundali?dasha_depth=3", json=VALID).json()
    assert body["dasha"]["periods"][0]["children"][0]["children"][0]["level"] == 3


def test_dasha_depth_one_returns_mahadashas_only(client: TestClient) -> None:
    body = client.post("/v1/kundali?dasha_depth=1", json=VALID).json()
    assert body["dasha"]["periods"][0]["children"] == []


def test_dasha_depth_is_bounded(client: TestClient) -> None:
    assert client.post("/v1/kundali?dasha_depth=4", json=VALID).status_code == 422
    assert client.post("/v1/kundali?dasha_depth=0", json=VALID).status_code == 422
