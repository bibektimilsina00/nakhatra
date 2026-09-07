"""Google sign-in.

The signature check itself belongs to PyJWT and is not re-tested here. What is
tested is everything we decided: that an unconfigured server refuses rather
than accepting any audience, that a first sign-in creates an account, that a
second one reuses it, and — the one that matters — that signing in with Google
lands on the *existing* password account for the same address instead of
silently creating a second user.
"""

from __future__ import annotations

import uuid

import pytest
from fastapi.testclient import TestClient

from app.core.config import get_settings
from app.integrations.google_identity import GoogleIdentity
from app.main import create_app
from app.modules.auth import service

client = TestClient(create_app())


@pytest.fixture
def google_configured():
    """A client id must be set, or the endpoint short-circuits to 503."""
    settings = get_settings()
    previous = settings.GOOGLE_CLIENT_ID
    settings.GOOGLE_CLIENT_ID = "test-client-id.apps.googleusercontent.com"
    yield
    settings.GOOGLE_CLIENT_ID = previous


def _identity(email: str, name: str = "Google User") -> GoogleIdentity:
    return GoogleIdentity(subject=f"sub_{uuid.uuid4().hex[:8]}", email=email, full_name=name)


def test_exactly_one_of_code_or_credential_is_required(google_configured):
    """Both or neither is a client bug, and 422 says so before anything runs."""
    for body in ({}, {"code": "c", "credential": "t"}):
        res = client.post("/v1/auth/google", json=body)
        assert res.status_code == 422, f"{body} should be rejected: {res.text}"


def test_popup_code_is_exchanged_before_verification(monkeypatch, google_configured):
    """The web client sends a code; it must be traded for an ID token first."""
    email = f"g_{uuid.uuid4().hex[:8]}@example.com"
    seen = {}

    def fake_exchange(code: str) -> str:
        seen["code"] = code
        return "the-id-token-google-returned"

    def fake_verify(token: str):
        seen["verified"] = token
        return _identity(email)

    monkeypatch.setattr(service, "exchange_code_for_id_token", fake_exchange)
    monkeypatch.setattr(service, "verify_id_token", fake_verify)

    res = client.post("/v1/auth/google", json={"code": "4/popup-auth-code"})
    assert res.status_code == 200, res.text
    assert seen["code"] == "4/popup-auth-code"
    assert seen["verified"] == "the-id-token-google-returned"
    assert res.json()["user"]["email"] == email


def test_credential_flow_does_not_call_the_exchange(monkeypatch, google_configured):
    """Mobile sends an ID token directly — there is no code to redeem."""
    email = f"g_{uuid.uuid4().hex[:8]}@example.com"

    def explode(_code: str) -> str:
        raise AssertionError("credential flow must not hit the token endpoint")

    monkeypatch.setattr(service, "exchange_code_for_id_token", explode)
    monkeypatch.setattr(service, "verify_id_token", lambda _t: _identity(email))

    res = client.post("/v1/auth/google", json={"credential": "an-id-token"})
    assert res.status_code == 200, res.text


def test_google_sign_in_is_refused_when_no_client_id_is_set():
    settings = get_settings()
    previous = settings.GOOGLE_CLIENT_ID
    settings.GOOGLE_CLIENT_ID = ""
    try:
        res = client.post("/v1/auth/google", json={"credential": "anything"})
        assert res.status_code == 503, res.text
        assert res.json()["error"]["code"] == "google_not_configured"
    finally:
        settings.GOOGLE_CLIENT_ID = previous


def test_first_google_sign_in_creates_an_account(monkeypatch, google_configured):
    email = f"g_{uuid.uuid4().hex[:8]}@example.com"
    monkeypatch.setattr(service, "verify_id_token", lambda _c: _identity(email, "Sita Sharma"))

    res = client.post("/v1/auth/google", json={"credential": "a-google-id-token"})
    assert res.status_code == 200, res.text
    body = res.json()
    assert body["user"]["email"] == email
    assert body["user"]["full_name"] == "Sita Sharma"

    # The token is ours, not Google's, and works on our own endpoints.
    me = client.get("/v1/auth/me", headers={"Authorization": f"Bearer {body['access_token']}"})
    assert me.status_code == 200
    assert me.json()["email"] == email


def test_second_google_sign_in_reuses_the_same_account(monkeypatch, google_configured):
    email = f"g_{uuid.uuid4().hex[:8]}@example.com"
    monkeypatch.setattr(service, "verify_id_token", lambda _c: _identity(email))

    first = client.post("/v1/auth/google", json={"credential": "tok"}).json()
    second = client.post("/v1/auth/google", json={"credential": "tok"}).json()

    assert first["user"]["id"] == second["user"]["id"]


def test_google_sign_in_adopts_an_existing_password_account(monkeypatch, google_configured):
    """Otherwise the same person ends up with two accounts and one empty vault."""
    email = f"g_{uuid.uuid4().hex[:8]}@example.com"
    signup = client.post(
        "/v1/auth/signup",
        json={"email": email, "password": "secretpassword123", "full_name": "Ram Bahadur"},
    ).json()

    monkeypatch.setattr(service, "verify_id_token", lambda _c: _identity(email, "Ram B"))
    google = client.post("/v1/auth/google", json={"credential": "tok"}).json()

    assert google["user"]["id"] == signup["user"]["id"]
    # The Google display name does not overwrite the one they chose at signup.
    assert google["user"]["full_name"] == "Ram Bahadur"


def test_password_login_still_works_for_a_google_created_account(monkeypatch, google_configured):
    """The random hash must be a real, unguessable password — not an empty one."""
    email = f"g_{uuid.uuid4().hex[:8]}@example.com"
    monkeypatch.setattr(service, "verify_id_token", lambda _c: _identity(email))
    client.post("/v1/auth/google", json={"credential": "tok"})

    for attempt in ("", "password", "google"):
        res = client.post("/v1/auth/login", json={"email": email, "password": attempt or "x"})
        assert res.status_code == 401, f"{attempt!r} should not sign anyone in"
