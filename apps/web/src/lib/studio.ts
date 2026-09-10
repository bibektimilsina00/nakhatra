import { spawn } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  openSync,
  readdirSync,
  readFileSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

import { API_URL } from "@/lib/api/proxy";
import { youtubeUpload } from "@/lib/studio-youtube";

/**
 * The video studio, server side.
 *
 * `scripts/rasifal-tiktok.mjs` already makes the day's two films from a
 * running site; this is the button that runs it on the box the site is
 * running on, so the morning post does not need a laptop with ffmpeg on it.
 * The same file holds the settings the button reads, the clock that presses
 * it unattended, and the hand-off to whichever channel is connected.
 *
 * State is files on the studio volume, not a database: a settings object, a
 * connections object, and a folder per day. The whole thing is one admin and
 * two videos a morning — a table for that is a migration for nothing.
 *
 * Server-only. Nothing here may be imported from a client component.
 */

/** The slide route is public HTML on a public domain, so it is gated by a
 *  shared secret rather than by a session: the browser that screenshots it is
 *  headless and carries no login. */
export const STUDIO_KEY = process.env.STUDIO_KEY || "";

/** A volume in production, the Desktop on a laptop. */
export const STUDIO_OUT = process.env.STUDIO_OUT || join(homedir(), "Desktop");

export const dirFor = (date: string) => join(STUDIO_OUT, `rasifal-${date}`);

const NEPAL_OFFSET_MS = (5 * 60 + 45) * 60000;

/** Today in Kathmandu, which is the day the rasifal is written for. */
export function todayInNepal(): string {
  return nepalNow().date;
}

/** The clock on the wall in Kathmandu, as the two strings the settings use. */
export function nepalNow(): { date: string; hhmm: string } {
  const iso = new Date(Date.now() + NEPAL_OFFSET_MS).toISOString();
  return { date: iso.slice(0, 10), hhmm: iso.slice(11, 16) };
}

/**
 * Admin, decided by the API rather than here.
 *
 * The role lives in one place and is checked in one way — a second opinion in
 * the web tier is a second thing to keep in step with it. A page that merely
 * hides itself is decoration; this is the control.
 */
export async function isAdmin(req: Request): Promise<boolean> {
  const auth = req.headers.get("authorization");
  if (!auth) return false;
  try {
    const res = await fetch(`${API_URL}/v1/auth/me`, {
      headers: { Authorization: auth },
      cache: "no-store",
    });
    if (!res.ok) return false;
    return ((await res.json()) as { role?: string }).role === "admin";
  } catch {
    return false;
  }
}

export const forbidden = () =>
  Response.json({ error: { code: "forbidden", message: "Admins only." } }, { status: 403 });

// ─── Settings ────────────────────────────────────────────────────────────────

export interface StudioSettings {
  /** A Gemini prebuilt voice. */
  voice: string;
  /** The caption's last line. */
  hashtags: string;
  /** Render unattended, at this time in Kathmandu. */
  daily: { enabled: boolean; time: string };
  /** Hand the finished films to YouTube. `publishTime` is when they go
   *  public, which YouTube honours only for a private upload. */
  youtube: {
    enabled: boolean;
    privacy: "private" | "unlisted" | "public";
    publishTime: string;
  };
}

export const DEFAULT_SETTINGS: StudioSettings = {
  voice: "Aoede",
  hashtags:
    "#rasifal #राशिफल #आजकोराशिफल #nepal #nepalitiktok #jyotish #ज्योतिष " +
    "#horoscope #zodiac #nepalinews #kathmandu #nakhatra #fyp #foryou",
  // The API writes the day's reading a little before two in the morning, so
  // anything after that finds the prose rather than the fallback sentence.
  daily: { enabled: false, time: "05:30" },
  youtube: { enabled: false, privacy: "private", publishTime: "07:00" },
};

const settingsPath = () => join(STUDIO_OUT, "settings.json");

function readJson<T>(path: string, fallback: T): T {
  try {
    return { ...fallback, ...(JSON.parse(readFileSync(path, "utf8")) as T) };
  } catch {
    return fallback;
  }
}

export function readSettings(): StudioSettings {
  const s = readJson(settingsPath(), DEFAULT_SETTINGS);
  return {
    ...s,
    daily: { ...DEFAULT_SETTINGS.daily, ...s.daily },
    youtube: { ...DEFAULT_SETTINGS.youtube, ...s.youtube },
  };
}

const HHMM = /^([01]\d|2[0-3]):[0-5]\d$/;
const PRIVACY = ["private", "unlisted", "public"] as const;

/** Accepts what it understands, keeps the rest as it was. A settings PUT
 *  that could write `time: "whenever"` is a scheduler that never fires. */
