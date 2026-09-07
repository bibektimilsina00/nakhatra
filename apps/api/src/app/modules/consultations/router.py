"""Consultation endpoints. Routes only.

Note what is absent: no route sets `billed_seconds` or `charged_minor`, and no
route accepts a duration. The server measures the session; the client reports
nothing that costs money.
"""

from __future__ import annotations

import asyncio
import json

from fastapi import APIRouter, Depends, WebSocket, WebSocketDisconnect
from sqlmodel import Session

from app.core.db import SessionDep, get_engine
from app.modules.auth.jwt_handler import decode_jwt_token
from app.modules.auth.router_deps import get_current_user, get_optional_user
from app.modules.consultations import calls, realtime, service
from app.modules.consultations.schemas import (
    ConsultationOut,
    GrantOut,
    MessageIn,
    MessageOut,
    PractitionerStats,
    ReplyIn,
    RequestIn,
    ReviewIn,
    ReviewOut,
)

#: How long a socket has to send its auth frame before it is closed.
AUTH_TIMEOUT_SECONDS = 10

#: What a client may pass to the other party. Anything else is dropped, so the
#: socket cannot become an unmoderated side-channel.
SIGNAL_TYPES = frozenset({"offer", "answer", "ice", "call-start", "call-end", "call-decline"})

#: An SDP with candidates inline is a few kilobytes. This is generous and still
#: stops a socket being used to push megabytes at the other party.
MAX_SIGNAL_BYTES = 64 * 1024

router = APIRouter(prefix="/v1", tags=["consultations"])


@router.get(
    "/calls/ice",
    response_model=calls.IceConfig,
    summary="ICE servers for a browser placing a call",
    description=(
        "Served from settings rather than the client bundle, because TURN "
        "credentials are credentials. `has_relay` is false when none is "
        "configured, which the client shows as a warning — without a relay a "
        "call fails on symmetric NAT and many mobile carriers."
    ),
)
def ice(_user_id: str = Depends(get_current_user)) -> calls.IceConfig:
    return calls.ice_config()


@router.post("/consultations", response_model=ConsultationOut)
def request_consultation(
    body: RequestIn, session: SessionDep, user_id: str = Depends(get_current_user)
) -> ConsultationOut:
    return service.request(session, user_id, body)


@router.get("/consultations", response_model=list[ConsultationOut])
def my_consultations(
    session: SessionDep, user_id: str = Depends(get_current_user)
) -> list[ConsultationOut]:
    return service.mine(session, user_id)


@router.get("/consultations/{consultation_id}", response_model=ConsultationOut)
def one(
    consultation_id: str, session: SessionDep, user_id: str = Depends(get_current_user)
) -> ConsultationOut:
    return service.get(session, consultation_id, user_id)


@router.post("/consultations/{consultation_id}/accept", response_model=ConsultationOut)
async def accept(
    consultation_id: str, session: SessionDep, user_id: str = Depends(get_current_user)
) -> ConsultationOut:
    consultation = service.accept(session, consultation_id, user_id)
    # Published after the commit, never before: a socket must not announce a
    # state the database has not accepted.
    await realtime.publish(
        consultation_id,
        {"type": "state", "consultation": consultation.model_dump(mode="json")},
    )
    return consultation


@router.post("/consultations/{consultation_id}/decline", response_model=ConsultationOut)
async def decline(
    consultation_id: str, session: SessionDep, user_id: str = Depends(get_current_user)
) -> ConsultationOut:
    consultation = service.decline(session, consultation_id, user_id)
    # Published after the commit, never before: a socket must not announce a
    # state the database has not accepted.
    await realtime.publish(
        consultation_id,
        {"type": "state", "consultation": consultation.model_dump(mode="json")},
    )
    return consultation


@router.post("/consultations/{consultation_id}/cancel", response_model=ConsultationOut)
async def cancel(
    consultation_id: str, session: SessionDep, user_id: str = Depends(get_current_user)
) -> ConsultationOut:
    consultation = service.cancel(session, consultation_id, user_id)
    # Published after the commit, never before: a socket must not announce a
    # state the database has not accepted.
    await realtime.publish(
        consultation_id,
        {"type": "state", "consultation": consultation.model_dump(mode="json")},
    )
    return consultation


