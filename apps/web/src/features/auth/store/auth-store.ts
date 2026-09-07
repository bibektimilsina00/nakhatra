"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

import type { UserProfile } from "@/features/auth/types";

/**
 * Session identity. Identity only — no server data.
 * The saved-kundali list is server state and lives in TanStack Query
 * (`features/vault`), not here.
 */
interface AuthState {
  token: string | null;
  user: UserProfile | null;
  setSession: (token: string, user: UserProfile) => void;
  clearSession: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      setSession: (token, user) => set({ token, user }),
      clearSession: () => set({ token: null, user: null }),
    }),
    {
      name: "nakhatra-auth",
      // ponytail: the token is persisted to localStorage, which matches the
      // behaviour this replaces. It is readable by any injected script — moving
      // it to an httpOnly cookie set by the proxy is the real fix, and is a
      // session-behaviour change that does not belong in a refactor.
      partialize: (s) => ({ token: s.token, user: s.user }),
    },
  ),
);

/** Bearer headers for an authenticated call, or `{}` when signed out. */
export function authHeaders(): Record<string, string> {
  const token = useAuthStore.getState().token;
  return token ? { Authorization: `Bearer ${token}` } : {};
}
