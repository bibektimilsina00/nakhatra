"""Consultation lifecycle and metering.

The state machine, and what each transition costs:

    requested ──accept──▶ accepted ──connect──▶ active ──end──▶ ended
        │                     │                    │
        ├──decline──▶ declined│                    └─ metered from `connected_at`
        └──cancel───▶ cancelled

**Money moves at exactly two points.** A hold is placed on `connect`, and it is
captured on `end` for what the server measured. Nothing is charged for a
session that was requested, declined, cancelled, or accepted-but-never-
connected — which is the difference between a meter people trust and one they
dispute.

**The server measures.** `connected_at` and `ended_at` are written here from
the server clock. A client that can influence billing will eventually be made
to (docs/astrologer-marketplace.md §5.3).
"""

from __future__ import annotations

import uuid
from datetime import UTC, datetime

from sqlmodel import Session, select

from app.core.errors import AppError
from app.modules.billing import service as billing
from app.modules.consultations import metering, repository
from app.modules.consultations.models import (
    ChartGrant,
    Consultation,
    ConsultationEvent,
    ConsultationMessage,
    GrantAccess,
)
from app.modules.consultations.schemas import (
    ConsultationOut,
    GrantOut,
    MessageOut,
    RequestIn,
)
from app.modules.practitioners.models import PractitionerProfile, RateCard


class ConsultationError(AppError):
    status_code = 400
    code = "consultation_invalid"


class NotFoundError(AppError):
    status_code = 404
    code = "not_found"


class ForbiddenError(AppError):
    status_code = 403
    code = "forbidden"


def _now() -> datetime:
    return datetime.now(UTC)


def _iso() -> str:
    return _now().isoformat()


def _id() -> str:
    return uuid.uuid4().hex


def _event(session: Session, consultation: Consultation, actor: str, detail: str = "") -> None:
    """Record the transition. Append-only; this is the dispute trail."""
    session.add(
        ConsultationEvent(
            id=_id(),
            consultation_id=consultation.id,
            state=consultation.state,
            actor=actor,
            detail=detail,
            created_at=_iso(),
        )
    )


def _party(consultation: Consultation, user_id: str) -> None:
    """Both sides may act; nobody else may even look."""
    if user_id not in (consultation.seeker_id, consultation.practitioner_user_id):
        # 404 rather than 403: confirming that a consultation exists tells a
        # stranger that two particular people spoke.
        raise NotFoundError("No such consultation.")


# --- requesting ---


def request(session: Session, seeker_id: str, body: RequestIn) -> ConsultationOut:
    profile = session.exec(
        select(PractitionerProfile).where(PractitionerProfile.id == body.profile_id)
    ).first()
    if profile is None or profile.verification_state != "verified" or not profile.is_listed:
        # Same answer for "no such profile" and "not listed", so the endpoint
        # cannot be used to discover who has applied.
        raise NotFoundError("No such practitioner.")
    if profile.user_id == seeker_id:
        raise ConsultationError("You cannot consult yourself.")

    rate = session.exec(
        select(RateCard).where(
            RateCard.profile_id == profile.id,
            RateCard.medium == body.medium,
            RateCard.is_active == True,  # noqa: E712 -- SQL, not Python
        )
    ).first()
    if rate is None or rate.per_minute_minor <= 0:
        raise ConsultationError("This practitioner does not offer that right now.")

    now = _iso()
    consultation = Consultation(
        id=_id(),
        seeker_id=seeker_id,
        practitioner_user_id=profile.user_id,
        profile_id=profile.id,
        medium=body.medium,
        state="requested",
        # Copied now. A price change between request and connect must not move
        # what was agreed.
        rate_per_minute_minor=rate.per_minute_minor,
        currency=rate.currency,
        created_at=now,
        updated_at=now,
    )
    session.add(consultation)
    _event(session, consultation, seeker_id, f"requested {body.medium}")

    if body.kundali_id:
        _grant_chart(session, seeker_id, profile.user_id, body.kundali_id, consultation.id)

    session.commit()
    session.refresh(consultation)

    if body.opening_message.strip():
        send_message(session, consultation.id, seeker_id, body.opening_message)

    return _out(consultation)


