"use client";

import { useQuery } from "@tanstack/react-query";

import { fetchRasifal } from "@/features/rasifal/api/rasifal-api";

/** Server state lives in TanStack Query (CLAUDE.md rule 6). The sky for a
 *  given date never changes, so it is cached hard. */
export function useRasifal(on?: string) {
  return useQuery({
    queryKey: ["rasifal", on ?? "today"],
    queryFn: () => fetchRasifal(on),
    staleTime: 1000 * 60 * 60,
    gcTime: 1000 * 60 * 60 * 6,
  });
}
