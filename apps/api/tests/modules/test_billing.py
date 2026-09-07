"""The wallet's invariants.

Every test here is a way a marketplace loses money or loses trust. The ledger
is worth this much testing because it is the one part of the system where being
subtly wrong is indistinguishable from working, right up until someone reads
their statement.
"""

from __future__ import annotations

import uuid

import pytest
from fastapi.testclient import TestClient
from sqlmodel import Session

from app.core.db import get_engine
from app.main import app
from app.modules.billing import repository, service

client = TestClient(app)


@pytest.fixture
def session():
    with Session(get_engine()) as s:
        yield s


@pytest.fixture
def user() -> str:
    email = f"wallet-{uuid.uuid4().hex[:10]}@example.com"
    res = client.post(
        "/v1/auth/signup",
        json={"email": email, "password": "password-8", "full_name": "Wallet User"},
    )
    assert res.status_code == 200, res.text
    return res.json()["user"]["id"]


def _fund(session: Session, user_id: str, amount: int) -> None:
    service.top_up(session, user_id, amount, f"pay-{uuid.uuid4().hex[:8]}")


# --- the balance is the ledger ---


def test_a_new_wallet_is_empty(session: Session, user: str) -> None:
    summary = service.summary(session, user)
    assert (summary.balance_minor, summary.held_minor, summary.available_minor) == (0, 0, 0)


def test_the_balance_is_the_sum_of_the_entries(session: Session, user: str) -> None:
    _fund(session, user, 50_000)
    _fund(session, user, 25_000)
    wallet = repository.wallet_for(session, user)
    assert wallet is not None

    entries = repository.all_entries(session, wallet.id)
    assert sum(e.amount_minor for e in entries) == service.summary(session, user).balance_minor


def test_each_entry_records_the_running_total(session: Session, user: str) -> None:
    """`balance_after_minor` is denormalised so corruption is detectable."""
    _fund(session, user, 30_000)
    _fund(session, user, 20_000)
    wallet = repository.wallet_for(session, user)
    assert wallet is not None

    running = 0
    for entry in repository.all_entries(session, wallet.id):
        running += entry.amount_minor
        assert entry.balance_after_minor == running


def test_the_audit_replay_finds_a_tampered_entry(session: Session, user: str) -> None:
    """The reason `balance_after_minor` exists at all."""
    _fund(session, user, 40_000)
    assert service.audit(session, user) == []

    wallet = repository.wallet_for(session, user)
    assert wallet is not None
    entry = repository.all_entries(session, wallet.id)[0]
    entry.balance_after_minor += 1_000
    session.add(entry)
    session.commit()

    assert service.audit(session, user), "a tampered running total must be reported"


# --- nothing spends more than is available ---


def test_a_debit_beyond_the_balance_is_refused(session: Session, user: str) -> None:
    _fund(session, user, 10_000)
    wallet = repository.wallet_for(session, user)
    assert wallet is not None

    with pytest.raises(service.InsufficientFunds):
        service.post(session, wallet, kind="consultation", amount_minor=-10_001)


def test_a_hold_reserves_funds_without_spending_them(session: Session, user: str) -> None:
    _fund(session, user, 60_000)
    service.place_hold(session, user, 25_000, reference_type="consultation", reference_id="c1")

    summary = service.summary(session, user)
    assert summary.balance_minor == 60_000, "a hold is not a charge"
    assert summary.held_minor == 25_000
    assert summary.available_minor == 35_000


def test_two_sessions_cannot_hold_the_same_money(session: Session, user: str) -> None:
    """The whole reason holds exist: two calls starting at once."""
    _fund(session, user, 30_000)
    service.place_hold(session, user, 20_000, reference_type="consultation", reference_id="c1")

    with pytest.raises(service.InsufficientFunds):
        service.place_hold(session, user, 20_000, reference_type="consultation", reference_id="c2")


def test_held_funds_cannot_be_spent_by_something_else(session: Session, user: str) -> None:
    _fund(session, user, 30_000)
    service.place_hold(session, user, 25_000, reference_type="consultation", reference_id="c1")
    wallet = repository.wallet_for(session, user)
    assert wallet is not None

    with pytest.raises(service.InsufficientFunds):
        service.post(session, wallet, kind="consultation", amount_minor=-10_000)


def test_one_hold_per_session(session: Session, user: str) -> None:
    """A second hold would reserve the same money twice."""
    _fund(session, user, 60_000)
    first = service.place_hold(
        session, user, 20_000, reference_type="consultation", reference_id="c1"
    )
    again = service.place_hold(
        session, user, 20_000, reference_type="consultation", reference_id="c1"
    )
    assert again.id == first.id
    assert service.summary(session, user).held_minor == 20_000


# --- capture and release ---


