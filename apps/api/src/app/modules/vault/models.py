"""Table models for the vault.

Indexes are declared in `__table_args__` with their existing names rather than
via `Field(index=True)`. SQLAlchemy would name those `ix_<table>_<column>`, while
every deployed database already has `idx_<table>_<column>` from the baseline
migration — so the convenient spelling would have quietly created a second index
on every indexed column and left the first one orphaned.
"""

from __future__ import annotations

from sqlalchemy import Index
from sqlmodel import Field, SQLModel


class SavedKundali(SQLModel, table=True):
    __tablename__ = "saved_kundalis"
    __table_args__ = (Index("idx_saved_kundalis_user_id", "user_id"),)

    id: str = Field(primary_key=True, max_length=64)
    user_id: str = Field(max_length=64)
    name: str = Field(max_length=255)
    gender: str = Field(default="male", max_length=32)
    dob: str = Field(max_length=32)
    tob: str = Field(max_length=32)
    lat: float
    lon: float
    tz_offset: float
    # Nullable: rows written before the vault stored IANA zones. A row without
    # one cannot be recalculated correctly and must not be given a guess.
    tz_name: str | None = Field(default=None, max_length=64)
    place_name: str = Field(max_length=255)
    created_at: str


class ChatSession(SQLModel, table=True):
    __tablename__ = "chat_sessions"
    __table_args__ = (
        Index("idx_chat_sessions_user_id", "user_id"),
        Index("idx_chat_sessions_chart_key", "chart_key"),
    )

    id: str = Field(primary_key=True, max_length=64)
    user_id: str = Field(max_length=64)
    kundali_id: str | None = Field(default=None, max_length=64)
    chart_key: str | None = Field(default=None, max_length=255)
    title: str = Field(max_length=255)
    created_at: str
    updated_at: str


class ChatMessage(SQLModel, table=True):
    __tablename__ = "chat_messages"
    __table_args__ = (Index("idx_chat_messages_session_id", "session_id"),)

    id: str = Field(primary_key=True, max_length=64)
    session_id: str = Field(max_length=64)
    sender: str = Field(max_length=32)
    content: str
    created_at: str
