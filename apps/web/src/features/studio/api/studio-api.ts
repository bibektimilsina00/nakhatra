import { authHeaders } from "@/features/auth/store/auth-store";

export interface StudioFile {
  name: string;
  size: number;
}

export type PartPublish =
  | { videoId: string; url?: string; note?: string; at: string }
  | { error: string; at: string };

type ChannelPublish = { part1?: PartPublish; part2?: PartPublish };

export interface PublishState {
  youtube?: ChannelPublish;
  tiktok?: ChannelPublish;
}

export interface StudioStatus {
  date: string;
  today: string;
  running: boolean;
  startedAt?: number;
  error?: string;
  publishing: boolean;
  log: string;
  files: StudioFile[];
  publish: PublishState;
  days: string[];
}

export interface StudioSettings {
  voice: string;
  hashtags: string;
  daily: { enabled: boolean; time: string };
  youtube: { enabled: boolean; privacy: "private" | "unlisted" | "public"; publishTime: string };
  tiktok: { enabled: boolean; privacy: string };
}

export interface StudioConfig {
  settings: StudioSettings;
  connections: {
    youtube: Connection;
    tiktok: Connection & { privacyOptions: string[]; maxDurationSec: number };
  };
  youtubeRedirectUri: string;
  tiktokRedirectUri: string;
}

interface Connection {
  configured: boolean;
  connected: boolean;
  channel: string | null;
  connectedAt: string | null;
}

async function call<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(path, {
    ...init,
    headers: { ...authHeaders(), ...(init.body ? { "Content-Type": "application/json" } : {}), ...init.headers },
  });
  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as { error?: { message?: string } } | null;
    throw new Error(body?.error?.message || `${path} ${res.status}`);
  }
  return (await res.json()) as T;
}

/** Admin-only, all of it: the server asks the API who is calling. */
export const fetchStudioStatus = (date: string) => call<StudioStatus>(`/api/studio/status?date=${date}`);

export const startStudioRender = (date: string) =>
  call<{ date: string }>("/api/studio/generate", { method: "POST", body: JSON.stringify({ date }) });

export interface PublishRequest {
  channel?: "youtube" | "tiktok";
  part?: "1" | "2";
  force?: boolean;
}

export const publishStudioDay = (date: string, req: PublishRequest = {}) =>
  call<{ publish: PublishState }>("/api/studio/publish", {
    method: "POST",
    body: JSON.stringify({ date, ...req }),
  });

/** Dismiss a channel's failures for a day. */
export const clearStudioErrors = (date: string, channel: string) =>
  call<{ publish: PublishState }>(`/api/studio/publish?date=${date}&channel=${channel}`, {
    method: "DELETE",
  });

export const fetchStudioConfig = () => call<StudioConfig>("/api/studio/settings");

export const saveStudioSettings = (patch: Partial<StudioSettings>) =>
  call<{ settings: StudioSettings }>("/api/studio/settings", { method: "PUT", body: JSON.stringify(patch) });

/** `channel` is "youtube" or "tiktok" — the routes are the same shape. */
export const beginConnect = (channel: string) =>
  call<{ url: string }>(`/api/studio/connect/${channel}`, { method: "POST" });

export const disconnectChannel = (channel: string) =>
  call<{ ok: true }>(`/api/studio/connect/${channel}`, { method: "DELETE" });

/** One slide's HTML, for a `srcdoc` iframe. */
export async function fetchStudioSlide(date: string, part: "1" | "2", i: number): Promise<string> {
  const res = await fetch(`/api/studio/slide?date=${date}&part=${part}&i=${i}`, { headers: authHeaders() });
  if (!res.ok) throw new Error(`slide ${res.status}`);
  return res.text();
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
