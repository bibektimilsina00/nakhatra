"""Phase 2 behaviour that no existing test covers.

The two that matter: `birth` must be absent rather than guessed for rows with no
`tz_name`, and every endpoint must refuse another user's rows.
"""

from __future__ import annotations

import uuid

import pytest
from fastapi.testclient import TestClient
from sqlmodel import Session

from app.core.db import get_engine
from app.main import app
from app.modules.vault.models import SavedKundali

client = TestClient(app)

KUNDALI = {
    "name": "Test Native",
    "gender": "male",
    "dob": "1975-06-14",
    "tob": "08:30",
    "lat": 27.7172,
    "lon": 85.3240,
    "tz_offset": 5.75,
    "tz_name": "Asia/Kathmandu",
    "place_name": "Kathmandu, Nepal",
}


def _auth() -> dict[str, str]:
    email = f"vault-{uuid.uuid4().hex[:10]}@example.com"
    res = client.post(
        "/v1/auth/signup",
        json={"email": email, "password": "password-8", "full_name": "Vault User"},
    )
    assert res.status_code == 200, res.text
    return {"Authorization": f"Bearer {res.json()['access_token']}"}


def test_saved_kundali_round_trips_into_birth_details() -> None:
    headers = _auth()
    saved = client.post("/v1/vault/kundalis", json=KUNDALI, headers=headers)
    assert saved.status_code == 200, saved.text

    birth = saved.json()["birth"]
    assert birth is not None, "a row with tz_name must expose a recalculable birth"
    assert birth["tz_name"] == "Asia/Kathmandu"
    assert birth["latitude"] == KUNDALI["lat"]
    assert birth["place_label"] == KUNDALI["place_name"]

    # The whole point: it can be posted straight back to /v1/kundali.
    chart = client.post("/v1/kundali", json=birth)
    assert chart.status_code == 200, chart.text


def test_legacy_row_without_tz_name_reports_birth_as_null() -> None:
    """A stored offset cannot reconstruct a historical zone. Say so, don't guess."""
    headers = _auth()
    saved = client.post("/v1/vault/kundalis", json=KUNDALI, headers=headers)
    kundali_id = saved.json()["id"]

    with Session(get_engine()) as session:
        row = session.get(SavedKundali, kundali_id)
        assert row is not None
        row.tz_name = None
        session.add(row)
        session.commit()

    listed = client.get("/v1/vault/kundalis", headers=headers)
    assert listed.status_code == 200
    row = next(r for r in listed.json() if r["id"] == kundali_id)
    assert row["birth"] is None
    assert row["tz_offset"] == KUNDALI["tz_offset"], "legacy fields still readable"


def test_tz_name_is_optional_for_old_clients() -> None:
    headers = _auth()
    legacy_body = {k: v for k, v in KUNDALI.items() if k != "tz_name"}
    res = client.post("/v1/vault/kundalis", json=legacy_body, headers=headers)
    assert res.status_code == 200, res.text
    assert res.json()["birth"] is None


@pytest.mark.parametrize("field,value", [("lat", 91.0), ("lon", -181.0)])
def test_out_of_range_coordinates_are_rejected(field: str, value: float) -> None:
    headers = _auth()
    res = client.post("/v1/vault/kundalis", json={**KUNDALI, field: value}, headers=headers)
    assert res.status_code == 422


def test_session_list_omits_message_bodies() -> None:
    headers = _auth()
    session_id = client.post("/v1/vault/sessions", json={"title": "T"}, headers=headers).json()[
        "id"
    ]
    client.post(
        f"/v1/vault/sessions/{session_id}/messages",
        json={"sender": "user", "content": "hello"},
        headers=headers,
    )

    listed = client.get("/v1/vault/sessions", headers=headers).json()
    assert listed[0]["messages"] == [], "list must not fan out one query per session"

    single = client.get(f"/v1/vault/sessions/{session_id}", headers=headers).json()
    assert [m["content"] for m in single["messages"]] == ["hello"]


def test_another_users_rows_are_not_reachable() -> None:
    owner, intruder = _auth(), _auth()
    kundali_id = client.post("/v1/vault/kundalis", json=KUNDALI, headers=owner).json()["id"]
    session_id = client.post("/v1/vault/sessions", json={"title": "Private"}, headers=owner).json()[
        "id"
    ]

    assert client.get("/v1/vault/kundalis", headers=intruder).json() == []
    assert client.get("/v1/vault/sessions", headers=intruder).json() == []

    for res in (
        client.delete(f"/v1/vault/kundalis/{kundali_id}", headers=intruder),
        client.get(f"/v1/vault/sessions/{session_id}", headers=intruder),
        client.delete(f"/v1/vault/sessions/{session_id}", headers=intruder),
        client.post(
            f"/v1/vault/sessions/{session_id}/messages",
            json={"sender": "user", "content": "injected"},
            headers=intruder,
        ),
    ):
        assert res.status_code == 404, res.text
        assert res.json()["error"]["code"].endswith("not_found")

    # The owner's session is untouched by the attempted write.
    assert client.get(f"/v1/vault/sessions/{session_id}", headers=owner).json()["messages"] == []


def test_vault_requires_a_token() -> None:
    res = client.get("/v1/vault/kundalis")
    assert res.status_code == 401
    assert res.json()["error"]["code"] == "not_authenticated"
