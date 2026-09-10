"""Data access for the daily publication."""

from __future__ import annotations

from datetime import UTC, datetime

from sqlalchemy.exc import IntegrityError
from sqlmodel import Session, select

from app.modules.rasifal.models import DailyRashifal


def get(session: Session, on_date: str, language: str) -> DailyRashifal | None:
    return session.exec(
        select(DailyRashifal)
        .where(DailyRashifal.on_date == on_date)
        .where(DailyRashifal.language == language)
    ).first()


def publish(session: Session, row: DailyRashifal) -> DailyRashifal:
    """Write the day, or return the one already published.

    The unique constraint is the arbiter rather than a check-then-insert: two
    workers can reach here at the same moment, and exactly one of them wins.
    The loser reads what the winner wrote instead of raising.
    """
    session.add(row)
    try:
        session.commit()
    except IntegrityError:
        session.rollback()
        existing = get(session, row.on_date, row.language)
        if existing is not None:
            return existing
        raise
    session.refresh(row)
    return row


def replace(session: Session, row: DailyRashifal) -> DailyRashifal:
    """Overwrite a day. Only the operator's regenerate path uses this."""
    existing = get(session, row.on_date, row.language)
    if existing is None:
        return publish(session, row)
    existing.content_json = row.content_json
    existing.astrology_data_json = row.astrology_data_json
    existing.model = row.model
    existing.prompt_version = row.prompt_version
    existing.updated_at = datetime.now(UTC)
    session.add(existing)
    session.commit()
    session.refresh(existing)
    return existing
