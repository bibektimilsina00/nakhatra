"""Practitioner logic: applying, reviewing, listing.

Two rules govern everything here.

**Nobody lists before review.** A profile is created only by an approval, and
the public directory query filters on `verification_state == "verified"` in the
query itself. There is no code path from "applied" to "listed".

**Approval is one transaction.** Approving an application creates the profile,
copies the declared facets, and promotes the account's role. Half of that
succeeding leaves an approved application with no profile, or a practitioner
role with nothing to practise from.
"""

from __future__ import annotations

import uuid
from datetime import UTC, datetime

from sqlmodel import Session, select

from app.core.errors import AppError
from app.modules.auth.models import User
from app.modules.auth.roles import PRACTITIONER
from app.modules.practitioners import repository
from app.modules.practitioners.models import (
    PractitionerApplication,
    PractitionerAttribute,
    PractitionerProfile,
    RateCard,
)
from app.modules.practitioners.schemas import (
    ApplicationIn,
    ApplicationOut,
    ApplicationReviewOut,
    DirectoryOut,
    PractitionerCard,
    PractitionerDetail,
    ProfileIn,
    RateIn,
    RateOut,
    ReviewDecisionIn,
)

#: States an applicant may still be waiting on. Applying again while one of
#: these is open would give a reviewer two copies of the same person.
OPEN_STATES = ("submitted", "in_review")


class ApplicationError(AppError):
    status_code = 400
    code = "application_invalid"


class NotFoundError(AppError):
    status_code = 404
    code = "not_found"


def _now() -> str:
    return datetime.now(UTC).isoformat()


def _id() -> str:
    return uuid.uuid4().hex


def _normalise(values: list[str]) -> list[str]:
    """Lowercase, trimmed, de-duplicated, order preserved.

    Matching happens on these values, so `"Nepali"`, `"nepali"` and `" nepali"`
    have to become one thing at write time. Doing it at read time instead would
    mean every filter query lowercasing a column and losing its index.
    """
    seen: list[str] = []
    for value in values:
        cleaned = value.strip().lower()
        if cleaned and cleaned not in seen:
            seen.append(cleaned)
    return seen


# --- applying ---


def apply(session: Session, user_id: str, body: ApplicationIn) -> ApplicationOut:
    existing = repository.latest_application(session, user_id)
    if existing is not None and existing.state in OPEN_STATES:
        raise ApplicationError("You already have an application under review.")
    if existing is not None and existing.state == "approved":
        raise ApplicationError("This account is already an approved practitioner.")

    practices = _normalise([str(p) for p in (body.practice_types or [body.practice_type])]) or [
        "astrologer"
    ]

    now = _now()
    row = PractitionerApplication(
        id=_id(),
        user_id=user_id,
        # The first is the primary, for clients that understand only one.
        practice_type=practices[0],
        full_name=body.full_name.strip(),
        phone=body.phone.strip(),
        city=body.city.strip(),
        country=body.country.upper(),
        years_experience=body.years_experience,
        sample_reading=body.sample_reading.strip(),
        # Stored as a comma-joined string on the application because nothing
        # filters on it — the facets become rows only once a profile exists.
        languages=",".join(_normalise(body.languages)),
        traditions=",".join(_normalise(body.traditions)),
        # Carried on the application so approval can copy them onto the
        # profile without asking for them a second time.
        practices=",".join(practices),
        headline=body.headline.strip(),
        photo_url=body.photo_url,
        credentials=body.credentials.strip(),
        state="submitted",
        created_at=now,
        updated_at=now,
    )
    repository.save(session, row)
    return _application_out(row)


def my_application(session: Session, user_id: str) -> ApplicationOut | None:
    row = repository.latest_application(session, user_id)
    return _application_out(row) if row else None


# --- reviewing ---


def list_applications(session: Session, state: str | None = None) -> list[ApplicationReviewOut]:
    return [_review_out(row) for row in repository.list_applications(session, state)]


def review(
    session: Session, application_id: str, admin_id: str, body: ReviewDecisionIn
) -> ApplicationReviewOut:
    row = repository.get_application(session, application_id)
    if row is None:
        raise NotFoundError("No such application.")
    if row.state in ("approved", "rejected"):
        raise ApplicationError("This application has already been decided.")

    now = _now()
    row.reviewer_note = body.reviewer_note or row.reviewer_note
    row.decision_note = body.decision_note
    row.reviewed_by = admin_id
    row.reviewed_at = now
    row.updated_at = now

    if body.decision == "in_review":
        row.state = "in_review"
        repository.save(session, row)
        return _review_out(row)

    row.state = "approved" if body.decision == "approve" else "rejected"

    if row.state == "approved":
        _promote(session, row)

    repository.save(session, row)
    return _review_out(row)


