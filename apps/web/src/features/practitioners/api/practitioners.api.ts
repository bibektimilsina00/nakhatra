import { authHeaders } from "@/features/auth/store/auth-store";
import type {
  ApplicationIn,
  RateIn,
  RateOut,
  ApplicationOut,
  ApplicationReview,
  DirectoryOut,
  DirectoryQuery,
  PractitionerDetail,
  ProfileIn,
  ReviewDecision,
} from "@/features/practitioners/types";
import { apiFetch } from "@/lib/api/client";

/** Browsing is unauthenticated — it is how someone decides whether to sign up. */
export function directory(query: DirectoryQuery = {}): Promise<DirectoryOut> {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== null && value !== "") params.set(key, String(value));
  }
  const qs = params.toString();
  return apiFetch(`/v1/practitioners${qs ? `?${qs}` : ""}`);
}

export function practitioner(id: string): Promise<PractitionerDetail> {
  return apiFetch(`/v1/practitioners/${encodeURIComponent(id)}`);
}

export function apply(body: ApplicationIn): Promise<ApplicationOut> {
  return apiFetch("/v1/practitioners/applications", {
    method: "POST",
    body,
    headers: authHeaders(),
  });
}

export function myApplication(): Promise<ApplicationOut | null> {
  return apiFetch("/v1/practitioners/applications/me", { headers: authHeaders() });
}

export function myProfile(): Promise<PractitionerDetail> {
  return apiFetch("/v1/practitioners/me/profile", { headers: authHeaders() });
}

export function updateProfile(body: ProfileIn): Promise<PractitionerDetail> {
  return apiFetch("/v1/practitioners/me/profile", {
    method: "PUT",
    body,
    headers: authHeaders(),
  });
}

export function reviewQueue(state?: string): Promise<ApplicationReview[]> {
  const qs = state ? `?state=${encodeURIComponent(state)}` : "";
  return apiFetch(`/v1/admin/practitioner-applications${qs}`, { headers: authHeaders() });
}

export function review(id: string, body: ReviewDecision): Promise<ApplicationReview> {
  return apiFetch(`/v1/admin/practitioner-applications/${encodeURIComponent(id)}/review`, {
    method: "POST",
    body,
    headers: authHeaders(),
  });
}

export function myRates(): Promise<RateOut[]> {
  return apiFetch("/v1/practitioners/me/rates", { headers: authHeaders() });
}

export function setRate(body: RateIn): Promise<RateOut[]> {
  return apiFetch("/v1/practitioners/me/rates", {
    method: "PUT",
    body,
    headers: authHeaders(),
  });
}

/**
 * Upload a photograph and get back its URL.
 *
 * Not through `apiFetch`: that sets a JSON content type and serialises the
 * body, and multipart needs the browser to set its own boundary.
 */
export async function uploadPhoto(file: File): Promise<{ photo_url: string }> {
  const form = new FormData();
  form.append("file", file);
  const res = await fetch("/api/v1/practitioners/photo", {
    method: "POST",
    headers: authHeaders(),
    body: form,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.error?.message ?? "That image could not be uploaded.");
  }
  return res.json();
}
