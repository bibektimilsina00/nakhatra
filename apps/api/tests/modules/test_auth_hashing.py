"""The password-format migration is the part of Phase 1 that can silently fail.

A regression here does not raise — it locks every pre-argon2 account out, or
leaves them on the weak format forever. Both are invisible without a test.
"""

from __future__ import annotations

import hashlib

from fastapi.testclient import TestClient
from sqlmodel import Session

from app.core.db import get_engine
from app.main import app
from app.modules.auth import hashing
from app.modules.auth.models import User

client = TestClient(app)


def _legacy_hash(password: str, salt: str = "0123456789abcdef") -> str:
    """The format Phase 1 replaced: PBKDF2 with a timestamp-derived salt."""
    key = hashlib.pbkdf2_hmac("sha256", password.encode(), salt.encode(), 100_000)
    return f"{salt}:{key.hex()}"


def test_argon2_roundtrip() -> None:
    stored = hashing.hash_password("correct horse battery staple")
    assert stored.startswith("$argon2")
    assert hashing.verify_password("correct horse battery staple", stored)
    assert not hashing.verify_password("wrong", stored)
    assert not hashing.needs_rehash(stored)


def test_legacy_hash_still_verifies() -> None:
    stored = _legacy_hash("old-password")
    assert hashing.verify_password("old-password", stored)
    assert not hashing.verify_password("other-password", stored)
    assert hashing.needs_rehash(stored), "legacy rows must be flagged for upgrade"


def test_malformed_hash_is_rejected_not_raised() -> None:
    for junk in ("", "no-colon", "notavalidhash:zzzz", "$argon2id$broken"):
        assert hashing.verify_password("anything", junk) is False


def test_login_upgrades_a_legacy_hash_in_place() -> None:
    email = "legacy-upgrade@example.com"
    password = "old-password-8"

    signup = client.post(
        "/v1/auth/signup",
        json={"email": email, "password": password, "full_name": "Legacy User"},
    )
    assert signup.status_code == 200, signup.text
    user_id = signup.json()["user"]["id"]

    # Rewind this user to the pre-argon2 format.
    with Session(get_engine()) as session:
        row = session.get(User, user_id)
        assert row is not None
        row.password_hash = _legacy_hash(password)
        session.add(row)
        session.commit()
        assert not row.password_hash.startswith("$argon2")

    login = client.post("/v1/auth/login", json={"email": email, "password": password})
    assert login.status_code == 200, login.text

    with Session(get_engine()) as session:
        upgraded = session.get(User, user_id)
        assert upgraded is not None
        assert upgraded.password_hash.startswith("$argon2"), "login must rehash a legacy password"

    # And the upgraded row still authenticates.
    assert (
        client.post("/v1/auth/login", json={"email": email, "password": password}).status_code
        == 200
    )


def test_errors_use_the_shared_envelope() -> None:
    """Auth used to return FastAPI's {"detail": ...}; the clients parse {"error": {...}}."""
    res = client.post("/v1/auth/login", json={"email": "nobody@example.com", "password": "x"})
    assert res.status_code == 401
    body = res.json()
    assert body["error"]["code"] == "invalid_credentials"
    # The message must not reveal whether the account exists.
    assert "email" not in body["error"]["message"].lower().replace("invalid email", "")


def test_missing_token_is_401_with_a_code() -> None:
    res = client.get("/v1/auth/me")
    assert res.status_code == 401
    assert res.json()["error"]["code"] == "not_authenticated"


def test_token_expiry_is_advertised() -> None:
    res = client.post(
        "/v1/auth/signup",
        json={"email": "expires-in@example.com", "password": "password-8", "full_name": "E"},
    )
    assert res.status_code == 200, res.text
    assert res.json()["expires_in"] > 0
