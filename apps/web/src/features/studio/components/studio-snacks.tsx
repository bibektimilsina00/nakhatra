"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { Check, TriangleAlert, X } from "lucide-react";

/**
 * Snackbars for the studio.
 *
 * A failed upload is something that happened at a moment, not a property of
 * the day — printed into the page it sat there for a week reading as live.
 * So it arrives, it can be acted on, and it goes away.
 *
 * Hand-rolled rather than a toast library: one admin page, three kinds of
 * message, and a dependency would be more code than this is.
 */

export interface Snack {
  tone: "ok" | "error";
  text: string;
  /** Something to do about it — "Dismiss" on a stored failure, say. */
  action?: { label: string; run: () => void };
  /** Milliseconds. Errors stay until they are closed. */
  timeout?: number;
}

type Shown = Snack & { id: number };

const SnackContext = createContext<(s: Snack) => void>(() => {});

/** Raise a snackbar. Safe to call from anywhere under the host. */
export const useSnack = () => useContext(SnackContext);

export function SnackHost({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<Shown[]>([]);

  const close = useCallback((id: number) => setItems((x) => x.filter((i) => i.id !== id)), []);

  const show = useCallback(
    (s: Snack) => {
      const id = Date.now() + Math.random();
      setItems((x) => [...x.slice(-3), { ...s, id }]);
      // Good news goes on its own; a refusal waits to be read.
      const ms = s.timeout ?? (s.tone === "ok" ? 3500 : 0);
      if (ms) setTimeout(() => close(id), ms);
    },
    [close],
  );

  const value = useMemo(() => show, [show]);

  return (
    <SnackContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex flex-col items-center gap-2 p-4 sm:items-end sm:p-6">
        {items.map((s) => (
          <div
            key={s.id}
            role="status"
            className={`pointer-events-auto flex w-full max-w-md items-start gap-2.5 rounded-[10px] border p-3 shadow-lg shadow-black/30 backdrop-blur ${
              s.tone === "ok"
                ? "border-emerald-400/30 bg-emerald-500/12 text-emerald-200"
                : "border-rose-400/30 bg-rose-500/12 text-rose-200"
            }`}
          >
            {s.tone === "ok" ? (
              <Check className="mt-0.5 size-4 shrink-0" />
            ) : (
              <TriangleAlert className="mt-0.5 size-4 shrink-0" />
            )}
            <span className="min-w-0 flex-1 text-[12.5px] leading-[1.6] break-words">{s.text}</span>
            {s.action && (
              <button
                type="button"
                onClick={() => {
                  s.action!.run();
                  close(s.id);
                }}
                className="shrink-0 cursor-pointer rounded-[6px] border border-current/30 px-2 py-1 text-[11.5px] font-semibold hover:bg-white/10"
              >
                {s.action.label}
              </button>
            )}
            <button
              type="button"
              onClick={() => close(s.id)}
              aria-label="Close"
              className="shrink-0 cursor-pointer opacity-60 hover:opacity-100"
            >
              <X className="size-3.5" />
            </button>
          </div>
        ))}
      </div>
    </SnackContext.Provider>
  );
}
