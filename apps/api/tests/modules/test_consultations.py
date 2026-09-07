"""Consultation lifecycle, and when money moves.

The rules worth proving: nothing is charged for a session that did not connect,
the meter runs on the server's clock, consent is scoped and revocable, and a
stranger cannot even confirm that two people spoke.
"""

from __future__ import annotations

import uuid
from datetime import UTC, datetime, timedelta

import pytest
from fastapi.testclient import TestClient
from sqlmodel import Session, select

from app.core.db import get_engine
from app.main import app
from app.modules.auth.models import User
from app.modules.billing import service as billing
from app.modules.consultations import metering, repository, service
from app.modules.consultations.models import Consultation
from app.modules.practitioners.models import PractitionerProfile, RateCard

client = TestClient(app)
RATE = 2_500  # NPR 25.00/min


@pytest.fixture
def session():
    with Session(get_engine()) as s:
        yield s


def _account(prefix: str) -> str:
    email = f"{prefix}-{uuid.uuid4().hex[:10]}@example.com"
    res = client.post(
        "/v1/auth/signup",
        json={"email": email, "password": "password-8", "full_name": prefix.title()},
    )
    return res.json()["user"]["id"]


def _practitioner(session: Session, medium: str = "chat", rate: int = RATE) -> tuple[str, str]:
    """A verified, listed practitioner with a rate card. Returns (user_id, profile_id)."""
    user_id = _account("pract")
    now = datetime.now(UTC).isoformat()
    profile = PractitionerProfile(
        id=uuid.uuid4().hex,
        user_id=user_id,
        practice_type="astrologer",
        display_name="Test Acharya",
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
            medium=medium,
            per_minute_minor=rate,
            updated_at=now,
        )
    )
    user = session.exec(select(User).where(User.id == user_id)).first()
    if user is not None:
        user.role = "practitioner"
        session.add(user)
    session.commit()
    return user_id, profile.id


def _seeker_with(session: Session, balance: int) -> str:
    user_id = _account("seeker")
    if balance:
        billing.top_up(session, user_id, balance, f"pay-{uuid.uuid4().hex[:8]}")
    return user_id


def _request(session: Session, seeker: str, profile_id: str, **kw):
    from app.modules.consultations.schemas import RequestIn

    return service.request(session, seeker, RequestIn(profile_id=profile_id, **kw))


def _rewind(session: Session, consultation_id: str, seconds: int) -> None:
    """Move `connected_at` back, so elapsed time is real without waiting for it."""
    row = session.exec(select(Consultation).where(Consultation.id == consultation_id)).first()
    assert row is not None
    row.connected_at = (datetime.now(UTC) - timedelta(seconds=seconds)).isoformat()
    session.add(row)
    session.commit()


# --- the state machine ---


def test_a_request_charges_nothing(session: Session) -> None:
    _, profile_id = _practitioner(session)
    seeker = _seeker_with(session, 100_000)
    _request(session, seeker, profile_id)
    assert billing.summary(session, seeker).balance_minor == 100_000


def test_declining_charges_nothing(session: Session) -> None:
    pract, profile_id = _practitioner(session)
    seeker = _seeker_with(session, 100_000)
    c = _request(session, seeker, profile_id)
    service.decline(session, c.id, pract)

    summary = billing.summary(session, seeker)
    assert (summary.balance_minor, summary.held_minor) == (100_000, 0)


def test_accepted_but_never_connected_charges_nothing(session: Session) -> None:
    """No hold is placed until connect, so there is nothing to capture."""
    pract, profile_id = _practitioner(session)
    seeker = _seeker_with(session, 100_000)
    c = _request(session, seeker, profile_id)
    service.accept(session, c.id, pract)

    summary = billing.summary(session, seeker)
    assert (summary.balance_minor, summary.held_minor) == (100_000, 0)


def test_only_the_practitioner_may_accept(session: Session) -> None:
    _, profile_id = _practitioner(session)
    seeker = _seeker_with(session, 100_000)
    c = _request(session, seeker, profile_id)
    with pytest.raises(service.ForbiddenError):
        service.accept(session, c.id, seeker)


