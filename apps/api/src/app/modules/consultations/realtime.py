"""Live consultation sockets.

A registry of open connections, keyed by consultation, plus a publish call the
router makes after a state change or a message. The service layer stays free of
transport: it commits and returns, and the router decides who is told.

**Scope, stated plainly.** This registry lives in one process. With a single
uvicorn worker — how this is deployed today — that is correct and simple. Run
two workers or two replicas and a message published on one is invisible to
sockets held by the other, because there is nothing between them.

The seam for fixing that is `publish()`: it is the only place that fans out, so
a Redis pub/sub backend replaces its body and nothing else changes. Building
that now, before there is a second process, would be inventing a distributed
system to serve one machine.
"""

from __future__ import annotations

import asyncio
import json
import logging
from collections import defaultdict

from fastapi import WebSocket

logger = logging.getLogger(__name__)

#: consultation id -> the sockets watching it.
_rooms: dict[str, set[WebSocket]] = defaultdict(set)
#: Guards the registry. Joins and leaves interleave with fan-out.
_lock = asyncio.Lock()


async def join(consultation_id: str, socket: WebSocket) -> None:
    async with _lock:
        _rooms[consultation_id].add(socket)


async def leave(consultation_id: str, socket: WebSocket) -> None:
    async with _lock:
        room = _rooms.get(consultation_id)
        if room is None:
            return
        room.discard(socket)
        # Empty rooms are removed. A long-lived process that never cleaned up
        # would keep one empty set per consultation ever held.
        if not room:
            _rooms.pop(consultation_id, None)


async def publish(consultation_id: str, event: dict) -> None:
    """Send one event to everyone watching this consultation.

    A send that fails removes its socket rather than raising: the other party
    is still connected and must still be told, and a browser whose laptop lid
    closed should not break delivery for the person still there.
    """
    async with _lock:
        watchers = list(_rooms.get(consultation_id, ()))

    if not watchers:
        return

    payload = json.dumps(event, ensure_ascii=False)
    dead: list[WebSocket] = []
    for socket in watchers:
        try:
            await socket.send_text(payload)
        except Exception:  # noqa: BLE001 -- any transport failure means gone
            dead.append(socket)

    for socket in dead:
        await leave(consultation_id, socket)


def room_size(consultation_id: str) -> int:
    """How many sockets are watching. Used by tests and the debug view."""
    return len(_rooms.get(consultation_id, ()))
