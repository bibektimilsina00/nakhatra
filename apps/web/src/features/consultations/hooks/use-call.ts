"use client";

import { useEffect, useState, useSyncExternalStore } from "react";

import { authHeaders } from "@/features/auth/store/auth-store";
import { CallSession, type CallSnapshot } from "@/features/consultations/call-session";

/**
 * A one-to-one call between the two parties of a consultation.
 *
 * Peer-to-peer, signalled over the consultation's existing WebSocket. Two
 * people talking to each other need no server in the media path, and adding
 * one would mean running an SFU to solve a problem this call does not have.
 * The socket already exists, already knows who is in the room, and already
 * refuses everyone else — so signalling costs nothing and inherits the
 * membership check.
 *
 * The media is peer-to-peer; the **billing is not**. Money still moves through
 * the consultation's connect and end, measured on the server, so nothing here
 * can influence what a call costs.
 *
 * The session itself is an object (`call-session.ts`) and this hook only
 * observes it. A media session is imperative and long-lived; expressed as a
 * dozen refs it becomes something React cannot reason about and the compiler
 * rightly complains.
 */
export function useCall(send: (frame: unknown) => void, onSignal: (h: (f: never) => void) => () => void) {
  const [session] = useState(
    () =>
      new CallSession(send, async () => {
        const res = await fetch("/api/v1/calls/ice", { headers: authHeaders() });
        return res.json();
      }),
  );

  const snapshot: CallSnapshot = useSyncExternalStore(
    session.subscribe,
    session.snapshot,
    session.snapshot,
  );

  useEffect(() => onSignal((frame) => void session.handle(frame)), [onSignal, session]);

  // Leaving the page must not leave a camera on.
  useEffect(() => () => session.teardown(), [session]);

  return { session, ...snapshot };
}
