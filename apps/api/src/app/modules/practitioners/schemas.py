"""Wire contract for practitioners.

Two shapes of profile go out, and the split is the point: `PractitionerCard` is
what the public directory returns, `PractitionerDetail` is one profile's page.
An application is never public in any shape.
"""

from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field

PracticeType = Literal["astrologer", "pandit"]
ApplicationState = Literal["submitted", "in_review", "approved", "rejected", "withdrawn"]
VerificationState = Literal["pending", "in_review", "verified", "rejected", "suspended"]


class ApplicationIn(BaseModel):
    practice_type: PracticeType = "astrologer"
    full_name: str = Field(min_length=1, max_length=255)
    phone: str = Field(default="", max_length=64)
    city: str = Field(default="", max_length=255)
    country: str = Field(default="NP", min_length=2, max_length=2)
    years_experience: int = Field(default=0, ge=0, le=100)
    credentials: str = Field(default="", max_length=4000)
    sample_reading: str = Field(default="", max_length=8000)
    languages: list[str] = Field(default_factory=list)
    traditions: list[str] = Field(default_factory=list)


class ApplicationOut(BaseModel):
    """What an applicant sees about their own application.

    `reviewer_note` is deliberately absent. It is the reviewer's working
    notes — "references did not respond", "second opinion needed" — and
    `decision_note` is the message written to be read.
    """

    id: str
    practice_type: PracticeType
    full_name: str
    city: str
    country: str
    years_experience: int
    state: ApplicationState
    decision_note: str
    created_at: str
    updated_at: str


class ApplicationReviewOut(ApplicationOut):
    """The same application, as a reviewer sees it. Admin routes only."""

    user_id: str
    phone: str
    credentials: str
    sample_reading: str
    languages: list[str]
    traditions: list[str]
    reviewer_note: str
    reviewed_by: str | None
    reviewed_at: str | None


class ReviewDecisionIn(BaseModel):
    decision: Literal["approve", "reject", "in_review"]
    #: Shown to the applicant.
    decision_note: str = Field(default="", max_length=2000)
    #: Never shown to the applicant.
    reviewer_note: str = Field(default="", max_length=4000)


class PractitionerCard(BaseModel):
    """One row of the directory.

    Rating and consultation count are absent until reviews exist — a card that
    invents `4.9 · 1,204 readings` for someone who has taken no consultations
    is a fabricated credential, and the preview data in the web app is already
    labelled as such for the same reason.
    """

    id: str
    practice_type: PracticeType
    display_name: str
    headline: str
    photo_url: str | None
    city: str
    country: str
    years_experience: int
    languages: list[str]
    traditions: list[str]
    specialities: list[str]
    verified: bool


class PractitionerDetail(PractitionerCard):
    bio: str
    intro_video_url: str | None


class ProfileIn(BaseModel):
    """What a practitioner may change about their own listing.

    `verification_state` is not here. A practitioner cannot verify themselves.
    """

    display_name: str = Field(min_length=1, max_length=255)
    headline: str = Field(default="", max_length=255)
    bio: str = Field(default="", max_length=8000)
    photo_url: str | None = Field(default=None, max_length=512)
    intro_video_url: str | None = Field(default=None, max_length=512)
    city: str = Field(default="", max_length=255)
    country: str = Field(default="NP", min_length=2, max_length=2)
    years_experience: int = Field(default=0, ge=0, le=100)
    languages: list[str] = Field(default_factory=list)
    traditions: list[str] = Field(default_factory=list)
    specialities: list[str] = Field(default_factory=list)
    is_listed: bool = True


class DirectoryOut(BaseModel):
    items: list[PractitionerCard]
    total: int


class RateIn(BaseModel):
    """What a practitioner charges, per medium.

    A rate of zero withdraws that medium rather than making it free: the
    directory will not offer a consultation the practitioner has not priced,
    and "free" is a decision nobody has asked for.
    """

    medium: Literal["chat", "voice", "video"]
    per_minute_minor: int = Field(ge=0, le=100_000, description="Minor units per minute")
    is_active: bool = True


class RateOut(BaseModel):
    medium: Literal["chat", "voice", "video"]
    per_minute_minor: int
    currency: str
    is_active: bool
