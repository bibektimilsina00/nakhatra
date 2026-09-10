"use client";

import { useQuery } from "@tanstack/react-query";

import { fetchPatro } from "@/features/patro/api/patro-api";

/** A month of the calendar. The sky for past days never changes, so it is
 *  cached hard (CLAUDE.md rule 6: server state lives in TanStack Query). */
export function usePatro(start: string, days: number) {
  return useQuery({
    queryKey: ["patro", start, days],
    queryFn: () => fetchPatro(start, days),
    staleTime: 1000 * 60 * 60,
    gcTime: 1000 * 60 * 60 * 12,
  });
}
