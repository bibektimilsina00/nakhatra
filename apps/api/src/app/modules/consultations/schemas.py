"""Wire contract for consultations."""

from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field

Medium = Literal["chat", "voice", "video"]
State = Literal["requested", "accepted", "active", "ended", "declined", "cancelled", "expired"]


class RequestIn(BaseModel):
    profile_id: str = Field(min_length=1, max_length=64)
    medium: Medium = "chat"
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
    connected_at: str | None
    ended_at: str | None
    billed_seconds: int
    charged_minor: int
    created_at: str


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