export function writeSettings(patch: Partial<StudioSettings>): StudioSettings {
  const cur = readSettings();
  const privacy = patch.youtube?.privacy;
  const next: StudioSettings = {
    voice: /^[A-Za-z]{2,24}$/.test(patch.voice ?? "") ? patch.voice! : cur.voice,
    hashtags: typeof patch.hashtags === "string" ? patch.hashtags.slice(0, 500) : cur.hashtags,
    daily: {
      enabled: patch.daily?.enabled ?? cur.daily.enabled,
      time: HHMM.test(patch.daily?.time ?? "") ? patch.daily!.time : cur.daily.time,
    },
    youtube: {
      enabled: patch.youtube?.enabled ?? cur.youtube.enabled,
      privacy: privacy && PRIVACY.includes(privacy) ? privacy : cur.youtube.privacy,
      publishTime: HHMM.test(patch.youtube?.publishTime ?? "")
        ? patch.youtube!.publishTime
        : cur.youtube.publishTime,
    },
  };
  mkdirSync(STUDIO_OUT, { recursive: true });
  writeFileSync(settingsPath(), JSON.stringify(next, null, 2));
  return next;
}

// ─── Connections ─────────────────────────────────────────────────────────────

/** What a connected channel leaves behind. Server-side only: a refresh token
 *  is a standing permission to post as the account, and it never goes to the
 *  browser — the page is told `connected: true` and the channel's name. */
export interface Connections {
  youtube?: { refreshToken: string; channel: string; connectedAt: string };
}

const connectionsPath = () => join(STUDIO_OUT, "connections.json");

export const readConnections = (): Connections => readJson(connectionsPath(), {});

export function writeConnections(next: Connections) {
  mkdirSync(STUDIO_OUT, { recursive: true });
  writeFileSync(connectionsPath(), JSON.stringify(next, null, 2), { mode: 0o600 });
}

/** The shape the page sees. */
export function publicConnections() {
  const c = readConnections();
  return {
    youtube: {
      configured: Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
      connected: Boolean(c.youtube),
      channel: c.youtube?.channel ?? null,
      connectedAt: c.youtube?.connectedAt ?? null,
    },
  };
}

// ─── Rendering ───────────────────────────────────────────────────────────────

type Job = { date: string; startedAt: number; finishedAt?: number; error?: string };

/**
 * Everything mutable, on `globalThis`.
 *
 * Next bundles this module once for the routes and again for
 * `instrumentation.ts`, and a module-level `let` is a different variable in
 * each. The clock started a render nobody could see: its `job` was set in
 * one copy while the status route read the other. Hanging the state off the
 * one object both copies share is the fix — and what the studio would want
 * anyway, since there is one server and one job.
 */
const state = (globalThis as unknown as { __studio?: { job: Job | null; publishing: string | null; clock: NodeJS.Timeout | null } }).__studio ??=
  { job: null, publishing: null, clock: null };

/** One render at a time. Two at once would fight over the CPU and finish
 *  slower than one after the other, and there is only ever one day to make. */
export const currentJob = () => state.job;

export function startRender(date: string): { started: boolean; reason?: string } {
  const job = state.job;
  if (job && !job.finishedAt) return { started: false, reason: `already rendering ${job.date}` };
  if (!STUDIO_KEY) return { started: false, reason: "STUDIO_KEY is not set on the server" };

  const dir = dirFor(date);
  mkdirSync(dir, { recursive: true });
  const log = openSync(join(dir, "render.log"), "w");
  const settings = readSettings();

  // Detached and inherited-fd rather than piped: the run outlives the request
  // that asked for it, and a pipe nobody reads fills up and blocks ffmpeg.
  // Absolute, and set explicitly in the image: `npm --prefix` leaves the cwd
  // wherever it was invoked, so a cwd-relative path finds the script on a
  // laptop and misses it in the container.
  const script = process.env.STUDIO_SCRIPT || join(process.cwd(), "scripts", "rasifal-tiktok.mjs");

  const child = spawn(
    process.execPath,
    [
      script,
      "--date", date,
      "--out", STUDIO_OUT,
      "--base", `http://127.0.0.1:${process.env.PORT || 3000}`,
      "--key", STUDIO_KEY,
      "--voice", settings.voice,
      "--hashtags", settings.hashtags,
    ],
    { stdio: ["ignore", log, log], env: process.env },
  );

  state.job = { date, startedAt: Date.now() };
  child.on("exit", (code) => {
    state.job = {
      ...state.job!,
      finishedAt: Date.now(),
      error: code === 0 ? undefined : `render exited with code ${code}`,
    };
    // The films are the point; the upload is what they are for.
    if (code === 0) publishDay(date).catch(() => undefined);
  });
  child.on("error", (err) => {
    state.job = { ...state.job!, finishedAt: Date.now(), error: err.message };
  });

  return { started: true };
}

