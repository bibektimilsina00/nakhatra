import { authHeaders } from "@/features/auth/store/auth-store";

export interface StudioFile {
  name: string;
  size: number;
}

export interface StudioStatus {
  date: string;
  running: boolean;
  error?: string;
  log: string;
  files: StudioFile[];
}

/** Admin-only, all three: the server asks the API who is calling. */
export async function fetchStudioStatus(date: string): Promise<StudioStatus> {
  const res = await fetch(`/api/studio/status?date=${date}`, { headers: authHeaders() });
  if (!res.ok) throw new Error(`studio status ${res.status}`);
  return (await res.json()) as StudioStatus;
}

export async function startStudioRender(date: string): Promise<void> {
  const res = await fetch("/api/studio/generate", {
    method: "POST",
    headers: { ...authHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify({ date }),
  });
  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as { error?: { message?: string } } | null;
    throw new Error(body?.error?.message || `studio generate ${res.status}`);
  }
}

/** The file itself. A blob rather than a plain link because these routes want
 *  a bearer token and a `<video src>` cannot carry one. */
export async function fetchStudioFile(date: string, name: string): Promise<Blob> {
  const res = await fetch(`/api/studio/file?date=${date}&name=${encodeURIComponent(name)}`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error(`studio file ${res.status}`);
  return res.blob();
}
