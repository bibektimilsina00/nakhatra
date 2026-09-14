import { useQuery } from "@tanstack/react-query";

import { getStats } from "@/features/admin/api";
import type { AdminStatsOverview } from "@/features/admin/types";
import { ApiError } from "@/lib/api/errors";

export function useAdminStats() {
  return useQuery<AdminStatsOverview, ApiError>({
    queryKey: ["admin", "stats"],
    queryFn: getStats,
    // Admin stats don't need to refresh rapidly
    staleTime: 60_000,
  });
}
