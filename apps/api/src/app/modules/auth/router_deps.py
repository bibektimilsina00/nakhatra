"""Shared auth dependencies.

Separate from `router.py` so vault, chat, report and tts can depend on
`get_current_user` without importing the auth router — which would make the
module graph circular the first time auth needs anything from them.
"""

from __future__ import annotations

from fastapi import Header

from app.core.errors import AppError
from app.modules.auth.jwt_handler import decode_jwt_token


class NotAuthenticatedError(AppError):
    status_code = 401
    code = "not_authenticated"


def get_current_user(authorization: str | None = Header(None)) -> str:
    """Verify the Bearer token and return the user id."""
    if not authorization or not authorization.startswith("Bearer "):
        raise NotAuthenticatedError("Missing or invalid Authorization header.")

    payload = decode_jwt_token(authorization.split(" ", 1)[1])
    if not payload or "sub" not in payload:
        raise NotAuthenticatedError("Invalid or expired token.")

    return str(payload["sub"])


def get_optional_user(authorization: str | None = Header(None)) -> str | None:
    """The user id when signed in, `None` when not.

    A public page that shows one extra thing to a signed-in reader — whether
    they already follow this practitioner — must not 401 the anonymous reader
    who is deciding whether to sign up at all.
    """
    try:
        return get_current_user(authorization)
    except NotAuthenticatedError:
        return None
