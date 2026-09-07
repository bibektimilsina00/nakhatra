"use client";

import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { useAuthStore } from "@/features/auth/store/auth-store";
import type { Consultation, ConsultationMessage } from "@/features/consultations/types";

/**
 * The live connection for one consultation.
 *
 * Events land straight in the TanStack cache, so every component reading
 * `["consultation", id]` or `["consultation-messages", id]` updates without
 * knowing a socket exists. Server state stays in one place (CLAUDE.md rule 6);
 * this is a second *transport*, not a second copy.
 *
 * It reports whether it is connected, and the page falls back to polling when
 * it is not — a socket that silently fails is worse than polling, because the
 * screen simply stops updating with no sign that anything is wrong.
 */

/** Backoff between reconnection attempts, in milliseconds. */
const RETRY_MS = [1_000, 2_000, 5_000, 10_000];

export function useConsultationSocket(consultationId: string | null, enabled: boolean): boolean {
  const queryClient = useQueryClient();
  const token = useAuthStore((state) => state.token);
  const [open, setOpen] = useState(false);
  const attempt = useRef(0);

  useEffect(() => {
    // No setState on this path: "not connected" when disabled is derived at
    // the bottom, and writing it here would be a synchronous state update
    // inside an effect for a value that is already known.
    if (!consultationId || !enabled || !token) return;

    let socket: WebSocket | null = null;
    let retry: ReturnType<typeof setTimeout> | null = null;
    let closed = false;

    const open = () => {
      if (closed) return;
      socket = new WebSocket(socketUrl(consultationId));

      socket.onopen = () => {
        // Auth is the first frame, never the URL: a token in a query string
        // ends up in access logs, proxy logs and browser history.
        socket?.send(JSON.stringify({ type: "auth", token }));
      };

      socket.onmessage = (event) => {
        let payload: { type?: string; consultation?: Consultation; message?: ConsultationMessage };
        try {
          payload = JSON.parse(event.data);
        } catch {
          return;
        }

        if (payload.type === "ready") {
          attempt.current = 0;
          setOpen(true);
          return;
        }

        if (payload.type === "state" && payload.consultation) {
          queryClient.setQueryData(["consultation", consultationId], payload.consultation);
          // A state change moves money — connect places a hold, end captures it.
          queryClient.invalidateQueries({ queryKey: ["wallet"] });
          queryClient.invalidateQueries({ queryKey: ["consultations"] });
        }

        if (payload.type === "message" && payload.message) {
          const incoming = payload.message;
          queryClient.setQueryData<ConsultationMessage[]>(
            ["consultation-messages", consultationId],
            (current = []) =>
              // The sender already has this from its own POST response, so a
              // blind append would show their message twice.
              current.some((m) => m.id === incoming.id) ? current : [...current, incoming],
          );
        }
      };

      socket.onclose = () => {
        setOpen(false);
        if (closed) return;
        // Reconnect with backoff. The page polls in the meantime, so a long
        // outage degrades rather than freezes.
        const wait = RETRY_MS[Math.min(attempt.current, RETRY_MS.length - 1)];
        attempt.current += 1;
        retry = setTimeout(open, wait);
      };

      socket.onerror = () => socket?.close();
    };

    open();

    return () => {
      closed = true;
      if (retry) clearTimeout(retry);
      socket?.close();
      setOpen(false);
    };
  }, [consultationId, enabled, token, queryClient]);

  // Derived, so a disabled hook reports "down" without an effect writing it.
  return open && enabled && Boolean(consultationId);
}

/**
 * Where the socket lives.
 *
 * Not through the Next proxy: `proxy()` is an HTTP fetch and cannot carry a
 * WebSocket upgrade. The browser talks to the API directly, which in
 * production means the reverse proxy routing this path to it.
 */
function socketUrl(consultationId: string): string {
  const configured = process.env.NEXT_PUBLIC_WS_URL;
  const base =
    configured ??
    (typeof window !== "undefined" && window.location.hostname === "localhost"
      ? "ws://localhost:8000"
      : `${window.location.protocol === "https:" ? "wss:" : "ws:"}//${window.location.host}`);
  return `${base}/v1/consultations/${encodeURIComponent(consultationId)}/ws`;
}
