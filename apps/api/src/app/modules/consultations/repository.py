"""Data access for consultations and grants."""

from __future__ import annotations

from sqlmodel import Session, select

from app.modules.consultations.models import (
    ChartGrant,
    Consultation,
    ConsultationEvent,
    ConsultationMessage,
    Follow,
    GrantAccess,
    Review,
)


def get(session: Session, consultation_id: str) -> Consultation | None:
    return session.exec(select(Consultation).where(Consultation.id == consultation_id)).first()


def for_user(session: Session, user_id: str, limit: int = 50) -> list[Consultation]:
    """Everything this account is a party to, either side of it."""
    return list(
        session.exec(
            select(Consultation)
            .where(
                (Consultation.seeker_id == user_id) | (Consultation.practitioner_user_id == user_id)
            )
            .order_by(Consultation.created_at.desc())  # type: ignore[attr-defined]
            .limit(limit)
        ).all()
    )


def messages(session: Session, consultation_id: str) -> list[ConsultationMessage]:
    return list(
        session.exec(
            select(ConsultationMessage)
            .where(ConsultationMessage.consultation_id == consultation_id)
            .order_by(ConsultationMessage.created_at.asc())  # type: ignore[attr-defined]
        ).all()
    )


def events(session: Session, consultation_id: str) -> list[ConsultationEvent]:
    return list(
        session.exec(
            select(ConsultationEvent)
            .where(ConsultationEvent.consultation_id == consultation_id)
            .order_by(ConsultationEvent.created_at.asc())  # type: ignore[attr-defined]
        ).all()
    )


def active_grant(session: Session, practitioner_user_id: str, kundali_id: str) -> ChartGrant | None:
    """A live grant, or nothing. Revoked grants are never returned."""
    return session.exec(
        select(ChartGrant).where(
            ChartGrant.practitioner_user_id == practitioner_user_id,
            ChartGrant.kundali_id == kundali_id,
            ChartGrant.revoked_at.is_(None),  # type: ignore[union-attr]
        )
    ).first()


def grants_of(session: Session, seeker_id: str) -> list[ChartGrant]:
    return list(
        session.exec(
            select(ChartGrant)
            .where(ChartGrant.seeker_id == seeker_id)
            .order_by(ChartGrant.granted_at.desc())  # type: ignore[attr-defined]
        ).all()
    )


def grant(session: Session, grant_id: str) -> ChartGrant | None:
    return session.exec(select(ChartGrant).where(ChartGrant.id == grant_id)).first()


def access_log(session: Session, grant_id: str) -> list[GrantAccess]:
    return list(
        session.exec(
            select(GrantAccess)
            .where(GrantAccess.grant_id == grant_id)
            .order_by(GrantAccess.created_at.desc())  # type: ignore[attr-defined]
        ).all()
    )


def save(session: Session, row):  # noqa: ANN001 -- any of this module's models
    session.add(row)
    session.commit()
    session.refresh(row)
    return row


# --- reviews ---


def review_for(session: Session, consultation_id: str) -> Review | None:
    return session.exec(select(Review).where(Review.consultation_id == consultation_id)).first()


def review(session: Session, review_id: str) -> Review | None:
    return session.exec(select(Review).where(Review.id == review_id)).first()


def reviews_of(session: Session, practitioner_user_id: str, limit: int = 20) -> list[Review]:
    return list(
        session.exec(
            select(Review)
            .where(Review.practitioner_user_id == practitioner_user_id)
            .order_by(Review.created_at.desc())  # type: ignore[attr-defined]
            .limit(limit)
        ).all()
    )


def rating_summary(session: Session, practitioner_user_id: str) -> tuple[float | None, int]:
    """Average and count. `None` when nobody has rated them.

    Not zero: a practitioner with no ratings has no rating, and rendering that
    as 0.0 says they are terrible rather than new.
    """
    rows = session.exec(
        select(Review.rating).where(Review.practitioner_user_id == practitioner_user_id)
    ).all()
    if not rows:
        return None, 0
    return round(sum(rows) / len(rows), 2), len(rows)


def completed_count(session: Session, practitioner_user_id: str) -> int:
    return len(
        session.exec(
            select(Consultation.id).where(
                Consultation.practitioner_user_id == practitioner_user_id,
                Consultation.state == "ended",
            )
        ).all()
    )


# --- follows ---


def follow_row(session: Session, follower_id: str, practitioner_user_id: str) -> Follow | None:
    return session.exec(
        select(Follow).where(
            Follow.follower_id == follower_id,
            Follow.practitioner_user_id == practitioner_user_id,
        )
    ).first()


def follower_count(session: Session, practitioner_user_id: str) -> int:
    return len(
        session.exec(
            select(Follow.id).where(Follow.practitioner_user_id == practitioner_user_id)
        ).all()
    )


def following(session: Session, follower_id: str) -> list[Follow]:
    return list(
        session.exec(
            select(Follow)
            .where(Follow.follower_id == follower_id)
            .order_by(Follow.created_at.desc())  # type: ignore[attr-defined]
        ).all()
    )


def conversation_previews(
    session: Session, consultation_ids: list[str], viewer_id: str
) -> dict[str, tuple[str, str, int]]:
    """Last message and unread count per consultation, in two queries.

    One query per row would be the obvious way to write this and would make the
    inbox slower with every conversation somebody has.
    """
    if not consultation_ids:
        return {}

    rows = session.exec(
        select(ConsultationMessage)
        .where(ConsultationMessage.consultation_id.in_(consultation_ids))  # type: ignore[attr-defined]
        .order_by(ConsultationMessage.created_at.asc())  # type: ignore[attr-defined]
    ).all()

    previews: dict[str, tuple[str, str, int]] = {}
    for row in rows:
        body, _, unread = previews.get(row.consultation_id, ("", "", 0))
        # Unread means: they sent it, and this reader has not opened it.
        if row.sender_id != viewer_id and row.read_at is None:
            unread += 1
        previews[row.consultation_id] = (row.body, row.created_at, unread)
    return previews


def reviewed_ids(session: Session, consultation_ids: list[str]) -> set[str]:
    """Which of these already carry a review. One query, not one per row."""
    if not consultation_ids:
        return set()
    rows = session.exec(
        select(Review.consultation_id).where(
            Review.consultation_id.in_(consultation_ids)  # type: ignore[attr-defined]
        )
    ).all()
    return set(rows)
