"""Wire contract for the Cloud Vault (saved kundalis and chat sessions).

The flat birth fields here (`dob`, `tob`, `lat`, `lon`, `tz_offset`,
`place_name`) are a second, weaker spelling of `kundali.BirthDetailsIn`: no zone
validation, no latitude bounds, no `time_accuracy`. A row saved through this
module therefore could not be fed back into `/v1/kundali` without every client
writing its own translation.

`SavedKundaliOut.birth` is the fix, added additively: new clients read the
validated nested object, old builds keep reading the flat fields. The flat
columns remain the single source of truth — `birth` is derived on read, never
stored twice.
"""

from __future__ import annotations

from pydantic import BaseModel, Field

from app.modules.kundali.schemas import BirthDetailsIn


class SavedKundaliIn(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    gender: str = Field("male", pattern="^(male|female)$")
    dob: str = Field(..., pattern=r"^\d{4}-\d{2}-\d{2}$")
    tob: str = Field(..., pattern=r"^\d{2}:\d{2}(:\d{2})?$")
    lat: float = Field(..., ge=-90, le=90)
    lon: float = Field(..., ge=-180, le=180, description="East positive")

    tz_name: str | None = Field(
        default=None,
        examples=["Asia/Kathmandu"],
        description=(
            "IANA zone name. Optional only because clients that predate this "
            "field still post without it — send it. A stored UTC offset is wrong "
            "for any historical date whose zone has since changed, and the chart "
            "it produces looks entirely normal."
        ),
    )
    tz_offset: float = Field(
        ...,
        deprecated=True,
        description="Superseded by tz_name. Retained so old clients keep working.",
    )
    place_name: str


class SavedKundaliOut(SavedKundaliIn):
    id: str
    user_id: str
    created_at: str
    birth: BirthDetailsIn | None = Field(
        default=None,
        description=(
            "The saved birth data in the same shape `/v1/kundali` accepts, so a "
            "saved chart can be recalculated without translation. Null when the "
            "row predates `tz_name` — such a row cannot be recalculated correctly "
            "and needs a backfill rather than a guessed offset."
        ),
    )


class ChatMessageIn(BaseModel):
    sender: str = Field(..., pattern="^(user|astrologer)$")
    content: str = Field(..., min_length=1)


class ChatMessageOut(ChatMessageIn):
    id: str
    session_id: str
    created_at: str


class ChatSessionIn(BaseModel):
    title: str = Field("Kundali Chat", min_length=1, max_length=200)
    kundali_id: str | None = None
    chart_key: str | None = None


class ChatSessionOut(BaseModel):
    id: str
    user_id: str
    kundali_id: str | None = None
    chart_key: str | None = None
    title: str
    created_at: str
    updated_at: str
    messages: list[ChatMessageOut] = Field(
        default=[],
        description=(
            "Always empty in the session *list* — loading every message body for "
            "every session made that endpoint one query per session. Fetch a "
            "single session to get its messages."
        ),
    )
