import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { getStats, getUsers, updateUserRole } from "@/features/admin/api";
import type { AdminStatsOverview, UserListResponse } from "@/features/admin/types";
import { ApiError } from "@/lib/api/errors";

export function useAdminStats() {
  return useQuery<AdminStatsOverview, ApiError>({
    queryKey: ["admin", "stats"],
    queryFn: getStats,
    // Admin stats don't need to refresh rapidly
    staleTime: 60_000,
  });
}

export function useAdminUsers(page: number, search: string) {
  return useQuery<UserListResponse, ApiError>({
    queryKey: ["admin", "users", page, search],
    queryFn: () => getUsers(page, search),
    staleTime: 30_000,
  });
}

export function useUpdateUserRole() {
  const queryClient = useQueryClient();

  return useMutation<
    { status: string },
    ApiError,
    { userId: string; role: string }
  >({
    mutationFn: ({ userId, role }) => updateUserRole(userId, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
    },
  });
}