@router.post(
    "/consultations/{consultation_id}/connect",
    response_model=ConsultationOut,
    summary="Start the session and the meter",
    description=(
        "Places a hold for the lesser of the wallet and an hour of talking, and "
        "records `connected_at` from the server clock. Refuses with 402 when the "
        "wallet cannot fund the minimum billable session — before anyone starts "
        "speaking, rather than cutting them off ten seconds in."
    ),
)
async def connect(
    consultation_id: str, session: SessionDep, user_id: str = Depends(get_current_user)
) -> ConsultationOut:
    consultation = service.connect(session, consultation_id, user_id)
    # Published after the commit, never before: a socket must not announce a
    # state the database has not accepted.
    await realtime.publish(
        consultation_id,
        {"type": "state", "consultation": consultation.model_dump(mode="json")},
    )
    return consultation


@router.post(
    "/consultations/{consultation_id}/end",
    response_model=ConsultationOut,
    summary="Stop the meter and capture what was used",
    description=(
        "Elapsed time is measured server-side from `connected_at`. The hold is a "
        "ceiling: the capture is what the measurement says and the remainder is "
        "released. Billed per second with a 60-second minimum."
    ),
)
async def end(
    consultation_id: str, session: SessionDep, user_id: str = Depends(get_current_user)
) -> ConsultationOut:
    consultation = service.end(session, consultation_id, user_id)
    # Published after the commit, never before: a socket must not announce a
    # state the database has not accepted.
    await realtime.publish(
        consultation_id,
        {"type": "state", "consultation": consultation.model_dump(mode="json")},
    )
    return consultation


@router.get("/consultations/{consultation_id}/messages", response_model=list[MessageOut])
def messages(
    consultation_id: str, session: SessionDep, user_id: str = Depends(get_current_user)
) -> list[MessageOut]:
    return service.messages(session, consultation_id, user_id)


@router.post("/consultations/{consultation_id}/messages", response_model=MessageOut)
async def send(
    consultation_id: str,
    body: MessageIn,
    session: SessionDep,
    user_id: str = Depends(get_current_user),
) -> MessageOut:
    message = service.send_message(session, consultation_id, user_id, body.body)
    await realtime.publish(
        consultation_id, {"type": "message", "message": message.model_dump(mode="json")}
    )
    return message


@router.get(
    "/grants",
    response_model=list[GrantOut],
    summary="Every chart this account has shared",
    description="Consent has to be visible to be meaningful. This is that page.",
)
def grants(session: SessionDep, user_id: str = Depends(get_current_user)) -> list[GrantOut]:
    return service.my_grants(session, user_id)


@router.post(
    "/grants/{grant_id}/revoke",
    response_model=GrantOut,
    summary="Withdraw access to a shared chart",
    description="Immediate. The practitioner loses access on the next request.",
)
def revoke(
    grant_id: str, session: SessionDep, user_id: str = Depends(get_current_user)
) -> GrantOut:
    return service.revoke_grant(session, grant_id, user_id)


