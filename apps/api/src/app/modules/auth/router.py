"""FastAPI auth endpoints. Routes only — no SQL, no business logic, no try/except.

`install_error_handlers` (main.py) maps every `AppError` the service raises to the
right status and the shared error envelope. A router that catches its own
service's exceptions is doing that job a second time, differently.
"""

from __future__ import annotations

from fastapi import APIRouter, Depends

from app.core.db import SessionDep
from app.modules.auth import service
from app.modules.auth.router_deps import get_current_user
from app.modules.auth.schemas import (
    GoogleSignInIn,
    TokenResponse,
    UserLoginIn,
    UserProfileOut,
    UserSignupIn,
)

router = APIRouter(prefix="/v1/auth", tags=["auth"])

# Re-exported: several modules already import get_current_user from this module.
__all__ = ["router", "get_current_user"]


@router.post("/signup", response_model=TokenResponse, summary="Create an account")
def signup(body: UserSignupIn, session: SessionDep) -> TokenResponse:
    return service.signup(session, body)


@router.post("/login", response_model=TokenResponse, summary="Exchange credentials for a token")
def login(body: UserLoginIn, session: SessionDep) -> TokenResponse:
    return service.login(session, body)


@router.post(
    "/google",
    response_model=TokenResponse,
    summary="Exchange a Google ID token for a token",
)
def google_sign_in(body: GoogleSignInIn, session: SessionDep) -> TokenResponse:
    return service.sign_in_with_google(session, body)


@router.get("/me", response_model=UserProfileOut, summary="The signed-in user's profile")
def me(
    session: SessionDep,
    user_id: str = Depends(get_current_user),
) -> UserProfileOut:
    return service.get_profile(session, user_id)
