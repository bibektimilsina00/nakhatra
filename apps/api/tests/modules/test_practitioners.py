"""Practitioners: applying, review, and who may see what.

The rules worth testing are the ones a marketplace fails on: an unverified
practitioner must never appear publicly, an applicant must never read their
reviewer's notes, and nobody may promote themselves.
"""

from __future__ import annotations

import uuid

import pytest
from fastapi.testclient import TestClient
from sqlmodel import Session, select

from app.core.db import get_engine
from app.main import app
from app.modules.auth.models import User
from app.modules.auth.roles import ADMIN

client = TestClient(app)


def _account(prefix: str) -> tuple[str, dict[str, str]]:
    email = f"{prefix}-{uuid.uuid4().hex[:10]}@example.com"
    res = client.post(
        "/v1/auth/signup",
        json={"email": email, "password": "password-8", "full_name": prefix.title()},
    )
    assert res.status_code == 200, res.text
    body = res.json()
    return body["user"]["id"], {"Authorization": f"Bearer {body['access_token']}"}


def _make_admin(user_id: str) -> None:
    """Promote directly in the database — there is deliberately no route for it."""
    with Session(get_engine()) as session:
        user = session.exec(select(User).where(User.id == user_id)).first()
        assert user is not None
        user.role = ADMIN
        session.add(user)
        session.commit()


APPLICATION = {
    "practice_type": "astrologer",
    "full_name": "Pandit Suresh Sharma",
    "phone": "+977-9800000000",
    "city": "Kathmandu",
    "country": "NP",
    "years_experience": 24,
    "credentials": "Studied at Valmiki Vidyapith.",
    "sample_reading": "Cancer lagna with Moon in the 1st...",
    "languages": ["Nepali", "  nepali ", "Hindi"],
    "traditions": ["Parashari"],
}


def _apply(headers: dict) -> dict:
    res = client.post("/v1/practitioners/applications", json=APPLICATION, headers=headers)
    assert res.status_code == 200, res.text
    return res.json()


def _approve(application_id: str, admin_headers: dict) -> dict:
    res = client.post(
        f"/v1/admin/practitioner-applications/{application_id}/review",
        json={"decision": "approve", "decision_note": "Welcome.", "reviewer_note": "Refs checked."},
        headers=admin_headers,
    )
    assert res.status_code == 200, res.text
    return res.json()


# --- applying ---


def test_applying_requires_an_account() -> None:
    assert client.post("/v1/practitioners/applications", json=APPLICATION).status_code == 401


def test_an_applicant_can_read_their_own_application() -> None:
    _, headers = _account("applicant")
    created = _apply(headers)
    assert created["state"] == "submitted"

    mine = client.get("/v1/practitioners/applications/me", headers=headers).json()
    assert mine["id"] == created["id"]


def test_a_second_application_while_one_is_open_is_refused() -> None:
    """Otherwise a reviewer gets two copies of the same person."""
    _, headers = _account("dup")
    _apply(headers)
    res = client.post("/v1/practitioners/applications", json=APPLICATION, headers=headers)
    assert res.status_code == 400


def test_an_applicant_never_sees_the_reviewer_note() -> None:
    """`reviewer_note` is working notes; `decision_note` is the message."""
    _, headers = _account("notes")
    application = _apply(headers)
    _, admin_headers = _account("admin")
    _make_admin(_account_id_of(admin_headers))
    _approve(application["id"], admin_headers)

    mine = client.get("/v1/practitioners/applications/me", headers=headers).json()
    assert mine["decision_note"] == "Welcome."
    assert "reviewer_note" not in mine


def _account_id_of(headers: dict) -> str:
    return client.get("/v1/auth/me", headers=headers).json()["id"]


# --- authorisation ---


def test_the_review_queue_is_closed_to_ordinary_accounts() -> None:
    _, headers = _account("nosy")
    assert client.get("/v1/admin/practitioner-applications", headers=headers).status_code == 403


def test_an_applicant_cannot_approve_their_own_application() -> None:
    _, headers = _account("selfapprove")
    application = _apply(headers)
    res = client.post(
        f"/v1/admin/practitioner-applications/{application['id']}/review",
        json={"decision": "approve"},
        headers=headers,
    )
    assert res.status_code == 403


def test_a_seeker_has_no_practitioner_profile() -> None:
    _, headers = _account("seeker")
    assert client.get("/v1/practitioners/me/profile", headers=headers).status_code == 403


# --- approval ---


