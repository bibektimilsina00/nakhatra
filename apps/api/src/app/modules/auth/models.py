"""Table models for auth.

Separate from `schemas.py` on purpose: these two look alike today and diverge the
moment a column is internal-only. `password_hash` is already that column — it is
in the table and must never be in a response.

`created_at` is `str`, matching the TEXT column the data is already in. Changing
it to a real timestamp is a data migration, not part of a persistence refactor.
"""

from __future__ import annotations

from sqlmodel import Field, SQLModel


class User(SQLModel, table=True):
    __tablename__ = "users"

    id: str = Field(primary_key=True, max_length=64)
    # `unique=True` already creates an index on both SQLite and Postgres, so
    # `index=True` here would add a second one covering the same column.
    email: str = Field(unique=True, max_length=255)
    password_hash: str
    full_name: str = Field(max_length=255)
    #: `seeker` | `practitioner` | `admin`.
    #:
    #: Nullable with a default so every existing row and every deployed mobile
    #: build is unaffected — the additive-only policy applies to columns as
    #: much as to routes (CLAUDE.md rule 7). Read through `role_of()`, which
    #: treats NULL as `seeker`, so no backfill is required for correctness.
    role: str | None = Field(default="seeker", max_length=32)
    created_at: str
