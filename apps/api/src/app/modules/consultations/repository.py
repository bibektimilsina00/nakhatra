"""Data access for consultations and grants."""

from __future__ import annotations

from sqlmodel import Session, select

from app.modules.consultations.models import (
    ChartGrant,
    Consultation,
    ConsultationEvent,
    ConsultationMessage,
    GrantAccess,
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