def accept(session: Session, consultation_id: str, practitioner_id: str) -> ConsultationOut:
    consultation = _load(session, consultation_id)
    if consultation.practitioner_user_id != practitioner_id:
        raise ForbiddenError("Only the practitioner can accept this.")
    if consultation.state != "requested":
        raise ConsultationError("This consultation is no longer waiting.")

    consultation.state = "accepted"
    consultation.updated_at = _iso()
    _event(session, consultation, practitioner_id)
    session.commit()
    session.refresh(consultation)
    return _out(consultation)


def decline(session: Session, consultation_id: str, practitioner_id: str) -> ConsultationOut:
    consultation = _load(session, consultation_id)
    if consultation.practitioner_user_id != practitioner_id:
        raise ForbiddenError("Only the practitioner can decline this.")
    if consultation.state not in ("requested", "accepted"):
        raise ConsultationError("This consultation is no longer waiting.")

    consultation.state = "declined"
    consultation.updated_at = _iso()
    _event(session, consultation, practitioner_id)
    session.commit()
    session.refresh(consultation)
    # Nothing is charged: no hold was ever placed.
    return _out(consultation)


def cancel(session: Session, consultation_id: str, seeker_id: str) -> ConsultationOut:
    consultation = _load(session, consultation_id)
    if consultation.seeker_id != seeker_id:
        raise ForbiddenError("Only the seeker can cancel this.")
    if consultation.state not in ("requested", "accepted"):
        raise ConsultationError("This consultation has already started or finished.")

    consultation.state = "cancelled"
    consultation.updated_at = _iso()
    _event(session, consultation, seeker_id)
    session.commit()
    session.refresh(consultation)
    return _out(consultation)


# --- the metered part ---


def connect(session: Session, consultation_id: str, actor: str) -> ConsultationOut:
    """The session becomes usable. The meter starts here and nowhere else.

    A hold is placed for the lesser of the wallet and an hour of talking. If
    the wallet cannot fund the minimum billable session, this refuses before
    anyone starts speaking rather than cutting them off ten seconds in.
    """
    consultation = _load(session, consultation_id)
    _party(consultation, actor)
    if consultation.state != "accepted":
        raise ConsultationError("This consultation is not ready to start.")

    summary = billing.summary(session, consultation.seeker_id)
    minimum = metering.charge_minor(
        metering.MINIMUM_BILLED_SECONDS, consultation.rate_per_minute_minor
    )
    if summary.available_minor < minimum:
        raise billing.InsufficientFunds(
            "There is not enough in the wallet to start this consultation."
        )

    hold = billing.place_hold(
        session,
        consultation.seeker_id,
        metering.hold_amount_minor(summary.available_minor, consultation.rate_per_minute_minor),
        reference_type="consultation",
        reference_id=consultation.id,
    )

    consultation.state = "active"
    consultation.hold_id = hold.id
    consultation.connected_at = _iso()
    consultation.updated_at = consultation.connected_at
    _event(session, consultation, actor, f"held {hold.amount_minor}")
    session.commit()
    session.refresh(consultation)
    return _out(consultation)


def end(session: Session, consultation_id: str, actor: str) -> ConsultationOut:
    """Stop the meter and charge what was used.

    The elapsed time is measured from the stored `connected_at` to now, both
    written by the server. The hold is a ceiling: the capture is whatever the
    measurement says, and the remainder is released.
    """
    consultation = _load(session, consultation_id)
    _party(consultation, actor)
    if consultation.state != "active":
        raise ConsultationError("This consultation is not running.")

    ended = _now()
    started = datetime.fromisoformat(consultation.connected_at or ended.isoformat())
    elapsed = (ended - started).total_seconds()

    consultation.billed_seconds = metering.billed_seconds(elapsed)
    charge = metering.charge_minor(elapsed, consultation.rate_per_minute_minor)

    if consultation.hold_id:
        # Capped at the hold: the seeker agreed to reserve that much and no
        # more. A session that outruns its hold is a metering bug, and eating
        # the difference is better than charging past what was reserved.
        hold = billing.repository.hold(session, consultation.hold_id)
        if hold is not None and hold.state == "active":
            charge = min(charge, hold.amount_minor)
            billing.capture_hold(session, hold.id, charge, created_by=actor)

    consultation.charged_minor = charge
    consultation.state = "ended"
    consultation.ended_at = ended.isoformat()
    consultation.updated_at = consultation.ended_at
    _event(session, consultation, actor, f"billed {consultation.billed_seconds}s = {charge}")
    session.commit()
    session.refresh(consultation)
    return _out(consultation)


# --- messages ---


