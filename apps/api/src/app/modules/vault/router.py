"""Cloud Vault endpoints. Routes only — no SQL, no business logic, no try/except."""

from __future__ import annotations

from fastapi import APIRouter, Depends

from app.core.db import SessionDep
from app.modules.auth.router_deps import get_current_user
from app.modules.vault import service
from app.modules.vault.schemas import (
    ChatMessageIn,
    ChatMessageOut,
    ChatSessionIn,
    ChatSessionOut,
    SavedKundaliIn,
    SavedKundaliOut,
)

router = APIRouter(prefix="/v1/vault", tags=["vault"])


@router.get("/kundalis", response_model=list[SavedKundaliOut])
def list_kundalis(
    session: SessionDep, user_id: str = Depends(get_current_user)
) -> list[SavedKundaliOut]:
    return service.list_kundalis(session, user_id)


@router.post("/kundalis", response_model=SavedKundaliOut)
def save_kundali(
    body: SavedKundaliIn,
    session: SessionDep,
    user_id: str = Depends(get_current_user),
) -> SavedKundaliOut:
    return service.save_kundali(session, body, user_id)


@router.delete("/kundalis/{kundali_id}")
def delete_kundali(
    kundali_id: str, session: SessionDep, user_id: str = Depends(get_current_user)
) -> dict[str, bool]:
    service.delete_kundali(session, kundali_id, user_id)
    return {"success": True}


@router.get("/sessions", response_model=list[ChatSessionOut])
def list_sessions(
    session: SessionDep, user_id: str = Depends(get_current_user)
) -> list[ChatSessionOut]:
    return service.list_sessions(session, user_id)


@router.post("/sessions", response_model=ChatSessionOut)
def create_session(
    body: ChatSessionIn,
    session: SessionDep,
    user_id: str = Depends(get_current_user),
) -> ChatSessionOut:
    return service.create_session(session, body, user_id)


@router.get("/sessions/{session_id}", response_model=ChatSessionOut)
def get_session(
    session_id: str, session: SessionDep, user_id: str = Depends(get_current_user)
) -> ChatSessionOut:
    return service.get_session_detail(session, session_id, user_id)


@router.get("/sessions/{session_id}/messages", response_model=list[ChatMessageOut])
def get_session_messages(
    session_id: str, session: SessionDep, user_id: str = Depends(get_current_user)
) -> list[ChatMessageOut]:
    return service.list_session_messages(session, session_id, user_id)


@router.post("/sessions/{session_id}/messages", response_model=ChatMessageOut)
def add_message(
    session_id: str,
    body: ChatMessageIn,
    session: SessionDep,
    user_id: str = Depends(get_current_user),
) -> ChatMessageOut:
    return service.add_message(session, session_id, body, user_id)


@router.delete("/sessions/{session_id}")
def delete_session(
    session_id: str, session: SessionDep, user_id: str = Depends(get_current_user)
) -> dict[str, bool]:
    service.delete_session(session, session_id, user_id)
    return {"success": True}
