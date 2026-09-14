import { authHeaders } from "@/features/auth/store/auth-store";
import type { ChatSession, SaveKundaliBody, SavedKundali } from "@/features/vault/types";
import type { components } from "@/lib/api/generated/schema";
import { apiFetch } from "@/lib/api/client";

export type ChatSessionIn = components["schemas"]["ChatSessionIn"];
export type ChatMessageIn = components["schemas"]["ChatMessageIn"];
export type ChatMessageOut = components["schemas"]["ChatMessageOut"];

export function listKundalis(): Promise<SavedKundali[]> {
  return apiFetch("/v1/vault/kundalis", { headers: authHeaders() });
}

export function listSessions(): Promise<ChatSession[]> {
  return apiFetch("/v1/vault/sessions", { headers: authHeaders() });
}

export function createSession(body: ChatSessionIn): Promise<ChatSession> {
  return apiFetch("/v1/vault/sessions", {
    method: "POST",
    body,
    headers: authHeaders(),
  });
}

export function getSession(id: string): Promise<ChatSession> {
  return apiFetch(`/v1/vault/sessions/${encodeURIComponent(id)}`, {
    headers: authHeaders(),
  });
}

export function deleteSession(id: string): Promise<void> {
  return apiFetch(`/v1/vault/sessions/${encodeURIComponent(id)}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
}

export function getSessionMessages(id: string): Promise<ChatMessageOut[]> {
  return apiFetch(`/v1/vault/sessions/${encodeURIComponent(id)}/messages`, {
    headers: authHeaders(),
  });
}

export function addSessionMessage(id: string, body: ChatMessageIn): Promise<ChatMessageOut> {
  return apiFetch(`/v1/vault/sessions/${encodeURIComponent(id)}/messages`, {
    method: "POST",
    body,
    headers: authHeaders(),
  });
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