def _promote(session: Session, application: PractitionerApplication) -> None:
    """Approval, as one unit: profile, facets, role.

    Committed by the caller's `repository.save`, so a failure anywhere in here
    rolls back the application's own state change too. An approved application
    with no profile behind it is a practitioner who cannot be found.
    """
    now = _now()
    profile = repository.profile_for_user(session, application.user_id)
    if profile is None:
        profile = PractitionerProfile(
            id=_id(),
            user_id=application.user_id,
            practice_type=application.practice_type,
            display_name=application.full_name,
            headline=application.headline,
            photo_url=application.photo_url,
            city=application.city,
            country=application.country,
            years_experience=application.years_experience,
            created_at=now,
            updated_at=now,
        )
    profile.verification_state = "verified"
    # Listed only once they have filled the profile in. Approval says they may
    # practise; it does not say the listing is ready to be read.
    profile.is_listed = False
    profile.updated_at = now
    session.add(profile)

    for kind, raw in (
        ("language", application.languages),
        ("tradition", application.traditions),
        ("practice", application.practices),
    ):
        for value in _normalise(raw.split(",")):
            session.add(
                PractitionerAttribute(id=_id(), profile_id=profile.id, kind=kind, value=value)
            )

    user = session.exec(select(User).where(User.id == application.user_id)).first()
    if user is not None:
        user.role = PRACTITIONER
        session.add(user)


# --- the practitioner's own profile ---


def my_profile(session: Session, user_id: str) -> PractitionerDetail:
    profile = repository.profile_for_user(session, user_id)
    if profile is None:
        raise NotFoundError("This account has no practitioner profile.")
    return _detail(session, profile)


def update_profile(session: Session, user_id: str, body: ProfileIn) -> PractitionerDetail:
    profile = repository.profile_for_user(session, user_id)
    if profile is None:
        raise NotFoundError("This account has no practitioner profile.")

    profile.display_name = body.display_name.strip()
    profile.headline = body.headline.strip()
    profile.bio = body.bio.strip()
    profile.photo_url = body.photo_url
    profile.intro_video_url = body.intro_video_url
    profile.city = body.city.strip()
    profile.country = body.country.upper()
    profile.years_experience = body.years_experience
    # `verification_state` is deliberately untouched: a practitioner editing
    # their own bio must not be able to verify themselves.
    profile.is_listed = body.is_listed
    profile.updated_at = _now()

    if body.practice_types:
        # The primary stays the first one, for clients that read only it.
        profile.practice_type = _normalise([str(p) for p in body.practice_types])[0]

    for kind, values in (
        ("language", body.languages),
        ("tradition", body.traditions),
        ("speciality", body.specialities),
        ("practice", [str(p) for p in body.practice_types]),
    ):
        repository.replace_attributes(session, profile.id, kind, values)
        for value in _normalise(values):
            session.add(
                PractitionerAttribute(id=_id(), profile_id=profile.id, kind=kind, value=value)
            )

    repository.save(session, profile)
    return _detail(session, profile)


# --- the public directory ---


def directory(
    session: Session,
    *,
    practice_type: str | None = None,
    language: str | None = None,
    tradition: str | None = None,
    speciality: str | None = None,
    query_text: str | None = None,
    limit: int = 20,
    offset: int = 0,
) -> DirectoryOut:
    rows, total = repository.directory(
        session,
        practice_type=practice_type,
        language=language,
        tradition=tradition,
        speciality=speciality,
        query_text=query_text,
        limit=limit,
        offset=offset,
    )
    facets = repository.attributes_for_many(session, [row.id for row in rows])
    return DirectoryOut(items=[_card(row, facets.get(row.id, [])) for row in rows], total=total)


def public_profile(session: Session, profile_id: str) -> PractitionerDetail:
    profile = repository.visible_profile(session, profile_id)
    if profile is None:
        # Deliberately the same answer for "does not exist" and "exists but is
        # not verified". The second would otherwise confirm that someone has
        # applied here, which is not the directory's to disclose.
        raise NotFoundError("No such practitioner.")
    return _detail(session, profile)


