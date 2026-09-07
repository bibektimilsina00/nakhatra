"use client";

import { useCallback, useSyncExternalStore } from "react";

import type { Chart } from "@/features/kundali/types";

type Period = NonNullable<Chart["dasha"]>["periods"][number];

/**
 * Which Vimshottari periods are running right now.
 *
 * Three places had this as `periods[0]` and `periods[1]`, which is neither:
 * `periods[0]` is the first mahadasha *from birth*, and `periods[1]` is the
 * second mahadasha being labelled as the antardasha — wrong period and wrong
 * level. A chart born in 1998 was showing its birth-era dashas as current, in
 * the panel, the header, the astrologer's opening line and the suggestion
 * chips, all at once.
 *
 * The antardasha comes from the running mahadasha's own children, which is the
 * only place a level-2 period actually lives.
 */
export function currentDasha(
  chart: Chart | null,
  today: string,
): { maha: Period | null; antar: Period | null } {
  const periods = chart?.dasha?.periods ?? [];
  // ISO dates compare correctly as strings, which side-steps parsing a date in
  // one timezone and comparing it against one built in another.
  const running = (p: Period) => p.start <= today && today <= p.end;

  const maha = periods.find(running) ?? null;
  const antar = maha?.children?.find(running) ?? null;
  return { maha, antar };
}

/**
 * Today, as `YYYY-MM-DD`, in the reader's own timezone.
 *
 * Via `useSyncExternalStore` rather than `new Date()` in render: the wall clock
 * is external state, and reading it during render is impure — the lint rule
 * that catches it is right, because two renders in the same commit could
 * disagree. Re-checked hourly, which is ample for a period measured in years.
 */
export function useToday(): string {
  const subscribe = useCallback((onChange: () => void) => {
    const id = setInterval(onChange, 60 * 60 * 1000);
    return () => clearInterval(id);
  }, []);

  return useSyncExternalStore(subscribe, localDate, () => "");
}

function localDate(): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  // Not `toISOString()`: that is UTC, and east of Greenwich it reports
  // tomorrow's date for most of the evening.
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}
