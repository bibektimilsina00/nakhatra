"""Data access for practitioners.

The directory query is the one that matters. It filters on verification state,
listing state, practice type, and any combination of language, tradition and
speciality — and it must never return an unverified profile, which is enforced
here in the query rather than by a caller remembering to ask.
"""

from __future__ import annotations

from sqlmodel import Session, func, select

from app.modules.practitioners.models import (
    PractitionerApplication,
    PractitionerAttribute,
    PractitionerProfile,
)

# --- applications ---


def latest_application(session: Session, user_id: str) -> PractitionerApplication | None:
    return session.exec(
        select(PractitionerApplication)
        .where(PractitionerApplication.user_id == user_id)
        .order_by(PractitionerApplication.created_at.desc())  # type: ignore[attr-defined]
    ).first()


def get_application(session: Session, application_id: str) -> PractitionerApplication | None:
    return session.exec(
        select(PractitionerApplication).where(PractitionerApplication.id == application_id)
    ).first()


def list_applications(session: Session, state: str | None = None) -> list[PractitionerApplication]:
    query = select(PractitionerApplication)
    if state:
        query = query.where(PractitionerApplication.state == state)
    return list(
        session.exec(
            query.order_by(PractitionerApplication.created_at.asc())  # type: ignore[attr-defined]
        ).all()
    )


def save(session: Session, row):  # noqa: ANN001 -- any of this module's models
    session.add(row)
    session.commit()
    session.refresh(row)
    return row


# --- profiles ---


def profile_for_user(session: Session, user_id: str) -> PractitionerProfile | None:
    return session.exec(
        select(PractitionerProfile).where(PractitionerProfile.user_id == user_id)
    ).first()


def get_profile(session: Session, profile_id: str) -> PractitionerProfile | None:
    return session.exec(
        select(PractitionerProfile).where(PractitionerProfile.id == profile_id)
    ).first()


def visible_profile(session: Session, profile_id: str) -> PractitionerProfile | None:
    """A profile as the public may see it: verified and listed, or nothing.

    Separate from `get_profile` on purpose. The practitioner's own view and an
    admin's view legitimately read unverified rows; the public one must not,
    and the difference should be a different function rather than a boolean a
    caller can forget.
    """
    return session.exec(
        select(PractitionerProfile).where(
            PractitionerProfile.id == profile_id,
            PractitionerProfile.verification_state == "verified",
            PractitionerProfile.is_listed == True,  # noqa: E712 -- SQL, not Python
        )
    ).first()


# --- attributes ---


def attributes_for(session: Session, profile_id: str) -> list[PractitionerAttribute]:
    return list(
        session.exec(
            select(PractitionerAttribute).where(PractitionerAttribute.profile_id == profile_id)
        ).all()
    )


def attributes_for_many(
    session: Session, profile_ids: list[str]
) -> dict[str, list[PractitionerAttribute]]:
    """All attributes for a page of profiles, in one query.

    The directory renders languages and traditions on every card. Fetching them
    per profile is the N+1 that turns a 20-row page into 21 queries.
    """
    if not profile_ids:
        return {}
    rows = session.exec(
        select(PractitionerAttribute).where(
            PractitionerAttribute.profile_id.in_(profile_ids)  # type: ignore[attr-defined]
        )
    ).all()
    grouped: dict[str, list[PractitionerAttribute]] = {pid: [] for pid in profile_ids}
    for row in rows:
        grouped.setdefault(row.profile_id, []).append(row)
    return grouped


def replace_attributes(session: Session, profile_id: str, kind: str, values: list[str]) -> None:
    """Set one facet wholesale. Called inside the service's transaction."""
    existing = session.exec(
        select(PractitionerAttribute).where(
            PractitionerAttribute.profile_id == profile_id,
            PractitionerAttribute.kind == kind,
        )
    ).all()
    for row in existing:
        session.delete(row)
    # Flushed, not just staged. The caller inserts the replacements straight
    # after, and SQLAlchemy orders inserts before deletes within one flush —
    # so re-saving a profile with an unchanged language collided with the row
    # that was about to be removed.
    session.flush()


# --- directory ---


def _directory_query(
    practice_type: str | None,
    language: str | None,
    tradition: str | None,
    speciality: str | None,
    query_text: str | None,
):
    """The shared shape of the directory's list and count queries.

    Built once so the two cannot drift — a count that disagrees with the rows
    it is counting produces pagination that skips people.
    """
    query = select(PractitionerProfile).where(
        PractitionerProfile.verification_state == "verified",
        PractitionerProfile.is_listed == True,  # noqa: E712 -- SQL, not Python
    )
    if practice_type:
        query = query.where(PractitionerProfile.practice_type == practice_type)
    if query_text:
        like = f"%{query_text.lower()}%"
        query = query.where(func.lower(PractitionerProfile.display_name).like(like))

    # Each facet is a separate EXISTS rather than a join, so asking for two
    # facets means "has both" instead of the cartesian product a naive join
    # would return.
    for kind, value in (
        ("language", language),
        ("tradition", tradition),
        ("speciality", speciality),
    ):
        if not value:
            continue
        query = query.where(
            select(PractitionerAttribute.id)
            .where(
                PractitionerAttribute.profile_id == PractitionerProfile.id,
                PractitionerAttribute.kind == kind,
                PractitionerAttribute.value == value.lower(),
            )
            .exists()
        )
    return query


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
) -> tuple[list[PractitionerProfile], int]:
    base = _directory_query(practice_type, language, tradition, speciality, query_text)
    total = len(list(session.exec(base).all()))
    rows = list(
        session.exec(
            base.order_by(
                PractitionerProfile.years_experience.desc(),  # type: ignore[attr-defined]
                PractitionerProfile.created_at.asc(),  # type: ignore[attr-defined]
            )
            .limit(limit)
            .offset(offset)
        ).all()
    )
    return rows, total
