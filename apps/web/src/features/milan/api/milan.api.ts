import { authHeaders } from "@/features/auth/store/auth-store";
import type {
  MilanAnalysis,
  MilanAnalysisRequest,
  MilanRequest,
  MilanResponse,
} from "@/features/milan/types";
import { apiFetch } from "@/lib/api/client";

export function calculateMatch(body: MilanRequest): Promise<MilanResponse> {
  return apiFetch("/v1/milan/match", { method: "POST", body });
}

/** Authenticated, unlike `/match` — it costs a model call, so it is not open. */
export function analyseMatch(body: MilanAnalysisRequest): Promise<MilanAnalysis> {
  return apiFetch("/v1/milan/analysis", { method: "POST", body, headers: authHeaders() });
}
