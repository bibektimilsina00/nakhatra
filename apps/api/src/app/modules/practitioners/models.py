"""Tables for practitioners — the human half of the marketplace.

Indexes are declared in `__table_args__` with `idx_` names, matching the
convention the vault already set (see `vault/models.py` for why).

The filterable attributes — languages, traditions, specialities — are their own
tables rather than delimited strings in a column. The directory filters on all
three, and `WHERE languages LIKE '%ne%'` is both wrong (it matches "nep" inside
another word) and unindexable.
"""

from __future__ import annotations

from sqlalchemy import Index, UniqueConstraint
from sqlmodel import Field, SQLModel


class PractitionerProfile(SQLModel, table=True):
    """The public listing. One per practitioner account.

    A profile exists from the moment an application is approved, and only a
    profile with `verification_state == "verified"` is ever returned by the
    public directory. There is deliberately no way to list before review.
    """

    __tablename__ = "practitioner_profiles"
    __table_args__ = (
        UniqueConstraint("user_id", name="uq_practitioner_profiles_user"),
        Index("idx_practitioner_profiles_user_id", "user_id"),
        # The directory's default query: verified, listed, ordered. Covering
        # the filter columns from the start rather than after the first slow
        # page (docs/astrologer-marketplace.md §9).
        Index("idx_practitioner_profiles_directory", "verification_state", "is_listed"),
    )

    id: str = Field(primary_key=True, max_length=64)
    user_id: str = Field(max_length=64)

    #: `astrologer` reads charts; `pandit` performs rituals. One role with a
    #: type rather than two parallel implementations — they differ in what they
    #: sell, not in how the account works.
    practice_type: str = Field(default="astrologer", max_length=32)

    display_name: str = Field(max_length=255)
    headline: str = Field(default="", max_length=255)
    bio: str = Field(default="")
    photo_url: str | None = Field(default=None, max_length=512)
    intro_video_url: str | None = Field(default=None, max_length=512)
    city: str = Field(default="", max_length=255)
    country: str = Field(default="NP", max_length=2)
    years_experience: int = Field(default=0)

    #: `pending` | `in_review` | `verified` | `rejected` | `suspended`.
    verification_state: str = Field(default="pending", max_length=32)
    #: A verified practitioner can still take themselves off the directory.
    is_listed: bool = Field(default=False)

    created_at: str
    updated_at: str


class PractitionerAttribute(SQLModel, table=True):
    """Languages, traditions and specialities in one table, keyed by `kind`.

    Three near-identical tables would mean three repositories, three joins and
    three migrations to add a fourth facet later. The rows are
    (profile, kind, value) triples either way, so one table with a kind column
    carries the same information and stays open to a facet nobody has thought
    of yet.
    """

    __tablename__ = "practitioner_attributes"
    __table_args__ = (
        UniqueConstraint("profile_id", "kind", "value", name="uq_practitioner_attribute"),
        Index("idx_practitioner_attributes_lookup", "kind", "value"),
        Index("idx_practitioner_attributes_profile", "profile_id"),
    )

    id: str = Field(primary_key=True, max_length=64)
    profile_id: str = Field(max_length=64)
    #: `language` | `tradition` | `speciality`.
    kind: str = Field(max_length=32)
    #: Normalised at write time — `ne`, `parashari`, `marriage`. Display names
    #: are the client's business; matching is ours.
    value: str = Field(max_length=64)


class PractitionerApplication(SQLModel, table=True):
    """Someone asking to practise here, and the reviewer's decision.

    Kept separate from the profile because they have different lifetimes and
    different readers: an application is a private conversation with a
    reviewer, and a profile is a public listing. Merging them would put
    reviewer notes one careless `select *` away from the directory.
    """

    __tablename__ = "practitioner_applications"
    __table_args__ = (
        Index("idx_practitioner_applications_user", "user_id"),
        Index("idx_practitioner_applications_state", "state"),
    )

    id: str = Field(primary_key=True, max_length=64)
    user_id: str = Field(max_length=64)
    practice_type: str = Field(default="astrologer", max_length=32)

    full_name: str = Field(max_length=255)
    phone: str = Field(default="", max_length=64)
    city: str = Field(default="", max_length=255)
    country: str = Field(default="NP", max_length=2)
    years_experience: int = Field(default=0)
    #: Free text: where they trained, who taught them, what they are known for.
    credentials: str = Field(default="")
    #: A written reading, so a reviewer can judge the work and not just the CV.
    sample_reading: str = Field(default="")
    languages: str = Field(default="")
    traditions: str = Field(default="")
    #: Comma-joined. One person is often both an astrologer and a pandit.
    practices: str = Field(default="astrologer")
    #: A line, carried through to the profile on approval.
    headline: str = Field(default="", max_length=160)
    photo_url: str | None = Field(default=None, max_length=512)

    #: `submitted` | `in_review` | `approved` | `rejected` | `withdrawn`.
    state: str = Field(default="submitted", max_length=32)
    #: Never shown to the applicant. `decision_note` is what they see.
    reviewer_note: str = Field(default="")
    decision_note: str = Field(default="")
    reviewed_by: str | None = Field(default=None, max_length=64)
    reviewed_at: str | None = Field(default=None, max_length=64)

    created_at: str
    updated_at: str


class RateCard(SQLModel, table=True):
    """What one practitioner charges per minute, per medium.

    Per medium because they are not the same product: typing is cheaper to
    deliver than a video call, and a practitioner who prices them the same will
    end up refusing the expensive one.

    The rate is copied onto a consultation when it starts. A practitioner who
    raises their price mid-session must not change what the seeker already
    agreed to.
    """

    __tablename__ = "rate_cards"
    __table_args__ = (
        UniqueConstraint("profile_id", "medium", name="uq_rate_card_medium"),
        Index("idx_rate_cards_profile", "profile_id"),
    )

    id: str = Field(primary_key=True, max_length=64)
    profile_id: str = Field(max_length=64)
    #: `chat` | `voice` | `video`.
    medium: str = Field(max_length=16)
    #: Minor units per minute. Integer, like everything else about money.
    per_minute_minor: int = Field(default=0)
    currency: str = Field(default="NPR", max_length=3)
    #: A practitioner can withdraw one medium without deleting its price.
    is_active: bool = Field(default=True)
    updated_at: str
