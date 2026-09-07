from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, EmailStr, Field, model_validator

from app.modules.auth.jwt_handler import TOKEN_TTL_SECONDS


class UserSignupIn(BaseModel):
    email: EmailStr
    # 8, not 6. Narrowing an input constraint is normally a rule 7 violation, but
    # `apps/mobile` has no auth feature yet, so the web client we control is the
    # only caller. Tighten now, while that is still true.
    password: str = Field(..., min_length=8, max_length=100)
    full_name: str = Field(..., min_length=1, max_length=100)


class UserLoginIn(BaseModel):
    email: EmailStr
    # Deliberately not min_length=8: existing accounts have shorter passwords and
    # must still be able to log in (and then be rehashed).
    password: str = Field(..., min_length=1)


class GoogleSignInIn(BaseModel):
    """One Google sign-in, arriving by either of the two flows Google offers.

    `code` is the web client's: a popup auth-code flow, which is the only way
    to start sign-in from a button we designed ourselves. `credential` is an
    ID token handed straight to the page, which is what a native mobile Google
    Sign-In returns. Both end at the same verified identity.
    """

    code: str | None = Field(default=None, min_length=1, max_length=2048)
    credential: str | None = Field(default=None, min_length=1, max_length=4096)

    @model_validator(mode="after")
    def _exactly_one(self) -> GoogleSignInIn:
        if bool(self.code) == bool(self.credential):
            raise ValueError("Send exactly one of `code` or `credential`.")
        return self


class UserProfileOut(BaseModel):
    id: str
    email: str
    full_name: str
    #: `seeker` | `practitioner` | `admin`. Additive, and never trusted for
    #: authorisation — every protected route checks the role server-side. This
    #: exists so the interface can offer the review queue to someone who can
    #: actually open it, rather than to everyone.
    role: str = "seeker"
    # Typed as a datetime rather than the column's TEXT. ISO-8601 serialises
    # identically, so this is not a wire change — but it survives Phase 9 turning
    # the column into a real timestamp.
    created_at: datetime


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int = Field(
        default=TOKEN_TTL_SECONDS,
        description="Token lifetime in seconds. Without it a client only learns "
        "the token expired by receiving a 401.",
    )
    user: UserProfileOut
