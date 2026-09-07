"""Vault business logic. No FastAPI imports, no raw SQL.

Failures raise `AppError` subclasses; `install_error_handlers` maps them to the
shared error envelope. Routers catch nothing.
"""

from __future__ import annotations

import uuid
from datetime import UTC, datetime
from typing import Any

from sqlmodel import Session

from app.core.errors import NotFoundError
from app.modules.kundali.schemas import BirthDetailsIn
from app.modules.vault import repository
from app.modules.vault.models import ChatMessage as ChatMessageRow
from app.modules.vault.models import ChatSession as ChatSessionRow
from app.modules.vault.models import SavedKundali as SavedKundaliRow
from app.modules.vault.schemas import (
    ChatMessageIn,
    ChatMessageOut,
    ChatSessionIn,
    ChatSessionOut,
    SavedKundaliIn,
    SavedKundaliOut,
)


class KundaliNotFoundError(NotFoundError):
    code = "kundali_not_found"

    def __init__(self) -> None:
        super().__init__("Saved kundali not found.")


class SessionNotFoundError(NotFoundError):
    code = "session_not_found"

    def __init__(self) -> None:
        # Also raised when the row exists but belongs to someone else: every
        # query is scoped by user_id, so "not yours" and "not there" are
        # indistinguishable to the caller. A 403 would confirm the id exists.
        super().__init__("Chat session not found.")


# --- Saved kundalis ---


def list_kundalis(session: Session, user_id: str) -> list[SavedKundaliOut]:
    return [_to_kundali(row) for row in repository.list_kundalis(session, user_id)]


def save_kundali(session: Session, body: SavedKundaliIn, user_id: str) -> SavedKundaliOut:
    row = repository.create_kundali(
        session,
        SavedKundaliRow(
            id=f"knd_{uuid.uuid4().hex[:12]}",
            user_id=user_id,
            created_at=datetime.now(UTC).isoformat(),
            **body.model_dump(),
        ),
    )
    return _to_kundali(row)


def delete_kundali(session: Session, kundali_id: str, user_id: str) -> None:
    if repository.delete_kundali(session, kundali_id, user_id) == 0:
        raise KundaliNotFoundError()


# --- Chat sessions ---


def list_sessions(session: Session, user_id: str) -> list[ChatSessionOut]:
    # Messages are deliberately not loaded here. Doing so cost one query per
    # session — 41 round trips for 40 sessions — to return message bodies no
    # list view renders. Fetch a single session for its messages.
    return [
        ChatSessionOut(**row.model_dump(), messages=[])
        for row in repository.list_sessions(session, user_id)
    ]


def get_session_detail(session: Session, session_id: str, user_id: str) -> ChatSessionOut:
    row = repository.find_session(session, session_id, user_id)
    if not row:
        raise SessionNotFoundError()
    messages = [
        ChatMessageOut(**m.model_dump()) for m in repository.list_messages(session, session_id)
    ]
    return ChatSessionOut(**row.model_dump(), messages=messages)


def create_session(session: Session, body: ChatSessionIn, user_id: str) -> ChatSessionOut:
    now_iso = datetime.now(UTC).isoformat()
    row = repository.create_session(
        session,
        ChatSessionRow(
            id=f"ses_{uuid.uuid4().hex[:12]}",
            user_id=user_id,
            kundali_id=body.kundali_id,
            title=body.title,
            created_at=now_iso,
            updated_at=now_iso,
        ),
    )
    return ChatSessionOut(**row.model_dump(), messages=[])


def delete_session(session: Session, session_id: str, user_id: str) -> None:
    if repository.delete_session(session, session_id, user_id) == 0:
        raise SessionNotFoundError()


def add_message(
    session: Session, session_id: str, body: ChatMessageIn, user_id: str
) -> ChatMessageOut:
    # Ownership is checked before the insert: without it, anyone holding a valid
    # token could append messages to any session id they can guess.
    chat_session = repository.find_session(session, session_id, user_id)
    if not chat_session:
        raise SessionNotFoundError()

    row = repository.create_message(
        session,
        ChatMessageRow(
            id=f"msg_{uuid.uuid4().hex[:12]}",
            session_id=session_id,
            sender=body.sender,
            content=body.content,
            created_at=datetime.now(UTC).isoformat(),
        ),
        chat_session,
    )
    return ChatMessageOut(**row.model_dump())


# --- Mapping ---


def _to_kundali(row: SavedKundaliRow) -> SavedKundaliOut:
    data = row.model_dump()
    return SavedKundaliOut(**data, birth=_to_birth(data))


def _to_birth(row: dict[str, Any]) -> BirthDetailsIn | None:
    """The saved row in the shape `/v1/kundali` accepts, or None if it cannot be.

    Derived rather than stored: the flat columns stay the single source of truth,
    so there is no second copy to drift. Returns None for rows saved before
    `tz_name` existed — those genuinely cannot be recalculated correctly, and
    inventing a zone from `tz_offset` would produce a chart that looks right and
    is wrong by minutes of arc.
    """
    if not row.get("tz_name"):
        return None
    try:
        return BirthDetailsIn(
            name=row["name"],
            date=row["dob"],
            time=row["tob"],
            tz_name=row["tz_name"],
            latitude=row["lat"],
            longitude=row["lon"],
            place_label=row["place_name"],
            # ponytail: not a stored column. Add one when a caller needs to
            # distinguish an estimated birth time on a saved chart.
            time_accuracy="exact",
        )
    except ValueError:
        # A stored zone that zoneinfo no longer knows. Surfacing None is honest;
        # raising would make the whole list endpoint fail for one bad row.
        return None
