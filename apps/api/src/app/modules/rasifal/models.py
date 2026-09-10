"""The daily publication.

A rashifal is written once for a date and read by everyone — so it belongs in
the database, not in a per-process cache. The unique constraint on
(on_date, language) is the idempotency: two jobs racing, or a job re-run by a
nervous operator, cannot produce two publications for the same morning.
"""

from __future__ import annotations

from datetime import UTC, datetime

from sqlalchemy import Index, UniqueConstraint
from sqlmodel import Field, SQLModel


def _now() -> datetime:
    return datetime.now(UTC)


class DailyRashifal(SQLModel, table=True):
    __tablename__ = "daily_rashifal"
    __table_args__ = (
        # One publication per morning per language. This is the idempotency
        # the daily job leans on rather than a lock.
        UniqueConstraint("on_date", "language", name="uq_daily_rashifal_date_language"),
        Index("idx_daily_rashifal_on_date", "on_date"),
    )

    id: str = Field(primary_key=True, max_length=64)
    #: The Nepal calendar date this was written for, as YYYY-MM-DD. A string
    #: rather than a date column because that is what the rest of this schema
    #: does, and because the value is a Kathmandu day, not an instant.
    on_date: str = Field(max_length=16)
    language: str = Field(max_length=8)

    #: The twelve written readings, keyed by English sign name.
    content_json: str
    #: Exactly what the engine handed the writer. Kept so a bad reading can be
    #: traced to the findings behind it rather than guessed at.
    astrology_data_json: str

    model: str = Field(default="", max_length=128)
    prompt_version: str = Field(default="", max_length=32)

    created_at: datetime = Field(default_factory=_now)
    updated_at: datetime = Field(default_factory=_now)
