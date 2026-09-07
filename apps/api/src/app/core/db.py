"""Database engine and per-request sessions.

Replaces a hand-rolled wrapper that did `sql.replace("?", "%s")` to fake
Postgres placeholders and cached **one** connection in a module global — the
same connection handed to every request thread, which psycopg2 does not support.
Under concurrency that produces interleaved transactions and intermittent
`InterfaceError`s, in production, under load.

Tables are created by Alembic (`make migrate`), never by the application at
import time. Tests build them from `SQLModel.metadata` instead; the two are
asserted equal in `tests/modules/test_migrations.py`.
"""

from __future__ import annotations

import os
from collections.abc import Iterator
from pathlib import Path
from typing import Annotated

from fastapi import Depends
from sqlmodel import Session, SQLModel, create_engine

from app.core.config import get_settings

DB_PATH = Path(__file__).resolve().parents[3] / "data" / "kundali_vault.sqlite3"

_engine = None


def database_url() -> str:
    """The one answer to 'which database is this?', shared with Alembic."""
    url = os.getenv("DATABASE_URL") or get_settings().DATABASE_URL
    if url:
        # The app's URL may name psycopg (v3); psycopg2-binary is what is
        # installed, and SQLAlchemy needs the driver spelled correctly.
        return url.replace("postgresql+psycopg://", "postgresql+psycopg2://", 1)
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    return f"sqlite:///{DB_PATH}"


def get_engine():
    """Lazily built so tests can point `DATABASE_URL` somewhere else first."""
    global _engine
    if _engine is None:
        url = database_url()
        _engine = create_engine(
            url,
            # Recycles a connection the database closed while it sat in the
            # pool, instead of failing the first request that borrows it.
            pool_pre_ping=True,
            connect_args={"check_same_thread": False} if url.startswith("sqlite") else {},
        )
    return _engine


def get_session() -> Iterator[Session]:
    """FastAPI dependency: one session per request, closed when it ends."""
    with Session(get_engine()) as session:
        yield session


# One definition of "this endpoint needs a database", used by every router.
SessionDep = Annotated[Session, Depends(get_session)]


def create_all() -> None:
    """Build the schema from the models. Tests only — production migrates."""
    import app.modules.auth.models  # noqa: F401
    import app.modules.billing.models  # noqa: F401
    import app.modules.consultations.models  # noqa: F401
    import app.modules.practitioners.models  # noqa: F401
    import app.modules.report.models  # noqa: F401
    import app.modules.vault.models  # noqa: F401

    SQLModel.metadata.create_all(get_engine())
