/**
 * One fetch wrapper. Every feature's `api.ts` goes through it, so error
 * translation lives in exactly one place instead of six copies of the same
 * `if (!res.ok) throw new ApiError(...)`.
 *
 * Requests go to `/api/...`, the Next proxy, not to FastAPI directly. One route
 * to the backend means one place that forwards auth, one place that masks
 * upstream detail, and no dependence on browser CORS.
 */

import { ApiError, type ApiErrorBody, NetworkError } from "./errors";

type RequestOptions = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  signal?: AbortSignal;
  /** Extra headers, typically `authHeaders()` from the auth store. */
  headers?: Record<string, string>;
};

export async function apiFetch<T>(
  path: string,
  { method = "GET", body, signal, headers = {} }: RequestOptions = {},
): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`/api${path}`, {
      method,
      signal,
      headers: body ? { "Content-Type": "application/json", ...headers } : headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    // fetch only rejects on a transport failure; an HTTP error is a resolved
    // promise, which is the single most common source of "why did my error
    // handler not run".
    throw new NetworkError();
  }

  if (!response.ok) {
    const parsed = await response
      .json()
      .catch(() => undefined as ApiErrorBody | undefined);
    throw new ApiError(response.status, parsed);
  }

  return (await response.json()) as T;
}
