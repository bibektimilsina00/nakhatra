import type { LoginForm, SignupForm } from "@/features/auth/schema/auth-forms";
import type { GoogleSignInBody, TokenResponse, UserProfile } from "@/features/auth/types";
import { apiFetch } from "@/lib/api/client";

export function login(body: LoginForm): Promise<TokenResponse> {
  return apiFetch("/v1/auth/login", { method: "POST", body });
}

export function signup(body: SignupForm): Promise<TokenResponse> {
  return apiFetch("/v1/auth/signup", { method: "POST", body });
}

/** Exchange a Google ID token for one of ours. */
export function signInWithGoogle(body: GoogleSignInBody): Promise<TokenResponse> {
  return apiFetch("/v1/auth/google", { method: "POST", body });
}

export function fetchMe(token: string): Promise<UserProfile> {
  // The token is passed in rather than read from the store: this is called
  // while validating a rehydrated session, before the store is trusted.
  return apiFetch("/v1/auth/me", { headers: { Authorization: `Bearer ${token}` } });
}