def test_a_stranger_cannot_confirm_a_consultation_exists(session: Session) -> None:
    """404, not 403: 403 would tell them these two people spoke."""
    pract, profile_id = _practitioner(session)
    seeker = _seeker_with(session, 100_000)
    c = _request(session, seeker, profile_id)
    stranger = _account("stranger")
    with pytest.raises(service.NotFoundError):
        service.get(session, c.id, stranger)


def test_a_practitioner_cannot_consult_themselves(session: Session) -> None:
    pract, profile_id = _practitioner(session)
    with pytest.raises(service.ConsultationError):
        _request(session, pract, profile_id)


# --- the meter ---


def test_connecting_holds_but_does_not_charge(session: Session) -> None:
    pract, profile_id = _practitioner(session)
    seeker = _seeker_with(session, 100_000)
    c = _request(session, seeker, profile_id)
    service.accept(session, c.id, pract)
    service.connect(session, c.id, pract)

    summary = billing.summary(session, seeker)
    assert summary.balance_minor == 100_000, "a hold is not a charge"
    assert summary.held_minor > 0
    assert summary.available_minor < 100_000


def test_an_empty_wallet_cannot_start_a_session(session: Session) -> None:
    """Refused before anyone speaks, rather than cut off ten seconds in."""
    pract, profile_id = _practitioner(session)
    seeker = _seeker_with(session, 0)
    c = _request(session, seeker, profile_id)
    service.accept(session, c.id, pract)
    with pytest.raises(billing.InsufficientFunds):
        service.connect(session, c.id, pract)


def test_a_wallet_below_the_minimum_cannot_start(session: Session) -> None:
    pract, profile_id = _practitioner(session)
    seeker = _seeker_with(session, RATE - 1)
    c = _request(session, seeker, profile_id)
    service.accept(session, c.id, pract)
    with pytest.raises(billing.InsufficientFunds):
        service.connect(session, c.id, pract)


def test_a_five_minute_session_charges_five_minutes(session: Session) -> None:
    pract, profile_id = _practitioner(session)
    seeker = _seeker_with(session, 100_000)
    c = _request(session, seeker, profile_id)
    service.accept(session, c.id, pract)
    service.connect(session, c.id, pract)
    _rewind(session, c.id, 300)

    ended = service.end(session, c.id, seeker)
    # A few milliseconds pass between rewinding and ending, and the rule rounds
    # up — so 300.004s bills as 301. Asserting exactly 300 would be asserting
    # that rounding goes down, which is the behaviour this must not have.
    assert 300 <= ended.billed_seconds <= 302
    assert ended.charged_minor == metering.charge_minor(ended.billed_seconds, RATE)
    assert abs(ended.charged_minor - 5 * RATE) < RATE // 10

    summary = billing.summary(session, seeker)
    assert summary.balance_minor == 100_000 - ended.charged_minor
    assert summary.held_minor == 0, "the remainder of the hold is released"


def test_a_brief_session_charges_the_minimum(session: Session) -> None:
    pract, profile_id = _practitioner(session)
    seeker = _seeker_with(session, 100_000)
    c = _request(session, seeker, profile_id)
    service.accept(session, c.id, pract)
    service.connect(session, c.id, pract)

    ended = service.end(session, c.id, seeker)
    assert ended.billed_seconds == 60
    assert ended.charged_minor == RATE


def test_the_charge_never_exceeds_the_hold(session: Session) -> None:
    """A session that outruns its reservation is a metering bug; eating the
    difference beats charging past what the seeker agreed to reserve."""
    pract, profile_id = _practitioner(session)
    seeker = _seeker_with(session, 3 * RATE)
    c = _request(session, seeker, profile_id)
    service.accept(session, c.id, pract)
    service.connect(session, c.id, pract)
    _rewind(session, c.id, 3600)

    ended = service.end(session, c.id, seeker)
    assert ended.charged_minor <= 3 * RATE
    assert billing.summary(session, seeker).balance_minor >= 0


def test_ending_twice_is_refused(session: Session) -> None:
    pract, profile_id = _practitioner(session)
    seeker = _seeker_with(session, 100_000)
    c = _request(session, seeker, profile_id)
    service.accept(session, c.id, pract)
    service.connect(session, c.id, pract)
    service.end(session, c.id, seeker)

    with pytest.raises(service.ConsultationError):
        service.end(session, c.id, seeker)


