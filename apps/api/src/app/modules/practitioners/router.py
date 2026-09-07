"""Practitioner endpoints. Routes only — no SQL, no logic, no try/except."""

from __future__ import annotations

from fastapi import APIRouter, Depends, Query

from app.core.db import SessionDep
from app.modules.auth.roles import ADMIN, PRACTITIONER, require_role
from app.modules.auth.router_deps import get_current_user
from app.modules.practitioners import service
from app.modules.practitioners.schemas import (
    ApplicationIn,
    ApplicationOut,
    ApplicationReviewOut,
    DirectoryOut,
    PractitionerDetail,
    ProfileIn,
    ReviewDecisionIn,
)

router = APIRouter(prefix="/v1", tags=["practitioners"])


# --- public directory ---


@router.get(
    "/practitioners",
    response_model=DirectoryOut,
    summary="Browse verified astrologers and pandits",
    description=(
        "Only verified, listed profiles are returned — the filter is in the "
        "query itself, not a caller's responsibility. Unauthenticated, because "
        "browsing is how someone decides whether to sign up."
    ),
)
def directory(
    session: SessionDep,
    practice_type: str | None = Query(None, description="astrologer | pandit"),
    language: str | None = Query(None, description="Normalised, e.g. `ne`"),
    tradition: str | None = Query(None, description="e.g. `parashari`"),
    speciality: str | None = Query(None, description="e.g. `marriage`"),
    q: str | None = Query(None, description="Matches the display name"),
    limit: int = Query(20, ge=1, le=50),
    offset: int = Query(0, ge=0),
) -> DirectoryOut:
    return service.directory(
        session,
        practice_type=practice_type,
        language=language,
        tradition=tradition,
        speciality=speciality,
        query_text=q,
        limit=limit,
        offset=offset,
    )


@router.get("/practitioners/{profile_id}", response_model=PractitionerDetail)
def public_profile(profile_id: str, session: SessionDep) -> PractitionerDetail:
    return service.public_profile(session, profile_id)


# --- applying ---


@router.post(
    "/practitioners/applications",
    response_model=ApplicationOut,
    summary="Apply to practise on the platform",
)
def apply(
    body: ApplicationIn,
    session: SessionDep,
    user_id: str = Depends(get_current_user),
) -> ApplicationOut:
    return service.apply(session, user_id, body)


@router.get(
    "/practitioners/applications/me",
    response_model=ApplicationOut | None,
    summary="The signed-in account's own application, if any",
)
def my_application(
    session: SessionDep, user_id: str = Depends(get_current_user)
) -> ApplicationOut | None:
    return service.my_application(session, user_id)


# --- the practitioner's own listing ---


@router.get("/practitioners/me/profile", response_model=PractitionerDetail)
def my_profile(
    session: SessionDep, user_id: str = Depends(require_role(PRACTITIONER, ADMIN))
) -> PractitionerDetail:
    return service.my_profile(session, user_id)


@router.put("/practitioners/me/profile", response_model=PractitionerDetail)
def update_profile(
    body: ProfileIn,
    session: SessionDep,
    user_id: str = Depends(require_role(PRACTITIONER, ADMIN)),
) -> PractitionerDetail:
    return service.update_profile(session, user_id, body)


# --- review queue ---


@router.get(
    "/admin/practitioner-applications",
    response_model=list[ApplicationReviewOut],
    summary="The review queue",
)
def review_queue(
    session: SessionDep,
    state: str | None = Query(None),
    _admin: str = Depends(require_role(ADMIN)),
) -> list[ApplicationReviewOut]:
    return service.list_applications(session, state)


@router.post(
    "/admin/practitioner-applications/{application_id}/review",
    response_model=ApplicationReviewOut,
    summary="Approve, reject, or move an application to in-review",
    description=(
        "Approving creates the profile, copies the declared languages and "
        "traditions, and promotes the account to the practitioner role — in one "
        "transaction. The profile is created unlisted: approval says they may "
        "practise, not that the listing is ready to be read."
    ),
)
def review(
    application_id: str,
    body: ReviewDecisionIn,
    session: SessionDep,
    admin_id: str = Depends(require_role(ADMIN)),
) -> ApplicationReviewOut:
    return service.review(session, application_id, admin_id, body)