# --- mapping ---


def _facets(attributes: list[PractitionerAttribute], kind: str) -> list[str]:
    return sorted(a.value for a in attributes if a.kind == kind)


def _card(profile: PractitionerProfile, attributes: list[PractitionerAttribute]):
    # A profile written before practices were a list has none of these rows, so
    # its single `practice_type` stands in — no backfill needed.
    practices = _facets(attributes, "practice") or [profile.practice_type]
    return PractitionerCard(
        id=profile.id,
        practice_type=profile.practice_type,  # type: ignore[arg-type]
        practice_types=practices,  # type: ignore[arg-type]
        display_name=profile.display_name,
        headline=profile.headline,
        photo_url=profile.photo_url,
        city=profile.city,
        country=profile.country,
        years_experience=profile.years_experience,
        languages=_facets(attributes, "language"),
        traditions=_facets(attributes, "tradition"),
        specialities=_facets(attributes, "speciality"),
        verified=profile.verification_state == "verified",
    )


def _detail(session: Session, profile: PractitionerProfile) -> PractitionerDetail:
    attributes = repository.attributes_for(session, profile.id)
    card = _card(profile, attributes)
    return PractitionerDetail(
        **card.model_dump(),
        bio=profile.bio,
        intro_video_url=profile.intro_video_url,
        user_id=profile.user_id,
        # Only what they actually offer. A booking form that lists a medium
        # they have not priced sends a request the server refuses.
        rates=[
            _rate_out(row)
            for row in repository.rates_for(session, profile.id)
            if row.is_active and row.per_minute_minor > 0
        ],
    )


def _application_out(row: PractitionerApplication) -> ApplicationOut:
    return ApplicationOut(
        id=row.id,
        practice_type=row.practice_type,  # type: ignore[arg-type]
        # Rows written before practices were a list have none, so the single
        # type stands in.
        practice_types=[v for v in row.practices.split(",") if v]  # type: ignore[arg-type]
        or [row.practice_type],  # type: ignore[list-item]
        full_name=row.full_name,
        headline=row.headline,
        photo_url=row.photo_url,
        languages=[v for v in row.languages.split(",") if v],
        traditions=[v for v in row.traditions.split(",") if v],
        city=row.city,
        country=row.country,
        years_experience=row.years_experience,
        state=row.state,  # type: ignore[arg-type]
        decision_note=row.decision_note,
        created_at=row.created_at,
        updated_at=row.updated_at,
    )


def _review_out(row: PractitionerApplication) -> ApplicationReviewOut:
    return ApplicationReviewOut(
        **_application_out(row).model_dump(),
        user_id=row.user_id,
        phone=row.phone,
        credentials=row.credentials,
        sample_reading=row.sample_reading,
        reviewer_note=row.reviewer_note,
        reviewed_by=row.reviewed_by,
        reviewed_at=row.reviewed_at,
    )


# --- rates ---


def my_rates(session: Session, user_id: str) -> list[RateOut]:
    profile = repository.profile_for_user(session, user_id)
    if profile is None:
        raise NotFoundError("This account has no practitioner profile.")
    return [_rate_out(r) for r in repository.rates_for(session, profile.id)]


def set_rate(session: Session, user_id: str, body: RateIn) -> list[RateOut]:
    """Set or replace one medium's price.

    One row per medium, so setting a price twice updates rather than
    accumulating — a practitioner with two chat rates is a question the
    consultation code should never have to answer.
    """
    profile = repository.profile_for_user(session, user_id)
    if profile is None:
        raise NotFoundError("This account has no practitioner profile.")

    existing = repository.rate_for(session, profile.id, body.medium)
    if existing is None:
        existing = RateCard(id=_id(), profile_id=profile.id, medium=body.medium, updated_at=_now())
    existing.per_minute_minor = body.per_minute_minor
    # A price of zero cannot be offered, whatever the flag says.
    existing.is_active = body.is_active and body.per_minute_minor > 0
    existing.updated_at = _now()
    repository.save(session, existing)
    return my_rates(session, user_id)


def _rate_out(row: RateCard) -> RateOut:
    return RateOut(
        medium=row.medium,  # type: ignore[arg-type]
        per_minute_minor=row.per_minute_minor,
        currency=row.currency,
        is_active=row.is_active,
    )
