"""Wire contract for consultations."""

from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field

Medium = Literal["chat", "voice", "video"]
State = Literal["requested", "accepted", "active", "ended", "declined", "cancelled", "expired"]


class RequestIn(BaseModel):
    profile_id: str = Field(min_length=1, max_length=64)
    medium: Medium = "chat"
    #: ISO-8601. Present when this is a booking rather than "now". The
    #: lifecycle is identical either way — a booking is a consultation that has
    #: not connected yet.
    scheduled_at: str | None = Field(default=None, max_length=64)
    #: Optional. Sharing a chart is a separate, revocable grant — requesting a
    #: consultation does not imply it.
    kundali_id: str | None = Field(default=None, max_length=64)
    opening_message: str = Field(default="", max_length=2000)


class ConsultationOut(BaseModel):
    id: str
    seeker_id: str
    practitioner_user_id: str
    profile_id: str
    medium: Medium
    state: State
    rate_per_minute_minor: int
    currency: str
    scheduled_at: str | None
    connected_at: str | None
    ended_at: str | None
    billed_seconds: int
    charged_minor: int
    created_at: str
    #: The other party, from the reader's side. Filled on the list — a
    #: conversation list that says "chat · requested" and not who with is a
    #: table of rows, not an inbox.
    counterpart_name: str = ""
    counterpart_photo_url: str | None = None
    #: The last thing said, and how much of it the reader has not seen.
    last_message: str = ""
    last_message_at: str | None = None
    unread_count: int = 0
    #: Whether the seeker has already rated this one. Drives whether the room
    #: offers the rating form; the server refuses a second review either way.
    reviewed: bool = False


class MessageIn(BaseModel):
    body: str = Field(min_length=1, max_length=4000)


class MessageOut(BaseModel):
    id: str
    sender_id: str
    body: str
    created_at: str
    read_at: str | None


class GrantOut(BaseModel):
    id: str
    kundali_id: str
    practitioner_user_id: str
    granted_at: str
    revoked_at: str | None


class ReviewIn(BaseModel):
    rating: int = Field(ge=1, le=5)
    body: str = Field(default="", max_length=2000)


class ReplyIn(BaseModel):
    reply: str = Field(min_length=1, max_length=2000)


class ReviewOut(BaseModel):
    id: str
    rating: int
    body: str
    reply: str
    #: The seeker's display name. Not their email, and not their id.
    author: str
    created_at: str


class PractitionerStats(BaseModel):
    """What a reader needs to judge somebody, and nothing invented.

    Every figure is counted from rows that exist. A practitioner with no
    consultations has zeroes and a `rating_average` of None — not 4.9, and not
    a hidden section that makes the page look complete.
    """

    rating_average: float | None
    rating_count: int
    consultations_completed: int
    follower_count: int
    #: Whether the *viewer* follows them. Null when nobody is signed in.
    is_following: bool | None
