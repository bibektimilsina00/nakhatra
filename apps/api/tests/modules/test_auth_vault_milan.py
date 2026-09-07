"""Integration tests for Auth, Vault, and Kundali Milan endpoints."""

from __future__ import annotations

import uuid

from fastapi.testclient import TestClient

from app.main import create_app

client = TestClient(create_app())


def test_auth_signup_login_me():
    email = f"user_{uuid.uuid4().hex[:8]}@example.com"
    password = "secretpassword123"
    full_name = "Vedic Seeker"

    # Signup
    res = client.post(
        "/v1/auth/signup",
        json={"email": email, "password": password, "full_name": full_name},
    )
    assert res.status_code == 200, res.text
    data = res.json()
    assert "access_token" in data
    assert data["user"]["email"] == email
    assert data["user"]["full_name"] == full_name
    token = data["access_token"]

    # Duplicate Signup should fail
    res_dup = client.post(
        "/v1/auth/signup",
        json={"email": email, "password": password, "full_name": full_name},
    )
    assert res_dup.status_code == 400

    # Login
    res_login = client.post(
        "/v1/auth/login",
        json={"email": email, "password": password},
    )
    assert res_login.status_code == 200
    login_data = res_login.json()
    assert login_data["user"]["email"] == email

    # Me endpoint with bearer token
    res_me = client.get("/v1/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert res_me.status_code == 200
    assert res_me.json()["email"] == email


def test_vault_kundalis_and_sessions():
    email = f"vault_{uuid.uuid4().hex[:8]}@example.com"
    # 1. Register user
    signup_res = client.post(
        "/v1/auth/signup",
        json={"email": email, "password": "pass123456", "full_name": "Vault Tester"},
    )
    assert signup_res.status_code == 200, signup_res.text
    token = signup_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 2. Save Kundali
    k_payload = {
        "name": "KTM Birth",
        "gender": "male",
        "dob": "1995-08-25",
        "tob": "14:30:00",
        "lat": 27.7172,
        "lon": 85.3240,
        "tz_offset": 5.75,
        "place_name": "Kathmandu, Nepal",
    }
    save_res = client.post("/v1/vault/kundalis", json=k_payload, headers=headers)
    assert save_res.status_code == 200, save_res.text
    kundali = save_res.json()
    assert kundali["name"] == "KTM Birth"
    k_id = kundali["id"]

    # 3. List Kundalis
    list_res = client.get("/v1/vault/kundalis", headers=headers)
    assert list_res.status_code == 200
    assert len(list_res.json()) >= 1

    # 4. Create Chat Session
    s_res = client.post(
        "/v1/vault/sessions",
        json={"title": "Career Reading", "kundali_id": k_id},
        headers=headers,
    )
    assert s_res.status_code == 200
    session = s_res.json()
    s_id = session["id"]

    # 5. Add Messages
    m1_res = client.post(
        f"/v1/vault/sessions/{s_id}/messages",
        json={"sender": "user", "content": "How is my 10th house?"},
        headers=headers,
    )
    assert m1_res.status_code == 200

    m2_res = client.post(
        f"/v1/vault/sessions/{s_id}/messages",
        json={"sender": "astrologer", "content": "Your 10th house is exalted."},
        headers=headers,
    )
    assert m2_res.status_code == 200

    # 6. Fetch Session with Messages
    get_s_res = client.get(f"/v1/vault/sessions/{s_id}", headers=headers)
    assert get_s_res.status_code == 200
    session_full = get_s_res.json()
    assert len(session_full["messages"]) == 2


def test_milan_matching_endpoint():
    milan_payload = {
        "groom_name": "Aarav",
        "groom": {
            "name": "Aarav",
            "date": "1992-05-15",
            "time": "08:30:00",
            "latitude": 27.7172,
            "longitude": 85.3240,
            "tz_name": "Asia/Kathmandu",
            "place_label": "Kathmandu, Nepal",
        },
        "bride_name": "Ananya",
        "bride": {
            "name": "Ananya",
            "date": "1994-11-20",
            "time": "14:15:00",
            "latitude": 27.7172,
            "longitude": 85.3240,
            "tz_name": "Asia/Kathmandu",
            "place_label": "Kathmandu, Nepal",
        },
    }

    res = client.post("/v1/milan/match", json=milan_payload)
    assert res.status_code == 200, res.text
    data = res.json()
    assert data["groom_name"] == "Aarav"
    assert data["bride_name"] == "Ananya"
    assert "total_guna" in data
    assert len(data["kutas"]) == 8
    assert "groom_manglik" in data
    assert "bride_manglik" in data
    assert "manglik_compatibility" in data


# --- managing your own account ---


def _signed_up(prefix: str = "acct") -> tuple[str, dict[str, str]]:
    email = f"{prefix}_{uuid.uuid4().hex[:8]}@example.com"
    res = client.post(
        "/v1/auth/signup",
        json={"email": email, "password": "password-8", "full_name": "Before"},
    )
    assert res.status_code == 200, res.text
    return email, {"Authorization": f"Bearer {res.json()['access_token']}"}


def test_a_person_can_rename_themselves():
    _, headers = _signed_up()
    res = client.patch("/v1/auth/me", json={"full_name": "After"}, headers=headers)
    assert res.status_code == 200, res.text
    assert res.json()["full_name"] == "After"
    assert client.get("/v1/auth/me", headers=headers).json()["full_name"] == "After"


def test_renaming_requires_a_session():
    assert client.patch("/v1/auth/me", json={"full_name": "Nobody"}).status_code == 401


def test_the_password_changes_only_with_the_current_one():
    """A token is not proof enough — a session left open on a borrowed laptop
    should not be able to lock its owner out."""
    email, headers = _signed_up()

    wrong = client.post(
        "/v1/auth/password",
        json={"current_password": "not-the-one", "new_password": "brand-new-8"},
        headers=headers,
    )
    assert wrong.status_code == 401

    ok = client.post(
        "/v1/auth/password",
        json={"current_password": "password-8", "new_password": "brand-new-8"},
        headers=headers,
    )
    assert ok.status_code == 200, ok.text

    # The new one works and the old one does not.
    assert (
        client.post("/v1/auth/login", json={"email": email, "password": "brand-new-8"}).status_code
        == 200
    )
    assert (
        client.post("/v1/auth/login", json={"email": email, "password": "password-8"}).status_code
        == 401
    )


def test_a_new_password_must_be_long_enough():
    _, headers = _signed_up()
    res = client.post(
        "/v1/auth/password",
        json={"current_password": "password-8", "new_password": "short"},
        headers=headers,
    )
    assert res.status_code == 422
