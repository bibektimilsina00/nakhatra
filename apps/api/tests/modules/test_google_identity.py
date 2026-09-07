"""`verify_id_token` against real RS256 signatures.

The endpoint tests mock this function out, which is right for them — they are
about account matching, not cryptography — but it left the one function that
actually verifies anything completely unexecuted. That gap shipped a real bug:
`pyjwt` without its `[crypto]` extra supports HMAC only, our own tokens are
HS256 so nothing complained, and every Google sign-in failed at runtime with
`MissingCryptographyError: RS256 requires 'cryptography' to be installed`.

So these tests sign genuine RS256 tokens with a throwaway key and hand the
matching public key to the JWKS lookup. If the crypto backend disappears again,
or the audience check is loosened, they fail here rather than in production.
"""

from __future__ import annotations

import time
from typing import Any

import jwt
import pytest
from cryptography.hazmat.primitives.asymmetric import rsa

from app.core.config import get_settings
from app.integrations import google_identity
from app.integrations.google_identity import GoogleAuthError, verify_id_token

CLIENT_ID = "test-client-id.apps.googleusercontent.com"

_key = rsa.generate_private_key(public_exponent=65537, key_size=2048)


def _token(**overrides: Any) -> str:
    now = int(time.time())
    claims: dict[str, Any] = {
        "iss": "https://accounts.google.com",
        "aud": CLIENT_ID,
        "sub": "1234567890",
        "email": "Seeker@Example.com",
        "email_verified": True,
        "name": "Sita Sharma",
        "iat": now,
        "exp": now + 3600,
    }
    claims.update(overrides)
    for key, value in list(claims.items()):
        if value is None:
            del claims[key]
    return jwt.encode(claims, _key, algorithm="RS256")


@pytest.fixture(autouse=True)
def google_configured(monkeypatch):
    settings = get_settings()
    previous = settings.GOOGLE_CLIENT_ID
    settings.GOOGLE_CLIENT_ID = CLIENT_ID

    # Stand in for Google's key server; the signature check itself is real.
    class _SigningKey:
        key = _key.public_key()

    monkeypatch.setattr(
        google_identity._jwk_client,
        "get_signing_key_from_jwt",
        lambda _token: _SigningKey(),
    )
    yield
    settings.GOOGLE_CLIENT_ID = previous


def test_rs256_is_supported_at_all():
    """The regression guard. Bare pyjwt offers HMAC only."""
    from jwt import algorithms

    assert algorithms.has_crypto, "pyjwt is missing its [crypto] extra"
    assert "RS256" in algorithms.get_default_algorithms()


def test_a_valid_token_yields_the_identity():
    identity = verify_id_token(_token())
    assert identity.subject == "1234567890"
    # Lowercased, because the vault matches accounts on email.
    assert identity.email == "seeker@example.com"
    assert identity.full_name == "Sita Sharma"


def test_the_alternate_issuer_spelling_is_accepted():
    """Google mints both and treats them as equivalent."""
    assert verify_id_token(_token(iss="accounts.google.com")).subject == "1234567890"


def test_a_token_for_another_app_is_refused():
    """The check that stops a token minted for someone else being replayed."""
    with pytest.raises(GoogleAuthError):
        verify_id_token(_token(aud="some-other-app.apps.googleusercontent.com"))


def test_an_expired_token_is_refused():
    now = int(time.time())
    with pytest.raises(GoogleAuthError):
        verify_id_token(_token(iat=now - 7200, exp=now - 3600))


def test_a_token_signed_by_someone_else_is_refused():
    other = rsa.generate_private_key(public_exponent=65537, key_size=2048)
    forged = jwt.encode(
        {
            "iss": "https://accounts.google.com",
            "aud": CLIENT_ID,
            "sub": "1",
            "email": "attacker@example.com",
            "email_verified": True,
            "iat": int(time.time()),
            "exp": int(time.time()) + 3600,
        },
        other,
        algorithm="RS256",
    )
    with pytest.raises(GoogleAuthError):
        verify_id_token(forged)


def test_an_unverified_email_is_refused():
    """Google saying it cannot vouch for the address is not an identity."""
    with pytest.raises(GoogleAuthError):
        verify_id_token(_token(email_verified=False))


def test_a_missing_name_falls_back_to_the_local_part():
    identity = verify_id_token(_token(name=None))
    assert identity.full_name == "seeker"
