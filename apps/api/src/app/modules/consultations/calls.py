"""What a browser needs to place a call.

The ICE servers live here rather than in the client bundle for one reason: TURN
credentials are credentials. Baked into JavaScript they are a relay anyone can
use at your expense.
"""

from __future__ import annotations

from pydantic import BaseModel

from app.core.config import get_settings


class IceServer(BaseModel):
    urls: list[str]
    username: str | None = None
    credential: str | None = None


class IceConfig(BaseModel):
    ice_servers: list[IceServer]
    #: False when no TURN relay is configured. The client tells the caller that
    #: a call may not connect on some networks, instead of spinning forever on
    #: the one connection in five that needs a relay.
    has_relay: bool


def ice_config() -> IceConfig:
    settings = get_settings()
    servers: list[IceServer] = []

    stun = [u.strip() for u in settings.STUN_URLS.split(",") if u.strip()]
    if stun:
        servers.append(IceServer(urls=stun))

    if settings.TURN_URL:
        servers.append(
            IceServer(
                urls=[settings.TURN_URL],
                username=settings.TURN_USERNAME or None,
                credential=settings.TURN_PASSWORD or None,
            )
        )

    return IceConfig(ice_servers=servers, has_relay=bool(settings.TURN_URL))
