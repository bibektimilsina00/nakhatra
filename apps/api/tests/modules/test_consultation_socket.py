"""The live socket: who may listen, and what arrives.

Two things are worth proving. That a socket is not a way around the membership
check every HTTP route makes — a socket that skipped it would be the most
private data in the product, streamed to anyone with a consultation id. And
that an event published on one connection reaches the other, which is the
entire point of not polling.
"""

from __future__ import annotations

import uuid
from datetime import UTC, datetime

import pytest
from fastapi.testclient import TestClient
from sqlmodel import Session, select

from app.core.db import get_engine
from app.main import app
from app.modules.auth.models import User
from app.modules.billing import service as billing
from app.modules.consultations import realtime
from app.modules.practitioners.models import PractitionerProfile, RateCard

client = TestClient(app)
RATE = 2_500


@pytest.fixture
def session():
    with Session(get_engine()) as s:
        yield s


def _account(prefix: str) -> tuple[str, str]:
    email = f"{prefix}-{uuid.uuid4().hex[:10]}@example.com"
    body = client.post(
        "/v1/auth/signup",
        json={"email": email, "password": "password-8", "full_name": prefix.title()},
    ).json()
    return body["user"]["id"], body["access_token"]


def _consultation(session: Session) -> tuple[str, str, str, str, str]:
    """A requested consultation. Returns (id, seeker_id, seeker_tok, pract_id, pract_tok)."""
    pract_id, pract_tok = _account("ws-pract")
    seeker_id, seeker_tok = _account("ws-seeker")
    now = datetime.now(UTC).isoformat()

    profile = PractitionerProfile(
        id=uuid.uuid4().hex,
        user_id=pract_id,
        practice_type="astrologer",
        display_name="Socket Acharya",
        verification_state="verified",
        is_listed=True,
        created_at=now,
        updated_at=now,
    )
    session.add(profile)
    session.add(
        RateCard(
            id=uuid.uuid4().hex,
            profile_id=profile.id,
            medium="chat",
            per_minute_minor=RATE,
            updated_at=now,
        )
    )
    user = session.exec(select(User).where(User.id == pract_id)).first()
    if user is not None:
        user.role = "practitioner"
        session.add(user)
    session.commit()

    billing.top_up(session, seeker_id, 100_000, f"pay-{uuid.uuid4().hex[:8]}")

    res = client.post(
        "/v1/consultations",
        json={"profile_id": profile.id, "medium": "chat", "opening_message": ""},
        headers={"Authorization": f"Bearer {seeker_tok}"},
    )
    assert res.status_code == 200, res.text
    return res.json()["id"], seeker_id, seeker_tok, pract_id, pract_tok


def _open(consultation_id: str, token: str):
    """Connect and authenticate. Returns the open socket, past the ready frame."""
    ws = client.websocket_connect(f"/v1/consultations/{consultation_id}/ws").__enter__()
    ws.send_json({"type": "auth", "token": token})
    assert ws.receive_json() == {"type": "ready"}
    return ws


# --- who may listen ---


def test_a_party_may_listen(session: Session) -> None:
    cid, _, seeker_tok, _, _ = _consultation(session)
    ws = _open(cid, seeker_tok)
    assert realtime.room_size(cid) == 1
    ws.__exit__(None, None, None)


def test_a_stranger_is_closed_out(session: Session) -> None:
    """A socket is not a way around the membership check."""
    cid, *_ = _consultation(session)
    _, stranger_tok = _account("ws-stranger")

    with client.websocket_connect(f"/v1/consultations/{cid}/ws") as ws:
        ws.send_json({"type": "auth", "token": stranger_tok})
        with pytest.raises(Exception):
            ws.receive_json()
    assert realtime.room_size(cid) == 0


def test_a_bad_token_is_closed_out(session: Session) -> None:
    cid, *_ = _consultation(session)
    with client.websocket_connect(f"/v1/consultations/{cid}/ws") as ws:
        ws.send_json({"type": "auth", "token": "not-a-token"})
        with pytest.raises(Exception):
            ws.receive_json()
    assert realtime.room_size(cid) == 0


def test_no_token_at_all_is_closed_out(session: Session) -> None:
    cid, *_ = _consultation(session)
    with client.websocket_connect(f"/v1/consultations/{cid}/ws") as ws:
        ws.send_json({"type": "hello"})
        with pytest.raises(Exception):
            ws.receive_json()
    assert realtime.room_size(cid) == 0


# --- what arrives ---


def test_a_message_reaches_the_other_party(session: Session) -> None:
    """The whole point of not polling."""
    cid, _, seeker_tok, _, pract_tok = _consultation(session)
    ws = _open(cid, seeker_tok)
    try:
        client.post(
            f"/v1/consultations/{cid}/messages",
            json={"body": "Tell me your birth time."},
            headers={"Authorization": f"Bearer {pract_tok}"},
        )
        event = ws.receive_json()
        assert event["type"] == "message"
        assert event["message"]["body"] == "Tell me your birth time."
    finally:
        ws.__exit__(None, None, None)


def test_a_state_change_reaches_the_other_party(session: Session) -> None:
    cid, _, seeker_tok, _, pract_tok = _consultation(session)
    ws = _open(cid, seeker_tok)
    try:
        client.post(
            f"/v1/consultations/{cid}/accept",
            headers={"Authorization": f"Bearer {pract_tok}"},
        )
        event = ws.receive_json()
        assert event["type"] == "state"
        assert event["consultation"]["state"] == "accepted"
    finally:
        ws.__exit__(None, None, None)


def test_both_parties_receive_the_same_event(session: Session) -> None:
    cid, _, seeker_tok, _, pract_tok = _consultation(session)
    a = _open(cid, seeker_tok)
    b = _open(cid, pract_tok)
    try:
        assert realtime.room_size(cid) == 2
        client.post(
            f"/v1/consultations/{cid}/accept",
            headers={"Authorization": f"Bearer {pract_tok}"},
        )
        assert a.receive_json()["consultation"]["state"] == "accepted"
        assert b.receive_json()["consultation"]["state"] == "accepted"
    finally:
        a.__exit__(None, None, None)
        b.__exit__(None, None, None)


def test_leaving_empties_the_room(session: Session) -> None:
    """A long-lived process must not accumulate a set per consultation."""
    cid, _, seeker_tok, _, _ = _consultation(session)
    ws = _open(cid, seeker_tok)
    assert realtime.room_size(cid) == 1
    ws.__exit__(None, None, None)
    assert realtime.room_size(cid) == 0


def test_an_event_with_nobody_listening_is_harmless(session: Session) -> None:
    cid, _, _, _, pract_tok = _consultation(session)
    assert realtime.room_size(cid) == 0
    res = client.post(
        f"/v1/consultations/{cid}/accept", headers={"Authorization": f"Bearer {pract_tok}"}
    )
    assert res.status_code == 200
