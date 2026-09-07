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
    """Setting up a practitioner profile.

    Short on purpose. This was an essay — where you trained, and a written
    sample reading — which is a reasonable thing to ask a stranger and a
    terrible thing to put between someone and joining. What a reader actually
    chooses on is the name, the photograph, the languages and what you practise;
    everything else can be filled in later from the desk.
    """

    #: One person is often both. `practice_type` below stays for the clients
    #: that only understand one, and is derived from this.
    practice_types: list[PracticeType] = Field(default_factory=lambda: ["astrologer"])
    #: Kept so existing clients and stored rows keep working (rule 7). Ignored
    #: when `practice_types` is given.
    practice_type: PracticeType = "astrologer"
    full_name: str = Field(min_length=1, max_length=255)
    phone: str = Field(default="", max_length=64)
    city: str = Field(default="", max_length=255)
    country: str = Field(default="NP", min_length=2, max_length=2)
    years_experience: int = Field(default=0, ge=0, le=100)
    #: A line, not a CV.
    headline: str = Field(default="", max_length=160)
    photo_url: str | None = Field(default=None, max_length=512)
    languages: list[str] = Field(default_factory=list)
    traditions: list[str] = Field(default_factory=list)
    #: Both retained so nothing already submitted is lost, neither required.
    credentials: str = Field(default="", max_length=4000)
    sample_reading: str = Field(default="", max_length=8000)


class ApplicationOut(BaseModel):
    """What an applicant sees about their own application.

    Carries back everything they submitted, so the waiting page can show the
    profile they made rather than a single line saying it is with a reviewer.

    `reviewer_note` is deliberately absent. It is the reviewer's working
    notes — "references did not respond", "second opinion needed" — and
    `decision_note` is the message written to be read.
    """

    id: str
    practice_type: PracticeType
    practice_types: list[PracticeType]
    full_name: str
    headline: str
    photo_url: str | None
    city: str
    country: str
    years_experience: int
    languages: list[str]
    traditions: list[str]
    state: ApplicationState
    decision_note: str
    created_at: str
    updated_at: str


class ApplicationReviewOut(ApplicationOut):
    """The same application, as a reviewer sees it. Admin routes only."""

    user_id: str
    phone: str
    #: Retained so nothing already submitted is lost; no longer asked for.
    credentials: str
    sample_reading: str
    reviewer_note: str
    reviewed_by: str | None
    reviewed_at: str | None


class ReviewDecisionIn(BaseModel):
    decision: Literal["approve", "reject", "in_review"]
    #: Shown to the applicant.
    decision_note: str = Field(default="", max_length=2000)
    #: Never shown to the applicant.
    reviewer_note: str = Field(default="", max_length=4000)


class PhotoOut(BaseModel):
    """Where an uploaded photograph now lives."""

    photo_url: str


class PractitionerCard(BaseModel):
    """One row of the directory.

    Rating and consultation count are absent until reviews exist — a card that
    invents `4.9 · 1,204 readings` for someone who has taken no consultations
    is a fabricated credential, and the preview data in the web app is already
    labelled as such for the same reason.
    """

    id: str
    practice_type: PracticeType
    #: Everything they practise. `practice_type` is the first of these.
    practice_types: list[PracticeType]
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

    practice_types: list[PracticeType] = Field(default_factory=list)
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