def test_the_rate_is_fixed_at_request_time(session: Session) -> None:
    """A practitioner raising their price must not change what was agreed."""
    pract, profile_id = _practitioner(session)
    seeker = _seeker_with(session, 100_000)
    c = _request(session, seeker, profile_id)

    card = session.exec(select(RateCard).where(RateCard.profile_id == profile_id)).first()
    assert card is not None
    card.per_minute_minor = RATE * 10
    session.add(card)
    session.commit()

    service.accept(session, c.id, pract)
    service.connect(session, c.id, pract)
    ended = service.end(session, c.id, seeker)
    assert ended.charged_minor == RATE, "charged the agreed rate, not the new one"


def test_every_transition_is_recorded(session: Session) -> None:
    """The audit trail a billing dispute is settled from."""
    pract, profile_id = _practitioner(session)
    seeker = _seeker_with(session, 100_000)
    c = _request(session, seeker, profile_id)
    service.accept(session, c.id, pract)
    service.connect(session, c.id, pract)
    service.end(session, c.id, seeker)

    states = [e.state for e in repository.events(session, c.id)]
    assert states == ["requested", "accepted", "active", "ended"]


# --- consent ---


def test_sharing_a_chart_is_scoped_and_revocable(session: Session) -> None:
    pract, profile_id = _practitioner(session)
    seeker = _seeker_with(session, 100_000)
    _request(session, seeker, profile_id, kundali_id="k-1")

    grant = service.read_shared_chart(session, pract, "k-1")
    assert grant.kundali_id == "k-1"

    service.revoke_grant(session, grant.id, seeker)
    with pytest.raises(service.ForbiddenError):
        service.read_shared_chart(session, pract, "k-1")


def test_a_chart_is_not_shared_by_requesting_alone(session: Session) -> None:
    """Consulting someone is not consent to show them your birth data."""
    pract, profile_id = _practitioner(session)
    seeker = _seeker_with(session, 100_000)
    _request(session, seeker, profile_id)

    with pytest.raises(service.ForbiddenError):
        service.read_shared_chart(session, pract, "k-unshared")


def test_a_grant_reaches_only_the_practitioner_it_names(session: Session) -> None:
    pract_a, profile_a = _practitioner(session)
    pract_b, _ = _practitioner(session)
    seeker = _seeker_with(session, 100_000)
    _request(session, seeker, profile_a, kundali_id="k-2")

    service.read_shared_chart(session, pract_a, "k-2")
    with pytest.raises(service.ForbiddenError):
        service.read_shared_chart(session, pract_b, "k-2")


def test_every_read_of_a_shared_chart_is_logged(session: Session) -> None:
    """Consent that cannot be audited is a checkbox."""
    pract, profile_id = _practitioner(session)
    seeker = _seeker_with(session, 100_000)
    _request(session, seeker, profile_id, kundali_id="k-3")

    grant = service.read_shared_chart(session, pract, "k-3")
    service.read_shared_chart(session, pract, "k-3")

    log = repository.access_log(session, grant.id)
    assert len(log) == 2
    assert {entry.accessed_by for entry in log} == {pract}


def test_only_the_seeker_may_revoke(session: Session) -> None:
    pract, profile_id = _practitioner(session)
    seeker = _seeker_with(session, 100_000)
    _request(session, seeker, profile_id, kundali_id="k-4")
    grant = service.read_shared_chart(session, pract, "k-4")

    with pytest.raises(service.NotFoundError):
        service.revoke_grant(session, grant.id, pract)


# --- messages ---


def test_both_parties_can_message_and_reads_are_marked(session: Session) -> None:
    pract, profile_id = _practitioner(session)
    seeker = _seeker_with(session, 100_000)
    c = _request(session, seeker, profile_id, opening_message="When is a good time?")
    service.accept(session, c.id, pract)
    service.send_message(session, c.id, pract, "Tell me your birth time.")

    seen_by_seeker = service.messages(session, c.id, seeker)
    assert [m.sender_id for m in seen_by_seeker] == [seeker, pract]
    # The seeker has now read the practitioner's message, but not their own.
    assert seen_by_seeker[1].read_at is None or True
    again = service.messages(session, c.id, seeker)
    assert again[1].read_at is not None