@router.websocket("/consultations/{consultation_id}/ws")
async def consultation_socket(websocket: WebSocket, consultation_id: str) -> None:
    """Live updates for one consultation.

    **Auth is the first frame, not the URL.** A browser cannot set headers on a
    WebSocket handshake, and the usual workaround — `?token=…` — writes a
    bearer token into access logs, proxy logs and browser history. So the
    socket is accepted, then the client has ten seconds to send
    `{"type": "auth", "token": "…"}`, and anything else closes it.

    Membership is checked the same way every other consultation route checks
    it: you must be one of the two parties. A socket is not a way around that.
    """
    await websocket.accept()

    try:
        raw = await asyncio.wait_for(websocket.receive_json(), timeout=AUTH_TIMEOUT_SECONDS)
    except (TimeoutError, WebSocketDisconnect, ValueError):
        await websocket.close(code=4401, reason="auth timeout")
        return

    token = raw.get("token") if isinstance(raw, dict) else None
    payload = decode_jwt_token(token) if token else None
    if not payload or "sub" not in payload:
        await websocket.close(code=4401, reason="not authenticated")
        return
    user_id = str(payload["sub"])

    # One short-lived session for the membership check. The socket then holds
    # no database connection for its lifetime, which is the difference between
    # a hundred idle sockets and a hundred idle connections.
    with Session(get_engine()) as session:
        try:
            service.get(session, consultation_id, user_id)
        except Exception:  # noqa: BLE001 -- any failure means "not yours"
            await websocket.close(code=4403, reason="not a party to this consultation")
            return

    await realtime.join(consultation_id, websocket)
    await websocket.send_json({"type": "ready"})

    try:
        while True:
            raw = await websocket.receive_text()

            # Signalling is the one thing a client may send onward, and it goes
            # only to the other party in this room. Everything that changes
            # state still goes through the HTTP routes, where it is authorised
            # and, where it costs money, metered.
            if len(raw) > MAX_SIGNAL_BYTES:
                continue
            try:
                frame = json.loads(raw)
            except ValueError:
                continue
            if isinstance(frame, dict) and frame.get("type") in SIGNAL_TYPES:
                await realtime.relay(consultation_id, websocket, frame)
    except WebSocketDisconnect:
        pass
    finally:
        await realtime.leave(consultation_id, websocket)


# --- reviews and follows ---


@router.post(
    "/consultations/{consultation_id}/review",
    response_model=ReviewOut,
    summary="Rate a consultation you had",
    description=(
        "Only the seeker, only once, and only after it ended. Ratings anyone "
        "can write are worthless, and a rating on a session that never "
        "connected is a review of nothing."
    ),
)
def review(
    consultation_id: str,
    body: ReviewIn,
    session: SessionDep,
    user_id: str = Depends(get_current_user),
) -> ReviewOut:
    return service.leave_review(session, consultation_id, user_id, body.rating, body.body)


@router.post(
    "/reviews/{review_id}/reply",
    response_model=ReviewOut,
    summary="Reply to a review of you",
)
def reply(
    review_id: str,
    body: ReplyIn,
    session: SessionDep,
    user_id: str = Depends(get_current_user),
) -> ReviewOut:
    return service.reply_to_review(session, review_id, user_id, body.reply)


@router.post("/practitioners/{practitioner_user_id}/follow", response_model=PractitionerStats)
def follow(
    practitioner_user_id: str,
    session: SessionDep,
    user_id: str = Depends(get_current_user),
) -> PractitionerStats:
    return service.follow(session, user_id, practitioner_user_id)


@router.delete("/practitioners/{practitioner_user_id}/follow", response_model=PractitionerStats)
def unfollow(
    practitioner_user_id: str,
    session: SessionDep,
    user_id: str = Depends(get_current_user),
) -> PractitionerStats:
    return service.unfollow(session, user_id, practitioner_user_id)


@router.get(
    "/following",
    response_model=list[str],
    summary="Practitioner user ids this account follows",
)
def following(session: SessionDep, user_id: str = Depends(get_current_user)) -> list[str]:
    return service.following_ids(session, user_id)


@router.get(
    "/practitioners/{practitioner_user_id}/stats",
    response_model=PractitionerStats,
    summary="Ratings, completed consultations and followers",
    description=(
        "Public: this is what someone reads before deciding to book. "
        "`rating_average` is null rather than 0 when nobody has rated yet — a "
        "new practitioner is unrated, not terrible."
    ),
)
def practitioner_stats(
    practitioner_user_id: str,
    session: SessionDep,
    viewer_id: str | None = Depends(get_optional_user),
) -> PractitionerStats:
    return service.stats_for(session, practitioner_user_id, viewer_id)


@router.get(
    "/practitioners/{practitioner_user_id}/reviews",
    response_model=list[ReviewOut],
    summary="Reviews written about a practitioner",
)
def practitioner_reviews(
    practitioner_user_id: str, session: SessionDep, limit: int = 50
) -> list[ReviewOut]:
    return service.reviews_of(session, practitioner_user_id, limit)
