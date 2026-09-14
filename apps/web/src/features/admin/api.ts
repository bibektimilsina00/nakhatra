import { authHeaders } from "@/features/auth/store/auth-store";
import { apiFetch } from "@/lib/api/client";
import type { AdminStatsOverview } from "./types";

export function getStats(): Promise<AdminStatsOverview> {
  return apiFetch("/v1/admin/stats", {
    headers: authHeaders(),
  });
}