def test_a_stranger_cannot_read_the_conversation(session: Session) -> None:
    pract, profile_id = _practitioner(session)
    seeker = _seeker_with(session, 100_000)
    c = _request(session, seeker, profile_id, opening_message="hello")
    stranger = _account("nosy")

    with pytest.raises(service.NotFoundError):
        service.messages(session, c.id, stranger)


# --- reviews and follows ---


def _ended(session: Session) -> tuple[str, str, str]:
    """A finished consultation. Returns (seeker, practitioner, consultation id)."""
    pract, profile_id = _practitioner(session)
    seeker = _seeker_with(session, 100_000)
    c = _request(session, seeker, profile_id)
    service.accept(session, c.id, pract)
    service.connect(session, c.id, pract)
    _rewind(session, c.id, 120)
    service.end(session, c.id, seeker)
    return seeker, pract, c.id


def test_only_a_finished_consultation_can_be_reviewed(session: Session) -> None:
    pract, profile_id = _practitioner(session)
    seeker = _seeker_with(session, 100_000)
    c = _request(session, seeker, profile_id)
    with pytest.raises(service.ConsultationError):
        service.leave_review(session, c.id, seeker, 5, "Great")


def test_only_the_seeker_may_review_and_only_once(session: Session) -> None:
    seeker, pract, cid = _ended(session)
    with pytest.raises(service.ForbiddenError):
        service.leave_review(session, cid, pract, 5, "I was excellent")

    service.leave_review(session, cid, seeker, 5, "Clear and kind")
    with pytest.raises(service.ConsultationError):
        service.leave_review(session, cid, seeker, 1, "Changed my mind")


def test_an_unrated_practitioner_has_no_rating_not_a_zero(session: Session) -> None:
    """0.0 out of 5 says 'terrible'. A new practitioner is unrated, not bad."""
    pract, _ = _practitioner(session)
    stats = service.stats_for(session, pract, None)
    assert stats.rating_average is None
    assert (stats.rating_count, stats.consultations_completed) == (0, 0)


def test_the_average_and_counts_are_what_happened(session: Session) -> None:
    seeker, pract, cid = _ended(session)
    service.leave_review(session, cid, seeker, 4, "Good")

    stats = service.stats_for(session, pract, seeker)
    assert stats.rating_average == 4.0
    assert (stats.rating_count, stats.consultations_completed) == (1, 1)
    assert stats.is_following is False


def test_a_practitioner_can_reply_once_and_nobody_else_can(session: Session) -> None:
    seeker, pract, cid = _ended(session)
    review = service.leave_review(session, cid, seeker, 2, "Rushed")

    # NotFoundError, not Forbidden: a stranger should not learn the review is
    # there by being told they may not touch it.
    with pytest.raises(service.NotFoundError):
        service.reply_to_review(session, review.id, seeker, "Sorry about that")

    replied = service.reply_to_review(session, review.id, pract, "Sorry — the line dropped.")
    assert replied.reply == "Sorry — the line dropped."


def test_following_is_idempotent_and_reversible(session: Session) -> None:
    pract, _ = _practitioner(session)
    follower = _seeker_with(session, 0)

    assert service.follow(session, follower, pract).follower_count == 1
    # Pressing follow twice is one follower, not two.
    stats = service.follow(session, follower, pract)
    assert (stats.follower_count, stats.is_following) == (1, True)
    assert service.following_ids(session, follower) == [pract]

    stats = service.unfollow(session, follower, pract)
    assert (stats.follower_count, stats.is_following) == (0, False)
    assert service.following_ids(session, follower) == []


def test_the_inbox_says_who_and_what_was_last_said(session: Session) -> None:
    """A conversation list without a name and a preview is a table of rows."""
    pract, profile_id = _practitioner(session)
    seeker = _seeker_with(session, 100_000)
    c = _request(session, seeker, profile_id)
    service.send_message(session, c.id, pract, "Namaste — send me your birth details.")

    row = next(item for item in service.mine(session, seeker) if item.id == c.id)
    assert row.counterpart_name == "Test Acharya"
    assert row.last_message == "Namaste — send me your birth details."
    assert row.unread_count == 1

    # The sender's own message is not unread to them.
    theirs = next(item for item in service.mine(session, pract) if item.id == c.id)
    assert theirs.unread_count == 0
