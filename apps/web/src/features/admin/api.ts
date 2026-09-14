import { authHeaders } from "@/features/auth/store/auth-store";
import { apiFetch } from "@/lib/api/client";
import type { AdminStatsOverview, UserListResponse } from "./types";

export function getStats(): Promise<AdminStatsOverview> {
  return apiFetch("/v1/admin/stats", {
    headers: authHeaders(),
  });
}

export function getUsers(page: number, search: string): Promise<UserListResponse> {
  const params = new URLSearchParams({
    page: String(page),
    limit: "20",
    ...(search ? { search } : {}),
  });
  return apiFetch(`/v1/admin/users?${params.toString()}`, {
    headers: authHeaders(),
  });
}

export function updateUserRole(userId: string, role: string): Promise<{ status: string }> {
  return apiFetch(`/v1/admin/users/${userId}/role`, {
    method: "PATCH",
    body: { role },
    headers: authHeaders(),
  });
}
