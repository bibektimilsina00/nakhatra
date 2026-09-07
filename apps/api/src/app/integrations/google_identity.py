"""Verification of Google ID tokens.

The one place a Google credential is checked. Verification is done locally
against Google's published JWKS rather than by calling their `tokeninfo`
endpoint: tokeninfo is a network round-trip on every single sign-in, and Google
documents it as a debugging aid rather than a production check.

PyJWT is already a dependency (it signs our own tokens), and `PyJWKClient`
fetches and caches the signing keys, so this needs no new package and no
hand-written crypto — which is the one thing you must never write yourself.

What a caller gets back is only what Google actually asserts. In particular an
unverified email is rejected here rather than downstream: `email_verified` false
means Google is telling you it does not know that this person owns that
address, and treating it as identity is an account-takeover vector — sign in as
`victim@example.com` on an account you merely claimed.
"""

from __future__ import annotations

import logging
from dataclasses import dataclass

import httpx
import jwt
from jwt import PyJWKClient

from app.core.config import get_settings
from app.core.errors import AppError

# Google's key set. Keys rotate; PyJWKClient re-fetches when it sees an unknown
# `kid`, and caches otherwise.
_JWKS_URI = "https://www.googleapis.com/oauth2/v3/certs"

# Google mints tokens under both spellings and treats them as equivalent.
_ISSUERS = ("https://accounts.google.com", "accounts.google.com")

_TOKEN_URI = "https://oauth2.googleapis.com/token"

_log = logging.getLogger(__name__)

_jwk_client = PyJWKClient(_JWKS_URI, cache_keys=True)


class GoogleAuthError(AppError):
    status_code = 401
    code = "google_auth_failed"

    def __init__(
        self,
        message: str = "Could not verify that Google account.",
        reason: str | None = None,
    ) -> None:
        # `reason` names the actual check that failed. In production it is
        # logged and nothing more — telling a caller which check failed helps
        # an attacker tune the next attempt and helps a real user not at all,
        # since they can only retry either way. Locally the opposite is true:
        # the message is the whole debugging loop, and "could not verify" sends
        # you reading server logs to learn something the server already knows.
        details = (
            {"reason": reason}
            if reason and get_settings().ENV == "local"
            else None
        )
        super().__init__(message, details)


class GoogleNotConfiguredError(AppError):
    # 503, not 500: the service is fine, this one sign-in method is switched off.
    status_code = 503
    code = "google_not_configured"

    def __init__(self) -> None:
        super().__init__("Google sign-in is not configured on this server.")


def exchange_code_for_id_token(code: str) -> str:
    """Trade an authorization code from the popup flow for an ID token.

    This is what allows the sign-in button to be ours: Google only hands a
    credential straight to JavaScript from a button it rendered itself, but the
    code flow can be started from any element and returns the same ID token one
    exchange later.

    `redirect_uri` is the literal string "postmessage" — the documented value
    for `ux_mode: "popup"`, where there is no redirect to receive the code.
    """
    settings = get_settings()
    if not settings.GOOGLE_CLIENT_ID or not settings.GOOGLE_CLIENT_SECRET:
        raise GoogleNotConfiguredError()

    try:
        response = httpx.post(
            _TOKEN_URI,
            data={
                "code": code,
                "client_id": settings.GOOGLE_CLIENT_ID,
                "client_secret": settings.GOOGLE_CLIENT_SECRET,
                "redirect_uri": "postmessage",
                "grant_type": "authorization_code",
            },
            timeout=10,
        )
    except httpx.HTTPError as exc:
        raise GoogleAuthError("Could not reach Google to complete sign-in.") from exc

    if response.status_code != 200:
        # Google's body names the failure: "invalid_grant" for a reused or
        # expired code, "invalid_client" for a wrong id/secret pair, and
        # "redirect_uri_mismatch" for the wrong flow. It belongs in the log,
        # not in the response — but it does have to actually reach the log,
        # or every one of those looks identical from the outside.
        _log.warning(
            "google token exchange failed: status=%s body=%s",
            response.status_code,
            response.text[:500],
        )
        raise GoogleAuthError(
            reason=f"token exchange {response.status_code}: {response.text[:300]}"
        )

    id_token = response.json().get("id_token")
    if not id_token:
        _log.warning(
            "google token exchange returned no id_token; keys=%s",
            sorted(response.json().keys()),
        )
        raise GoogleAuthError()
    return id_token


@dataclass(frozen=True)
class GoogleIdentity:
    """The claims we are willing to act on. Nothing else from the token is used."""

    subject: str
    email: str
    full_name: str


def verify_id_token(credential: str) -> GoogleIdentity:
    """Verify a Google ID token and return the identity it asserts.

    Raises `GoogleAuthError` for anything that fails — a bad signature, the
    wrong audience, an expired token, or an unverified email.
    """
    client_id = get_settings().GOOGLE_CLIENT_ID
    if not client_id:
        raise GoogleNotConfiguredError()

    try:
        signing_key = _jwk_client.get_signing_key_from_jwt(credential)
        claims = jwt.decode(
            credential,
            signing_key.key,
            algorithms=["RS256"],
            # `audience` is the check that stops a token minted for someone
            # else's app being replayed against ours.
            audience=client_id,
            issuer=list(_ISSUERS),
            options={"require": ["exp", "iat", "aud", "iss", "sub"]},
        )
    except jwt.PyJWTError as exc:
        # The reason stays in the log. Telling a caller which check failed
        # helps an attacker tune the next attempt and helps a real user not
        # at all — they can only retry either way.
        _log.warning("google id token rejected: %s: %s", type(exc).__name__, exc)
        raise GoogleAuthError(reason=f"{type(exc).__name__}: {exc}") from exc

    email = (claims.get("email") or "").strip().lower()
    if not email or not claims.get("email_verified"):
        _log.warning("google identity has no verified email: email_set=%s", bool(email))
        raise GoogleAuthError("That Google account has no verified email address.")

    return GoogleIdentity(
        subject=str(claims["sub"]),
        email=email,
        # `name` is absent when the user withholds the profile scope; the local
        # part of the address is a better placeholder than an empty display name.
        full_name=(claims.get("name") or email.split("@")[0]).strip()[:100],
    )
