"use client";

import { useQuery } from "@tanstack/react-query";

import { fetchRasifal, fetchRasifalPeriod } from "@/features/rasifal/api/rasifal-api";

/** Server state lives in TanStack Query (CLAUDE.md rule 6). The sky for a
 *  given date never changes, so it is cached hard. */
export function useRasifal(on?: string, language = "ne") {
  return useQuery({
    queryKey: ["rasifal", on ?? "today", language],
    queryFn: () => fetchRasifal(on, language),
    // The writer fills a day in the background, so a page opened in that
    // minute should come back for the prose rather than cache the gap.
    staleTime: 1000 * 30,
    gcTime: 1000 * 60 * 60 * 6,
  });
}

/** The week's or month's reading. Same caching argument as the daily. */
export function useRasifalPeriod(span: "weekly" | "monthly", on?: string, enabled = true) {
  return useQuery({
    queryKey: ["rasifal-period", span, on ?? "today"],
    queryFn: () => fetchRasifalPeriod(span, on),
    enabled,
    staleTime: 1000 * 60 * 60,
    gcTime: 1000 * 60 * 60 * 6,
  });
}
