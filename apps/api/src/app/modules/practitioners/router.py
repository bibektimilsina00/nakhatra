"""Practitioner endpoints. Routes only — no SQL, no logic, no try/except."""

from __future__ import annotations

from fastapi import APIRouter, Depends, File, Query, UploadFile
from fastapi.responses import FileResponse

from app.core.db import SessionDep
from app.core.errors import AppError
from app.modules.auth.roles import ADMIN, PRACTITIONER, require_role
from app.modules.auth.router_deps import get_current_user
from app.modules.practitioners import photos, service
from app.modules.practitioners.schemas import (
    ApplicationIn,
    ApplicationOut,
    ApplicationReviewOut,
    DirectoryOut,
    PhotoOut,
    PractitionerDetail,
    ProfileIn,
    RateIn,
    RateOut,
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


class PhotoError(AppError):
    status_code = 400
    code = "photo_invalid"


class PhotoNotFound(AppError):
    status_code = 404
    code = "not_found"


@router.post(
    "/practitioners/photo",
    response_model=PhotoOut,
    summary="Upload a profile photograph",
    description=(
        "Any signed-in account may upload, because the photograph is chosen "
        "while applying and there is no profile yet to attach it to. The "
        "returned URL is then submitted with the application or saved on the "
        "profile."
    ),
)
async def upload_photo(
    file: UploadFile = File(...),  # noqa: B008 -- FastAPI's own idiom
    user_id: str = Depends(get_current_user),
) -> PhotoOut:
    try:
        name = photos.store(await file.read(), file.content_type or "")
    except ValueError as exc:
        raise PhotoError(str(exc)) from exc
    return PhotoOut(photo_url=photos.url_for(name))


@router.get(
    "/practitioners/photos/{name}",
    response_class=FileResponse,
    summary="Serve a profile photograph",
)
def photo(name: str) -> FileResponse:
    """Deliberately unauthenticated.

    The browser fetches this from an `<img>` tag, which sends no Authorization
    header, and the directory it appears in is public anyway. The name is a
    hash of the bytes, so it is unguessable and cannot address anything this
    service did not write.
    """
    path = photos.path_for(name)
    if path is None:
        raise PhotoNotFound("No such photograph.")
    return FileResponse(path)


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


@router.get(
    "/practitioners/me/rates",
    response_model=list[RateOut],
    summary="What this practitioner charges, per medium",
)
def my_rates(
    session: SessionDep, user_id: str = Depends(require_role(PRACTITIONER, ADMIN))
) -> list[RateOut]:
    return service.my_rates(session, user_id)


@router.put(
    "/practitioners/me/rates",
    response_model=list[RateOut],
    summary="Set the price for one medium",
    description=(
        "One row per medium, so setting a price twice replaces it. A rate of "
        "zero withdraws that medium rather than making it free — the directory "
        "will not offer a consultation nobody has priced."
    ),
)
def set_rate(
    body: RateIn,
    session: SessionDep,
    user_id: str = Depends(require_role(PRACTITIONER, ADMIN)),
) -> list[RateOut]:
    return service.set_rate(session, user_id, body)


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