def test_capturing_charges_the_actual_amount_and_frees_the_rest(
    session: Session, user: str
) -> None:
    """The hold is a ceiling, not a price."""
    _fund(session, user, 50_000)
    hold = service.place_hold(
        session, user, 40_000, reference_type="consultation", reference_id="c1"
    )
    service.capture_hold(session, hold.id, 12_000)

    summary = service.summary(session, user)
    assert summary.balance_minor == 38_000
    assert summary.held_minor == 0
    assert summary.available_minor == 38_000


def test_releasing_charges_nothing(session: Session, user: str) -> None:
    """A call that rang and was never answered."""
    _fund(session, user, 50_000)
    hold = service.place_hold(
        session, user, 40_000, reference_type="consultation", reference_id="c1"
    )
    service.release_hold(session, hold.id)

    summary = service.summary(session, user)
    assert (summary.balance_minor, summary.held_minor) == (50_000, 0)


def test_a_hold_is_resolved_exactly_once(session: Session, user: str) -> None:
    """Capturing twice would double-charge; releasing after capture frees money
    that has already been taken."""
    _fund(session, user, 50_000)
    hold = service.place_hold(
        session, user, 30_000, reference_type="consultation", reference_id="c1"
    )
    service.capture_hold(session, hold.id, 10_000)

    with pytest.raises(service.BillingError):
        service.capture_hold(session, hold.id, 10_000)
    with pytest.raises(service.BillingError):
        service.release_hold(session, hold.id)

    assert service.summary(session, user).balance_minor == 40_000


def test_a_capture_cannot_exceed_the_hold(session: Session, user: str) -> None:
    _fund(session, user, 50_000)
    hold = service.place_hold(
        session, user, 10_000, reference_type="consultation", reference_id="c1"
    )
    with pytest.raises(service.BillingError):
        service.capture_hold(session, hold.id, 10_001)


def test_a_session_that_delivered_nothing_charges_nothing(session: Session, user: str) -> None:
    """Dropped inside the first minute: the hold goes, no entry is written."""
    _fund(session, user, 50_000)
    hold = service.place_hold(
        session, user, 30_000, reference_type="consultation", reference_id="c1"
    )
    service.capture_hold(session, hold.id, 0)

    summary = service.summary(session, user)
    assert (summary.balance_minor, summary.held_minor) == (50_000, 0)


# --- idempotency ---


def test_the_same_payment_is_credited_once(session: Session, user: str) -> None:
    """A provider will retry a webhook. It must not double the balance."""
    service.top_up(session, user, 20_000, "esewa-abc123")
    service.top_up(session, user, 20_000, "esewa-abc123")
    service.top_up(session, user, 20_000, "esewa-abc123")

    assert service.summary(session, user).balance_minor == 20_000


def test_different_payments_both_land(session: Session, user: str) -> None:
    service.top_up(session, user, 20_000, "esewa-a")
    service.top_up(session, user, 15_000, "esewa-b")
    assert service.summary(session, user).balance_minor == 35_000


def test_capture_is_idempotent_at_the_database_level(session: Session, user: str) -> None:
    """Belt and braces: the state check is the guard, the key is the proof."""
    _fund(session, user, 50_000)
    hold = service.place_hold(
        session, user, 30_000, reference_type="consultation", reference_id="c1"
    )
    entry = service.capture_hold(session, hold.id, 10_000)
    assert entry.idempotency_key == f"capture:{hold.id}"


# --- the endpoints ---


def _headers() -> dict[str, str]:
    email = f"api-{uuid.uuid4().hex[:10]}@example.com"
    body = client.post(
        "/v1/auth/signup",
        json={"email": email, "password": "password-8", "full_name": "Api User"},
    ).json()
    return {"Authorization": f"Bearer {body['access_token']}"}


def test_the_wallet_requires_an_account() -> None:
    assert client.get("/v1/wallet").status_code == 401


def test_the_wallet_and_ledger_read_back_over_http() -> None:
    headers = _headers()
    assert client.get("/v1/wallet", headers=headers).json()["balance_minor"] == 0

    top = client.post(
        "/v1/wallet/topup",
        json={"amount_minor": 45_000, "reference": f"dev-{uuid.uuid4().hex[:8]}"},
        headers=headers,
    )
    assert top.status_code == 200, top.text
    assert top.json()["available_minor"] == 45_000

    ledger = client.get("/v1/wallet/ledger", headers=headers).json()
    assert ledger["balance_minor"] == 45_000
    assert [e["kind"] for e in ledger["entries"]] == ["topup"]
    assert ledger["entries"][0]["amount_minor"] == 45_000


def test_a_zero_or_negative_topup_is_rejected_by_the_contract() -> None:
    headers = _headers()
    for amount in (0, -100):
        res = client.post(
            "/v1/wallet/topup", json={"amount_minor": amount, "reference": "x"}, headers=headers
        )
        assert res.status_code == 422
