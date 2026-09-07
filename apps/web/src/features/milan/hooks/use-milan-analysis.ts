"use client";

import { useMutation } from "@tanstack/react-query";

import * as milanApi from "@/features/milan/api/milan.api";
import type { MilanAnalysis, MilanAnalysisRequest } from "@/features/milan/types";
import type { ApiError } from "@/lib/api/errors";
import { trackEvent } from "@/providers/posthog-provider";

/**
 * The model's reading of a match.
 *
 * A mutation rather than a query: it costs a model call, so it fires when the
 * match lands and on an explicit retry — never on a refocus or a remount.
 *
 * Sends birth details, not the finished match. The server recomputes the
 * Ashtakoota from them, so the model can only ever read a score the engine
 * produced (CLAUDE.md rule 1) and the request stays four fields wide.
 */
export function useMilanAnalysis() {
  return useMutation<MilanAnalysis, ApiError, MilanAnalysisRequest>({
    mutationFn: milanApi.analyseMatch,
    onSuccess: (data) => {
      // Shape only. No names, dates or birthplaces in analytics (rule 9).
      trackEvent("milan_analysed", {
        strengths: data.strengths.length,
        concerns: data.concerns.length,
        doshas: data.doshas.filter((d) => d.severity !== "none").length,
        remedies: data.remedies.length,
      });
    },
  });
}
