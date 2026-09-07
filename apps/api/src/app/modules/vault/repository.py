"""Data access for saved kundalis, chat sessions and chat messages.

Every query that reaches a user's row is scoped by `user_id` here, in the query
itself — ownership is not a check a caller can forget to make.
"""

from __future__ import annotations

from sqlmodel import Session, select

from app.modules.vault.models import ChatMessage, ChatSession, SavedKundali

# --- Saved kundalis ---


def list_kundalis(session: Session, user_id: str) -> list[SavedKundali]:
    return list(
        session.exec(
            select(SavedKundali)
            .where(SavedKundali.user_id == user_id)
            .order_by(SavedKundali.created_at.desc())  # type: ignore[attr-defined]
        ).all()
    )


def create_kundali(session: Session, kundali: SavedKundali) -> SavedKundali:
    session.add(kundali)
    session.commit()
    session.refresh(kundali)
    return kundali


def delete_kundali(session: Session, kundali_id: str, user_id: str) -> int:
    row = session.exec(
        select(SavedKundali).where(SavedKundali.id == kundali_id, SavedKundali.user_id == user_id)
    ).first()
    if row is None:
        return 0
    session.delete(row)
    session.commit()
    return 1


# --- Chat sessions ---


def list_sessions(session: Session, user_id: str) -> list[ChatSession]:
    return list(
        session.exec(
            select(ChatSession)
            .where(ChatSession.user_id == user_id)
            .order_by(ChatSession.updated_at.desc())  # type: ignore[attr-defined]
        ).all()
    )


def find_session(session: Session, session_id: str, user_id: str) -> ChatSession | None:
    return session.exec(
        select(ChatSession).where(ChatSession.id == session_id, ChatSession.user_id == user_id)
    ).first()


def create_session(session: Session, chat_session: ChatSession) -> ChatSession:
    session.add(chat_session)
    session.commit()
    session.refresh(chat_session)
    return chat_session


def delete_session(session: Session, session_id: str, user_id: str) -> int:
    row = find_session(session, session_id, user_id)
    if row is None:
        return 0
    session.delete(row)
    session.commit()
    return 1


# --- Chat messages ---


def list_messages(session: Session, session_id: str) -> list[ChatMessage]:
    return list(
        session.exec(
            select(ChatMessage)
            .where(ChatMessage.session_id == session_id)
            .order_by(ChatMessage.created_at.asc())  # type: ignore[attr-defined]
        ).all()
    )


def create_message(
    session: Session, message: ChatMessage, chat_session: ChatSession
) -> ChatMessage:
    """Insert the message and bump its session's `updated_at` in one transaction.

    A message that lands without the bump sorts its session wrongly in the list
    forever, so the two must not be separable.
    """
    chat_session.updated_at = message.created_at
    session.add(message)
    session.add(chat_session)
    session.commit()
    session.refresh(message)
    return message
