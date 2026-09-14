"""The one piece of kundali generation that touches the database.

Everything else in this module is pure computation on purpose (service.py's
own docstring says so) — this counter is the exception, kept out of it rather
than compromising that purity.
"""

from __future__ import annotations

from datetime import UTC, datetime

from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlmodel import Session

from app.modules.kundali.models import GuestGenerationCount


def record_guest_generation(session: Session) -> None:
    """One more anonymous chart generated today.

    A plain select-then-insert-or-update races under concurrent anonymous
    requests: two callers can both miss an existing row and both try to
    INSERT the same date, and the loser's request would 500 on a primary-key
    violation — over a background counter, not the chart the caller actually
    asked for. An atomic upsert has no such window.
    """
    today = datetime.now(UTC).strftime("%Y-%m-%d")
    stmt = pg_insert(GuestGenerationCount).values(date=today, count=1)
    stmt = stmt.on_conflict_do_update(
        index_elements=[GuestGenerationCount.date],
        set_={"count": GuestGenerationCount.count + 1},
    )
    session.execute(stmt)
    session.commit()