def test_approval_creates_a_profile_and_promotes_the_account() -> None:
    user_id, headers = _account("approved")
    application = _apply(headers)
    _, admin_headers = _account("admin2")
    _make_admin(_account_id_of(admin_headers))

    decided = _approve(application["id"], admin_headers)
    assert decided["state"] == "approved"

    # The role check now passes, which is the promotion having happened.
    profile = client.get("/v1/practitioners/me/profile", headers=headers)
    assert profile.status_code == 200, profile.text
    body = profile.json()
    assert body["display_name"] == "Pandit Suresh Sharma"
    # Declared facets were copied, normalised and de-duplicated.
    assert body["languages"] == ["hindi", "nepali"]
    assert body["traditions"] == ["parashari"]


def test_an_approved_practitioner_is_not_listed_until_they_publish() -> None:
    """Approval says they may practise, not that the listing is ready."""
    _, headers = _account("unlisted")
    application = _apply(headers)
    _, admin_headers = _account("admin3")
    _make_admin(_account_id_of(admin_headers))
    _approve(application["id"], admin_headers)

    profile_id = client.get("/v1/practitioners/me/profile", headers=headers).json()["id"]
    assert client.get(f"/v1/practitioners/{profile_id}").status_code == 404

    ids = [p["id"] for p in client.get("/v1/practitioners").json()["items"]]
    assert profile_id not in ids


def test_deciding_an_application_twice_is_refused() -> None:
    _, headers = _account("twice")
    application = _apply(headers)
    _, admin_headers = _account("admin4")
    _make_admin(_account_id_of(admin_headers))
    _approve(application["id"], admin_headers)

    res = client.post(
        f"/v1/admin/practitioner-applications/{application['id']}/review",
        json={"decision": "reject"},
        headers=admin_headers,
    )
    assert res.status_code == 400


# --- the directory ---


@pytest.fixture
def listed() -> tuple[str, dict]:
    """An approved, published practitioner."""
    _, headers = _account("listed")
    application = _apply(headers)
    _, admin_headers = _account("admin5")
    _make_admin(_account_id_of(admin_headers))
    _approve(application["id"], admin_headers)

    res = client.put(
        "/v1/practitioners/me/profile",
        json={
            "display_name": "Radha Acharya",
            "headline": "KP paddhati, 16 years",
            "bio": "Career and marriage.",
            "city": "Pokhara",
            "country": "NP",
            "years_experience": 16,
            "languages": ["ne", "en"],
            "traditions": ["kp"],
            "specialities": ["career", "marriage"],
            "is_listed": True,
        },
        headers=headers,
    )
    assert res.status_code == 200, res.text
    return res.json()["id"], headers


def test_a_published_practitioner_appears_and_is_readable_without_signing_in(
    listed: tuple[str, dict],
) -> None:
    profile_id, _ = listed
    ids = [p["id"] for p in client.get("/v1/practitioners").json()["items"]]
    assert profile_id in ids
    assert client.get(f"/v1/practitioners/{profile_id}").status_code == 200


def test_filters_match_on_normalised_values(listed: tuple[str, dict]) -> None:
    profile_id, _ = listed

    def ids(**params) -> list[str]:
        return [p["id"] for p in client.get("/v1/practitioners", params=params).json()["items"]]

    assert profile_id in ids(language="ne")
    assert profile_id in ids(tradition="kp")
    assert profile_id in ids(speciality="marriage")
    assert profile_id in ids(q="radha")
    assert profile_id not in ids(language="ta")


def test_two_facets_mean_both_not_either(listed: tuple[str, dict]) -> None:
    """A naive join would return anyone matching either facet."""
    profile_id, _ = listed
    both = client.get("/v1/practitioners", params={"speciality": "career", "language": "ta"}).json()
    assert profile_id not in [p["id"] for p in both["items"]]


def test_unlisting_removes_them_from_the_directory(listed: tuple[str, dict]) -> None:
    profile_id, headers = listed
    current = client.get("/v1/practitioners/me/profile", headers=headers).json()
    client.put(
        "/v1/practitioners/me/profile",
        json={
            "display_name": current["display_name"],
            "headline": current["headline"],
            "bio": current["bio"],
            "city": current["city"],
            "country": current["country"],
            "years_experience": current["years_experience"],
            "languages": current["languages"],
            "traditions": current["traditions"],
            "specialities": current["specialities"],
            "is_listed": False,
        },
        headers=headers,
    )
    ids = [p["id"] for p in client.get("/v1/practitioners").json()["items"]]
    assert profile_id not in ids


def test_a_practitioner_cannot_verify_themselves(listed: tuple[str, dict]) -> None:
    """`verification_state` is not in `ProfileIn`, and must stay that way."""
    from app.modules.practitioners.schemas import ProfileIn

    assert "verification_state" not in ProfileIn.model_fields