def send_message(session: Session, consultation_id: str, sender_id: str, body: str) -> MessageOut:
    consultation = _load(session, consultation_id)
    _party(consultation, sender_id)
    if consultation.state in ("declined", "cancelled", "expired"):
        raise ConsultationError("This consultation is closed.")

    message = ConsultationMessage(
        id=_id(),
        consultation_id=consultation_id,
        sender_id=sender_id,
        body=body.strip(),
        created_at=_iso(),
    )
    repository.save(session, message)
    return _message_out(message)


def messages(session: Session, consultation_id: str, user_id: str) -> list[MessageOut]:
    consultation = _load(session, consultation_id)
    _party(consultation, user_id)

    rows = repository.messages(session, consultation_id)
    now = _iso()
    for row in rows:
        # Read receipts, which the AI conversation table has no concept of.
        if row.sender_id != user_id and row.read_at is None:
            row.read_at = now
            session.add(row)
    session.commit()
    return [_message_out(row) for row in rows]


# --- consent ---


def _grant_chart(
    session: Session,
    seeker_id: str,
    practitioner_user_id: str,
    kundali_id: str,
    consultation_id: str | None,
) -> ChartGrant:
    existing = repository.active_grant(session, practitioner_user_id, kundali_id)
    if existing is not None:
        return existing
    grant = ChartGrant(
        id=_id(),
        seeker_id=seeker_id,
        practitioner_user_id=practitioner_user_id,
        kundali_id=kundali_id,
        consultation_id=consultation_id,
        granted_at=_iso(),
    )
    session.add(grant)
    return grant


def my_grants(session: Session, seeker_id: str) -> list[GrantOut]:
    return [_grant_out(g) for g in repository.grants_of(session, seeker_id)]


def revoke_grant(session: Session, grant_id: str, seeker_id: str) -> GrantOut:
    """Revocation is immediate and it is the seeker's alone."""
    grant = repository.grant(session, grant_id)
    if grant is None or grant.seeker_id != seeker_id:
        raise NotFoundError("No such grant.")
    if grant.revoked_at is None:
        grant.revoked_at = _iso()
        repository.save(session, grant)
    return _grant_out(grant)


def read_shared_chart(session: Session, practitioner_user_id: str, kundali_id: str) -> ChartGrant:
    """Check consent and log the access. Both, or neither.

    Every read of shared birth data is recorded. Consent that cannot be audited
    is a checkbox, and this is what makes it more than one.
    """
    grant = repository.active_grant(session, practitioner_user_id, kundali_id)
    if grant is None:
        raise ForbiddenError("This chart has not been shared with you.")
    session.add(
        GrantAccess(
            id=_id(),
            grant_id=grant.id,
            accessed_by=practitioner_user_id,
            created_at=_iso(),
        )
    )
    session.commit()
    return grant


# --- reading ---


def _load(session: Session, consultation_id: str) -> Consultation:
    consultation = repository.get(session, consultation_id)
    if consultation is None:
        raise NotFoundError("No such consultation.")
    return consultation


def get(session: Session, consultation_id: str, user_id: str) -> ConsultationOut:
    consultation = _load(session, consultation_id)
    _party(consultation, user_id)
    return _out(consultation)


def mine(session: Session, user_id: str) -> list[ConsultationOut]:
    return [_out(c) for c in repository.for_user(session, user_id)]


def _out(row: Consultation) -> ConsultationOut:
    return ConsultationOut(
        id=row.id,
        seeker_id=row.seeker_id,
        practitioner_user_id=row.practitioner_user_id,
        profile_id=row.profile_id,
        medium=row.medium,  # type: ignore[arg-type]
        state=row.state,  # type: ignore[arg-type]
        rate_per_minute_minor=row.rate_per_minute_minor,
        currency=row.currency,
        connected_at=row.connected_at,
        ended_at=row.ended_at,
        billed_seconds=row.billed_seconds,
        charged_minor=row.charged_minor,
        created_at=row.created_at,
    )


def _message_out(row: ConsultationMessage) -> MessageOut:
    return MessageOut(
        id=row.id,
        sender_id=row.sender_id,
        body=row.body,
        created_at=row.created_at,
        read_at=row.read_at,
    )


def _grant_out(row: ChartGrant) -> GrantOut:
    return GrantOut(
        id=row.id,
        kundali_id=row.kundali_id,
        practitioner_user_id=row.practitioner_user_id,
        granted_at=row.granted_at,
        revoked_at=row.revoked_at,
    )
