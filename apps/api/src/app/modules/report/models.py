"""Stored readings.

A report costs a minute of model time and real money, and for a given chart in a
given language it is the same reading every time. Regenerating it on every page
refresh was paying for that twice.

The row is keyed by what the reading actually depends on, not by whatever id was
convenient — see `report/cache_key.py` for why each ingredient is in there.
"""

from __future__ import annotations

from sqlalchemy import JSON, Column, Index, UniqueConstraint
from sqlmodel import Field, SQLModel


class StoredReport(SQLModel, table=True):
    __tablename__ = "reports"
    __table_args__ = (
        # One reading per chart per language. The three languages are three
        # separate readings, not translations of one — the model writes each in
        # its own idiom — so they are three rows and the language is part of the
        # key rather than a column you filter on afterwards.
        UniqueConstraint("user_id", "chart_key", "language", name="uq_reports_lookup"),
        Index("idx_reports_lookup", "user_id", "chart_key", "language"),
    )

    id: str = Field(primary_key=True, max_length=64)
    user_id: str = Field(max_length=64)
    #: Hash over the birth data and engine version. See `cache_key.py`.
    chart_key: str = Field(max_length=64)
    language: str = Field(max_length=8)
    #: The engine that produced the chart this reading describes. Also inside
    #: `chart_key`; kept as a column so a stale generation can be found and
    #: cleared without recomputing every hash (CLAUDE.md rule 4).
    engine_version: str = Field(max_length=32)
    #: Which model wrote it. Deliberately NOT part of the key: a reading does
    #: not become untrue because a better model exists, and keying on it would
    #: silently re-bill every stored report the day the model id changes.
    model: str = Field(max_length=128)
    sections: list = Field(default_factory=list, sa_column=Column(JSON))
    created_at: str
