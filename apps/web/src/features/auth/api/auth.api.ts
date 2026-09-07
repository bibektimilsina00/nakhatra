import type { LoginForm, SignupForm } from "@/features/auth/schema/auth-forms";
import type {
  GoogleSignInBody,
  PasswordChangeBody,
  ProfileUpdateBody,
  TokenResponse,
  UserProfile,
} from "@/features/auth/types";
import { authHeaders } from "@/features/auth/store/auth-store";
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

export function updateProfile(body: ProfileUpdateBody): Promise<UserProfile> {
  return apiFetch("/v1/auth/me", { method: "PATCH", body, headers: authHeaders() });
}

export function changePassword(body: PasswordChangeBody): Promise<UserProfile> {
  return apiFetch("/v1/auth/password", { method: "POST", body, headers: authHeaders() });
}