export type StudioFile = { name: string; size: number };

/** What is on disk for a day. The mp4s are what the job is for; the captions
 *  sit beside them so the post can be assembled from this page alone. */
export function filesFor(date: string): StudioFile[] {
  const dir = dirFor(date);
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((n) => n.endsWith(".mp4") || n.endsWith("-caption.txt"))
    .sort()
    .map((name) => ({ name, size: statSync(join(dir, name)).size }));
}

/** Both films exist. */
export const isRendered = (date: string) =>
  filesFor(date).filter((f) => f.name.endsWith(".mp4")).length === 2;

/** Every day that has anything, newest first. */
export function renderedDays(limit = 30): string[] {
  if (!existsSync(STUDIO_OUT)) return [];
  return readdirSync(STUDIO_OUT)
    .filter((n) => /^rasifal-\d{4}-\d{2}-\d{2}$/.test(n))
    .map((n) => n.slice("rasifal-".length))
    .sort()
    .reverse()
    .slice(0, limit);
}

// ─── Publishing ──────────────────────────────────────────────────────────────

export type PartPublish =
  | { videoId: string; url: string; at: string }
  | { error: string; at: string };

export interface PublishState {
  youtube?: { part1?: PartPublish; part2?: PartPublish };
}

const publishPath = (date: string) => join(dirFor(date), "publish.json");
export const readPublish = (date: string): PublishState => readJson(publishPath(date), {});

export const isPublishing = () => state.publishing;

/**
 * Hand a rendered day to every channel that is connected and switched on.
 *
 * Idempotent per part: a part that already has a videoId is not uploaded
 * twice, so pressing Publish after a half-failed run only retries the half
 * that failed.
 */
export async function publishDay(date: string): Promise<PublishState> {
  if (state.publishing) throw new Error(`already publishing ${state.publishing}`);
  state.publishing = date;
  try {
    const settings = readSettings();
    const conns = readConnections();
    const pub = readPublish(date);

    if (settings.youtube.enabled && conns.youtube) {
      pub.youtube ??= {};
      for (const part of ["1", "2"] as const) {
        const key = `part${part}` as const;
        const done = pub.youtube[key];
        if (done && "videoId" in done) continue;

        const mp4 = join(dirFor(date), `rasifal-${date}-part${part}.mp4`);
        const captionFile = join(dirFor(date), `rasifal-${date}-part${part}-caption.txt`);
        if (!existsSync(mp4)) continue;
        const caption = existsSync(captionFile) ? readFileSync(captionFile, "utf8") : "";
        const title = (caption.split("\n")[0] || `Rasifal ${date} · part ${part}`).slice(0, 100);

        try {
          const videoId = await youtubeUpload({
            refreshToken: conns.youtube.refreshToken,
            file: mp4,
            title,
            description: caption,
            privacy: settings.youtube.privacy,
            // YouTube schedules only a private upload; for the others the
            // time is the moment the upload lands.
            publishAt:
              settings.youtube.privacy === "private"
                ? `${date}T${settings.youtube.publishTime}:00+05:45`
                : undefined,
          });
          pub.youtube[key] = {
            videoId,
            url: `https://youtu.be/${videoId}`,
            at: new Date().toISOString(),
          };
        } catch (err) {
          pub.youtube[key] = {
            error: err instanceof Error ? err.message : String(err),
            at: new Date().toISOString(),
          };
        }
        writeFileSync(publishPath(date), JSON.stringify(state, null, 2));
      }
    }
    return pub;
  } finally {
    state.publishing = null;
  }
}

// ─── The clock ───────────────────────────────────────────────────────────────

/**
 * Presses the button unattended.
 *
 * A minute tick that compares the wall clock in Kathmandu to the settings.
 * In-process rather than a worker: the renderer is Chromium and ffmpeg in
 * this container, so a queue elsewhere would only exist to call back into
 * here. The day already rendered and a render already running are both
 * reasons to do nothing, which is what makes a missed or doubled tick safe.
 */
export function startClock() {
  if (state.clock) return;
  state.clock = setInterval(() => {
    const s = readSettings();
    if (!s.daily.enabled) return;
    const now = nepalNow();
    if (now.hhmm !== s.daily.time) return;
    if (isRendered(now.date) || (state.job && !state.job.finishedAt)) return;
    startRender(now.date);
  }, 60_000);
  state.clock.unref();
}
