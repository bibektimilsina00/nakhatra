"""Data access for stored readings.

Every lookup is scoped by `user_id` in the query itself — a reading is derived
from birth data, which does not leave its owner (CLAUDE.md rule 9).
"""

from __future__ import annotations

import uuid
from datetime import UTC, datetime

from sqlmodel import Session, select

from app.modules.report.models import StoredReport


def get(session: Session, user_id: str, key: str, language: str) -> StoredReport | None:
    return session.exec(
        select(StoredReport).where(
            StoredReport.user_id == user_id,
            StoredReport.chart_key == key,
            StoredReport.language == language,
        )
    ).first()


def put(
    session: Session,
    *,
    user_id: str,
    key: str,
    language: str,
    engine_version: str,
    model: str,
    sections: list[dict],
) -> StoredReport:
    """Store a reading, replacing any earlier one for the same chart+language.

    Replace rather than skip-if-present: two tabs can finish generating the same
    reading at once, and the unique constraint would turn the loser into a 500
    on a request that had otherwise succeeded. The two are equivalent readings,
    so last-writer-wins costs nothing.
    """
    existing = get(session, user_id, key, language)
    if existing is not None:
        existing.sections = sections
        existing.engine_version = engine_version
        existing.model = model
        existing.created_at = datetime.now(UTC).isoformat()
        session.add(existing)
        session.commit()
        session.refresh(existing)
        return existing

    row = StoredReport(
        id=uuid.uuid4().hex,
        user_id=user_id,
        chart_key=key,
        language=language,
        engine_version=engine_version,
        model=model,
        sections=sections,
        created_at=datetime.now(UTC).isoformat(),
    )
    session.add(row)
    session.commit()
    session.refresh(row)
    return row


def delete_for_chart(session: Session, user_id: str, key: str) -> int:
    """Drop every language for one chart. Used when a reading is regenerated."""
    rows = list(
        session.exec(
            select(StoredReport).where(
                StoredReport.user_id == user_id, StoredReport.chart_key == key
            )
        ).all()
    )
    for row in rows:
        session.delete(row)
    session.commit()
    return len(rows)
