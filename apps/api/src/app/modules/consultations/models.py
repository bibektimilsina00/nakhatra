"""Consultation tables.

`ConsultationMessage` is deliberately **not** `chat_messages`. That table
belongs to AI conversations: one participant, no delivery state, no read
receipts, no moderation. Overloading it would give both features a shape that
suits neither (docs/astrologer-marketplace.md §8).
"""

from __future__ import annotations

from sqlalchemy import Index
from sqlmodel import Field, SQLModel


class Consultation(SQLModel, table=True):
    """One session between a seeker and a practitioner.

    `rate_per_minute_minor` is copied here when the session starts, not read
    from the rate card at the end. A practitioner who changes their price
    mid-call must not change what the seeker agreed to.
    """

    __tablename__ = "consultations"
    __table_args__ = (
        Index("idx_consultations_seeker", "seeker_id", "created_at"),
        Index("idx_consultations_practitioner", "practitioner_user_id", "state"),
    )

    id: str = Field(primary_key=True, max_length=64)
    seeker_id: str = Field(max_length=64)
    practitioner_user_id: str = Field(max_length=64)
    profile_id: str = Field(max_length=64)

    #: `chat` | `voice` | `video`.
    medium: str = Field(default="chat", max_length=16)
    #: `requested` | `accepted` | `active` | `ended` | `declined` | `cancelled` | `expired`
    state: str = Field(default="requested", max_length=16)

    rate_per_minute_minor: int = Field(default=0)
    currency: str = Field(default="NPR", max_length=3)

    #: The hold placed when the session started. Captured or released on end.
    hold_id: str | None = Field(default=None, max_length=64)

    #: Metering runs between these two, and nothing else.
    #:
    #: `connected_at` is set when the session actually becomes usable — not
    #: when it was accepted. The gap between those is where "I was charged for
    #: a call that never connected" lives.
    connected_at: str | None = Field(default=None, max_length=64)
    ended_at: str | None = Field(default=None, max_length=64)

    billed_seconds: int = Field(default=0)
    charged_minor: int = Field(default=0)

    created_at: str
    updated_at: str


class ConsultationEvent(SQLModel, table=True):
    """Every state transition, append-only.

    This is the audit trail a billing dispute is settled from. Without it, the
    only record of what happened is the final state, which cannot answer "when
    did it connect".
    """

    __tablename__ = "consultation_events"
    __table_args__ = (Index("idx_consultation_events_lookup", "consultation_id", "created_at"),)

    id: str = Field(primary_key=True, max_length=64)
    consultation_id: str = Field(max_length=64)
    #: The state entered.
    state: str = Field(max_length=16)
    #: Who caused it: a user id, or `system`.
    actor: str = Field(default="system", max_length=64)
    detail: str = Field(default="")
    created_at: str


class ConsultationMessage(SQLModel, table=True):
    __tablename__ = "consultation_messages"
    __table_args__ = (Index("idx_consultation_messages_lookup", "consultation_id", "created_at"),)

    id: str = Field(primary_key=True, max_length=64)
    consultation_id: str = Field(max_length=64)
    sender_id: str = Field(max_length=64)
    body: str
    created_at: str
    #: When the other party read it. Human conversation needs this; the AI
    #: conversation table has no concept of it.
    read_at: str | None = Field(default=None, max_length=64)


class ChartGrant(SQLModel, table=True):
    """One seeker letting one practitioner see one saved chart.

    Deliberately narrow. Never "share with all practitioners", never "share
    everything" — a chart is birth data (CLAUDE.md rule 9), and the grant is
    scoped, revocable and audited.

    Conversation grants are a separate table when they arrive: wanting a second
    opinion on a chart is not consent to what you asked the AI about your
    marriage.
    """

    __tablename__ = "chart_grants"
    __table_args__ = (
        Index("idx_chart_grants_practitioner", "practitioner_user_id", "revoked_at"),
        Index("idx_chart_grants_seeker", "seeker_id"),
    )

    id: str = Field(primary_key=True, max_length=64)
    seeker_id: str = Field(max_length=64)
    practitioner_user_id: str = Field(max_length=64)
    kundali_id: str = Field(max_length=64)
    consultation_id: str | None = Field(default=None, max_length=64)
    granted_at: str
    revoked_at: str | None = Field(default=None, max_length=64)


class GrantAccess(SQLModel, table=True):
    """Every read of a shared chart: who, when, which.

    Consent that cannot be audited is a checkbox. This is the difference.
    """

    __tablename__ = "grant_access_log"
    __table_args__ = (Index("idx_grant_access_grant", "grant_id", "created_at"),)

    id: str = Field(primary_key=True, max_length=64)
    grant_id: str = Field(max_length=64)
    accessed_by: str = Field(max_length=64)
    created_at: str
