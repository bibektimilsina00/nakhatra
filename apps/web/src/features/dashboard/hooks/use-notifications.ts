"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";

import { useChatSessions, useSavedKundalis } from "@/features/vault/hooks/use-vault";

/**
 * The bell's contents.
 *
 * Derived from the vault rather than invented. There is no notifications
 * endpoint, and inventing entries would mean a bell that lights up over
 * nothing — so this reports what actually happened to this account: charts
 * added, conversations updated. When a real feed exists, this hook changes and
 * nothing above it does.
 */

export interface Notification {
  id: string;
  title: string;
  /** A translation key, not prose — the panel renders in three languages. */
  detail: "notifSavedToVault" | "notifConversationUpdated";
  /** ISO timestamp of the event. */
  at: string;
  unread: boolean;
}

/** Anything from the last day is still worth a dot. */
const UNREAD_WINDOW_MS = 24 * 60 * 60 * 1000;

/** How often relative times are allowed to go stale. */
const TICK_MS = 60_000;

/**
 * The wall clock, read the way any other changing external value is.
 *
 * `Date.now()` during render is impure — the same render can produce two
 * answers, and a `useMemo` holding one goes quietly stale. Flooring to the tick
 * keeps the snapshot stable between updates, which `useSyncExternalStore`
 * requires: an ever-changing snapshot would re-render forever.
 */
export function useNow(interval = TICK_MS): number {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const id = setInterval(onChange, interval);
      return () => clearInterval(id);
    },
    [interval],
  );

  return useSyncExternalStore(
    subscribe,
    () => Math.floor(Date.now() / interval) * interval,
    // The server has no meaningful "now" for this, and rendering one would
    // mismatch the client's first paint.
    () => 0,
  );
}

/** Where "I have seen everything up to here" is kept. */
const READ_KEY = "nakhatra.notifications.read-at";
/** Same-tab writes do not fire `storage`, so the store announces its own. */
const READ_EVENT = "nakhatra:notifications-read";

/**
 * The moment the reader last cleared the bell, as epoch milliseconds.
 *
 * localStorage read through `useSyncExternalStore` rather than `useState` +
 * effect: every component showing a badge has to agree, and the count in the
 * bar must drop the instant the panel's button is pressed rather than one
 * render later.
 */
export function useReadAt(): number {
  return useSyncExternalStore(
    (onChange) => {
      addEventListener(READ_EVENT, onChange);
      // Another tab clearing the bell counts too.
      addEventListener("storage", onChange);
      return () => {
        removeEventListener(READ_EVENT, onChange);
        removeEventListener("storage", onChange);
      };
    },
    () => Number(localStorage.getItem(READ_KEY)) || 0,
    // The server cannot know, and guessing would mismatch the first paint.
    () => 0,
  );
}

/** Clear the bell. Everything already on screen becomes read; nothing is lost. */
export function markAllRead(): void {
  localStorage.setItem(READ_KEY, String(Date.now()));
  dispatchEvent(new Event(READ_EVENT));
}

export function useNotifications(limit = 6): {
  items: Notification[];
  unread: number;
  total: number;
} {
  const { data: kundalis = [] } = useSavedKundalis();
  const { data: sessions = [] } = useChatSessions();
  const now = useNow();
  const readAt = useReadAt();

  return useMemo(() => {
    // Unread means recent AND newer than the last time the bell was cleared.
    // Recency alone left a permanent badge on an account that had just been
    // set up; `readAt` alone would light the bell up for a chart saved a year
    // ago the first time someone opened the app.
    const fresh = (iso: string) =>
      now > 0 && now - Date.parse(iso) < UNREAD_WINDOW_MS && Date.parse(iso) > readAt;

    const items: Notification[] = [
      ...kundalis.map((k) => ({
        id: `kundali:${k.id}`,
        title: k.name,
        detail: "notifSavedToVault" as const,
        at: k.created_at,
        unread: fresh(k.created_at),
      })),
      ...sessions.map((s) => ({
        id: `session:${s.id}`,
        title: s.title,
        detail: "notifConversationUpdated" as const,
        at: s.updated_at,
        unread: fresh(s.updated_at),
      })),
    ]
      // Newest first. The bell shows a glance; /notifications shows the lot.
      .sort((a, b) => Date.parse(b.at) - Date.parse(a.at));

    return {
      items: items.slice(0, limit),
      // Counted over everything, not just the visible slice — a badge reading
      // "6" beside seven unread items is worse than no badge.
      unread: items.filter((item) => item.unread).length,
      total: items.length,
    };
  }, [kundalis, sessions, now, readAt, limit]);
}

/** "2 min ago" — enough precision for a list you scan. */
export function relativeTime(iso: string, now: number): string {
  if (!now) return "";
  const seconds = Math.max(0, Math.round((now - Date.parse(iso)) / 1000));
  if (seconds < 60) return "just now";
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} hr ago`;
  const days = Math.round(hours / 24);
  if (days === 1) return "yesterday";
  if (days < 30) return `${days} days ago`;
  return iso.slice(0, 10);
}
