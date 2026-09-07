import { authHeaders } from "@/features/auth/store/auth-store";
import type { ChatSession, SaveKundaliBody, SavedKundali } from "@/features/vault/types";
import { apiFetch } from "@/lib/api/client";

export function listKundalis(): Promise<SavedKundali[]> {
  return apiFetch("/v1/vault/kundalis", { headers: authHeaders() });
}

export function listSessions(): Promise<ChatSession[]> {
  return apiFetch("/v1/vault/sessions", { headers: authHeaders() });
}

export function deleteKundali(id: string): Promise<void> {
  return apiFetch(`/v1/vault/kundalis/${encodeURIComponent(id)}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
}

export function saveKundali(body: SaveKundaliBody): Promise<SavedKundali> {
  return apiFetch("/v1/vault/kundalis", {
    method: "POST",
    body,
    headers: authHeaders(),
  });
}
