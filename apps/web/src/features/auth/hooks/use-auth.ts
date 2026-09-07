"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useSyncExternalStore } from "react";

import * as authApi from "@/features/auth/api/auth.api";
import type { LoginForm, SignupForm } from "@/features/auth/schema/auth-forms";
import { useAuthStore } from "@/features/auth/store/auth-store";
import type { GoogleSignInBody, TokenResponse, UserProfile } from "@/features/auth/types";
import type { ApiError } from "@/lib/api/errors";
import { identifyUser, resetUser, trackEvent } from "@/providers/posthog-provider";

/**
 * Auth mutations. The store holds who you are; TanStack Query owns everything
 * fetched about you, so signing out clears the cache rather than resetting a
 * second copy of the data (docs/architecture.md §8).
 */

function useSessionStart() {
  const setSession = useAuthStore((s) => s.setSession);
  return (data: TokenResponse, method: "login" | "signup") => {
    setSession(data.access_token, data.user);
    identifyUser(data.user.id, {
      email: data.user.email,
      name: data.user.full_name,
    });
    trackEvent(method === "login" ? "user_signed_in" : "user_signed_up");
  };
}

export function useLogin() {
  const start = useSessionStart();
  return useMutation<TokenResponse, ApiError, LoginForm>({
    mutationFn: authApi.login,
    onSuccess: (data) => start(data, "login"),
  });
}

export function useSignup() {
  const start = useSessionStart();
  return useMutation<TokenResponse, ApiError, SignupForm>({
    mutationFn: authApi.signup,
    onSuccess: (data) => start(data, "signup"),
  });
}

/**
 * Google sign-in. The same session start as email/password — the server hands
 * back one of our tokens, not Google's, so nothing downstream knows or cares
 * which button was pressed.
 */
export function useGoogleSignIn() {
  const start = useSessionStart();
  return useMutation<TokenResponse, ApiError, GoogleSignInBody>({
    mutationFn: authApi.signInWithGoogle,
    onSuccess: (data) => start(data, "login"),
  });
}

export function useLogout() {
  const clearSession = useAuthStore((s) => s.clearSession);
  const queryClient = useQueryClient();
  return () => {
    trackEvent("user_signed_out");
    resetUser();
    clearSession();
    // Not optional: without it the next user to sign in on this device sees the
    // previous user's cached vault until the queries refetch.
    queryClient.clear();
  };
}

/**
 * Whether the persisted session has been read back from localStorage yet.
 *
 * `persist` cannot hydrate during the first client render — that render has to
 * match the server's HTML, which knows nothing about localStorage. So for one
 * tick `token` is null even for a signed-in visitor, and any guard that reads
 * `isSignedIn` immediately bounces them to the sign-in page. Gate on this
 * before acting on a signed-out answer.
 */
export function useAuthHydrated(): boolean {
  return useSyncExternalStore(
    (onChange) => useAuthStore.persist.onFinishHydration(onChange),
    () => useAuthStore.persist.hasHydrated(),
    // The server has no localStorage, so it is never hydrated. Returning false
    // here keeps the first client render identical to the server's.
    () => false,
  );
}

/** Current session. Read-only — mutate through the hooks above. */
export function useSession() {
  const user = useAuthStore((s) => s.user);
  const token = useAuthStore((s) => s.token);
  return { user, token, isSignedIn: Boolean(token) };
}

/**
 * Validates a rehydrated session once on mount.
 *
 * The store restores a token from localStorage, but a token that has expired
 * restores just as happily as a live one — the previous implementation kept a
 * dead session forever and every request 401'd with no explanation. Asking
 * `/me` once settles it, and re-identifies the user for analytics.
 */
export function useSessionSync() {
  const token = useAuthStore((s) => s.token);
  const setSession = useAuthStore((s) => s.setSession);
  const clearSession = useAuthStore((s) => s.clearSession);

  const query = useQuery<UserProfile, ApiError>({
    queryKey: ["auth", "me"],
    queryFn: () => authApi.fetchMe(token as string),
    enabled: Boolean(token),
    retry: false,
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    if (query.data && token) {
      setSession(token, query.data);
      identifyUser(query.data.id, {
        email: query.data.email,
        name: query.data.full_name,
      });
    }
  }, [query.data, token, setSession]);

  useEffect(() => {
    // Only an auth failure invalidates the session. A 502 means the backend is
    // down, and signing the user out because the server hiccuped is worse than
    // letting them retry.
    if (query.error?.status === 401) clearSession();
  }, [query.error, clearSession]);

  return { isValidating: query.isLoading };
}
