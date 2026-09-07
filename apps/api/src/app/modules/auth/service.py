"""Auth business logic. No FastAPI imports, no raw SQL.

Every failure raises an `AppError` subclass from `app.core.errors`; the handlers
installed in `main.py` turn those into the `{"error": {code, message, details}}`
envelope both clients parse. Routers do not catch anything.
"""

from __future__ import annotations

import secrets
import uuid
from datetime import UTC, datetime

from sqlmodel import Session

from app.core.errors import AppError, NotFoundError
from app.integrations.google_identity import exchange_code_for_id_token, verify_id_token
from app.modules.auth import hashing, repository
from app.modules.auth.jwt_handler import create_jwt_token
from app.modules.auth.models import User
from app.modules.auth.schemas import (
    GoogleSignInIn,
    TokenResponse,
    UserLoginIn,
    UserProfileOut,
    UserSignupIn,
)


class EmailAlreadyRegisteredError(AppError):
    # 400 rather than the more accurate 409: the current API already returns 400
    # here and clients may switch on it. Correcting the status buys nothing and
    # is a client-visible change (rule 7).
    status_code = 400
    code = "email_taken"

    def __init__(self) -> None:
        super().__init__("That email is already registered.")


class InvalidCredentialsError(AppError):
    status_code = 401
    code = "invalid_credentials"

    def __init__(self) -> None:
        # Deliberately does not say which of email or password was wrong — that
        # distinction is a user-enumeration oracle.
        super().__init__("Invalid email or password.")


class UserNotFoundError(NotFoundError):
    code = "user_not_found"

    def __init__(self) -> None:
        super().__init__("User not found.")


def signup(session: Session, body: UserSignupIn) -> TokenResponse:
    email = body.email.lower()
    if repository.find_by_email(session, email):
        raise EmailAlreadyRegisteredError()

    row = repository.create(
        session,
        user_id=f"usr_{uuid.uuid4().hex[:12]}",
        email=email,
        password_hash=hashing.hash_password(body.password),
        full_name=body.full_name,
        created_at=datetime.now(UTC).isoformat(),
    )
    return _token_for(_profile(row))


def login(session: Session, body: UserLoginIn) -> TokenResponse:
    row = repository.find_by_email(session, body.email)
    if not row or not hashing.verify_password(body.password, row.password_hash):
        raise InvalidCredentialsError()

    # Upgrade legacy PBKDF2 hashes here: the plaintext only exists at this moment,
    # so a migration can never do it. Without this, every account created before
    # the argon2 switch keeps its timestamp-derived salt forever.
    if hashing.needs_rehash(row.password_hash):
        repository.update_password_hash(session, row, hashing.hash_password(body.password))

    return _token_for(_profile(row))


def sign_in_with_google(session: Session, body: GoogleSignInIn) -> TokenResponse:
    """Exchange a verified Google ID token for one of ours.

    Accounts are matched on email. Google only ever gets here with
    `email_verified` true, so an existing password account with the same address
    is the same person and is signed in rather than refused — refusing would
    leave them with two accounts and no way to merge them.

    A user created this way gets a random password hash rather than a nullable
    column: no migration, and no row where "no password" and "empty password"
    look alike. They cannot log in with a password because nobody, including
    them, knows what it is.
    """
    # The popup flow hands us a one-use code; the mobile flow hands us the ID
    # token directly. Everything after this line is identical.
    id_token = exchange_code_for_id_token(body.code) if body.code else body.credential
    identity = verify_id_token(id_token)  # type: ignore[arg-type]

    row = repository.find_by_email(session, identity.email)
    if row is None:
        row = repository.create(
            session,
            user_id=f"usr_{uuid.uuid4().hex[:12]}",
            email=identity.email,
            password_hash=hashing.hash_password(secrets.token_urlsafe(32)),
            full_name=identity.full_name,
            created_at=datetime.now(UTC).isoformat(),
        )

    return _token_for(_profile(row))


def get_profile(session: Session, user_id: str) -> UserProfileOut:
    row = repository.find_by_id(session, user_id)
    if not row:
        raise UserNotFoundError()
    return _profile(row)


def _profile(row: User) -> UserProfileOut:
    """Table row to wire shape. `password_hash` is not in `UserProfileOut`, and
    mapping explicitly is what keeps it that way."""
    return UserProfileOut(
        id=row.id,
        email=row.email,
        full_name=row.full_name,
        # NULL on every row written before the column existed, and on any row a
        # client that predates it writes. Both mean an ordinary user.
        role=row.role or "seeker",
        created_at=row.created_at,
    )


def _token_for(user: UserProfileOut) -> TokenResponse:
    token = create_jwt_token({"sub": user.id, "email": user.email})
    return TokenResponse(access_token=token, user=user)
