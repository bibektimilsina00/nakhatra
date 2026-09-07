"""Who may call what.

Roles live here rather than in `router_deps.py` so that a module needing to
*check* a role does not have to import the dependency that *enforces* it — the
same reason `router_deps` exists apart from `router`.
"""

from __future__ import annotations

from fastapi import Depends
from sqlmodel import Session, select

from app.core.db import SessionDep
from app.core.errors import AppError
from app.modules.auth.models import User
from app.modules.auth.router_deps import get_current_user

SEEKER = "seeker"
PRACTITIONER = "practitioner"
ADMIN = "admin"


class ForbiddenError(AppError):
    status_code = 403
    code = "forbidden"


def role_of(session: Session, user_id: str) -> str:
    """A user's role, treating a missing one as `seeker`.

    Rows written before the column existed have NULL, and so do rows written by
    any client that does not know about it. Both mean "an ordinary user", and
    resolving that here means no backfill is needed for the check to be right.
    """
    user = session.exec(select(User).where(User.id == user_id)).first()
    if user is None:
        raise ForbiddenError("Unknown account.")
    return user.role or SEEKER


def require_role(*allowed: str):
    """Dependency factory: `Depends(require_role(ADMIN))`.

    Returns the user id, so a route that needs both the id and the role check
    takes one dependency instead of two that could disagree about which user
    they are talking about.
    """

    def dependency(session: SessionDep, user_id: str = Depends(get_current_user)) -> str:
        if role_of(session, user_id) not in allowed:
            # Deliberately not "you are a seeker, you need to be an admin":
            # an endpoint that reports what role you lack is an endpoint that
            # enumerates the roles that exist.
            raise ForbiddenError("This account cannot perform that action.")
        return user_id

    return dependency
