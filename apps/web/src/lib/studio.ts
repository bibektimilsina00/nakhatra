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
import { keyFor, r2Configured, r2Get, r2List, r2Put } from "@/lib/studio-r2";
import { tiktokConfigured, tiktokPost, tiktokRefresh } from "@/lib/studio-tiktok";
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
  /** `privacy` is one of the levels the account itself offers; an unaudited
   *  client is offered SELF_ONLY and nothing else. */
  tiktok: { enabled: boolean; privacy: string };
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
  tiktok: { enabled: false, privacy: "SELF_ONLY" },
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
    tiktok: { ...DEFAULT_SETTINGS.tiktok, ...s.tiktok },
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
    tiktok: {
      enabled: patch.tiktok?.enabled ?? cur.tiktok.enabled,
      privacy: /^[A-Z_]{4,32}$/.test(patch.tiktok?.privacy ?? "")
        ? patch.tiktok!.privacy
        : cur.tiktok.privacy,
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
  tiktok?: {
    refreshToken: string;
    channel: string;
    connectedAt: string;
    /** What the account offered when it was connected: which privacy levels
     *  exist for it, and how long a video it will take. */
    privacyOptions: string[];
    maxDurationSec: number;
  };
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
    tiktok: {
      configured: tiktokConfigured(),
      connected: Boolean(c.tiktok),
      channel: c.tiktok?.channel ?? null,
      connectedAt: c.tiktok?.connectedAt ?? null,
      privacyOptions: c.tiktok?.privacyOptions ?? ["SELF_ONLY"],
      maxDurationSec: c.tiktok?.maxDurationSec ?? 0,
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
    // The films are the point; the upload is what they are for. The bucket
    // comes first so that what is published and what is archived are the
    // same two files.
    if (code === 0) {
      void archive(date)
        .then(() => publishDay(date))
        .catch(() => undefined);
    }
  });
  child.on("error", (err) => {
    state.job = { ...state.job!, finishedAt: Date.now(), error: err.message };
  });

  return { started: true };
}

export type StudioFile = { name: string; size: number };

const KEEP = (name: string) => name.endsWith(".mp4") || name.endsWith("-caption.txt");

/** What is on the volume for a day. */
function localFiles(date: string): StudioFile[] {
  const dir = dirFor(date);
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter(KEEP)
    .map((name) => ({ name, size: statSync(join(dir, name)).size }));
}

/**
 * A day's films and captions, whether they are still on this box or only in
 * the bucket. The volume is a cache — a container replaced overnight has an
 * empty one — so the bucket is asked as well and the two are merged.
 */
export async function filesFor(date: string): Promise<StudioFile[]> {
  const seen = new Map(localFiles(date).map((f) => [f.name, f]));
  if (r2Configured()) {
    try {
      for (const o of await r2List(`rasifal-${date}/`)) {
        const name = o.key.slice(`rasifal-${date}/`.length);
        if (KEEP(name) && !seen.has(name)) seen.set(name, { name, size: o.size });
      }
    } catch (err) {
      logger("r2 list failed", err);
    }
  }
  return [...seen.values()].sort((a, b) => a.name.localeCompare(b.name));
}

/** Both films exist. */
export async function isRendered(date: string): Promise<boolean> {
  return (await filesFor(date)).filter((f) => f.name.endsWith(".mp4")).length === 2;
}

/** One file's bytes, from the volume if it is still there and the bucket if
 *  it is not. What the file route serves and what an upload sends. */
export async function readStudioFile(date: string, name: string): Promise<Buffer | null> {
  const path = join(dirFor(date), name);
  if (existsSync(path)) return readFileSync(path);
  if (!r2Configured()) return null;
  return r2Get(keyFor(date, name));
}

/** Every day that has anything, newest first — on the volume or in the
 *  bucket. */
export async function renderedDays(limit = 30): Promise<string[]> {
  const days = new Set<string>();
  if (existsSync(STUDIO_OUT)) {
    for (const n of readdirSync(STUDIO_OUT)) {
      if (/^rasifal-\d{4}-\d{2}-\d{2}$/.test(n)) days.add(n.slice("rasifal-".length));
    }
  }
  if (r2Configured()) {
    try {
      for (const o of await r2List("rasifal-")) {
        const day = o.key.match(/^rasifal-(\d{4}-\d{2}-\d{2})\//)?.[1];
        if (day) days.add(day);
      }
    } catch (err) {
      logger("r2 list failed", err);
    }
  }
  return [...days].sort().reverse().slice(0, limit);
}

/**
 * Put a finished day in the bucket.
 *
 * After the render, not during it: a part that failed halfway is not worth
 * keeping, and the renderer has no business knowing where the archive is.
 * A bucket that refuses is logged and shrugged off — the films are on the
 * volume either way, and the morning's post does not depend on this.
 */
async function archive(date: string): Promise<void> {
  if (!r2Configured()) return;
  for (const file of localFiles(date)) {
    try {
      await r2Put(
        keyFor(date, file.name),
        readFileSync(join(dirFor(date), file.name)),
        file.name.endsWith(".mp4") ? "video/mp4" : "text/plain; charset=utf-8",
      );
    } catch (err) {
      logger(`r2 put ${file.name} failed`, err);
    }
  }
}

const logger = (message: string, err: unknown) =>
  console.error(`studio: ${message}:`, err instanceof Error ? err.message : err);

// ─── Publishing ──────────────────────────────────────────────────────────────

export type Channel = "youtube" | "tiktok";

export type PartPublish =
  | { videoId: string; url?: string; note?: string; at: string }
  | { error: string; at: string };

type ChannelPublish = { part1?: PartPublish; part2?: PartPublish };

export interface PublishState {
  youtube?: ChannelPublish;
  tiktok?: ChannelPublish;
}

const publishPath = (date: string) => join(dirFor(date), "publish.json");
export const readPublish = (date: string): PublishState => readJson(publishPath(date), {});

/**
 * Forget a channel's failures for a day.
 *
 * Failures are kept rather than dropped, because the run that produces most
 * of them is the unattended one at dawn and nobody is watching it — but a
 * refusal that stands until the next attempt reads as a live error every
 * time the page is opened. So it is dismissable, and only ever a failure:
 * a record of something actually posted is not the reader's to delete.
 */
export function clearPublishErrors(date: string, channel?: Channel): PublishState {
  const pub = readPublish(date);
  for (const name of ["youtube", "tiktok"] as const) {
    if (channel && channel !== name) continue;
    const entry = pub[name];
    if (!entry) continue;
    for (const key of ["part1", "part2"] as const) {
      if (entry[key] && !("videoId" in entry[key]!)) delete entry[key];
    }
    if (!entry.part1 && !entry.part2) delete pub[name];
  }
  writeFileSync(publishPath(date), JSON.stringify(pub, null, 2));
  return pub;
}

export const isPublishing = () => state.publishing;

const isDone = (p?: PartPublish) => Boolean(p && "videoId" in p);
const failure = (err: unknown): PartPublish => ({
  error: err instanceof Error ? err.message : String(err),
  at: new Date().toISOString(),
});

export interface PublishRequest {
  /** Just this channel, whether or not it is switched on — asking for it by
   *  name is the instruction the toggle would otherwise be giving. */
  channel?: Channel;
  /** Just this part. */
  part?: "1" | "2";
  /** Post it again even though it has already been posted. Only an explicit
   *  button reaches this; the clock never does. */
  force?: boolean;
}

/**
 * Hand a rendered day to every channel that is connected and switched on,
 * or to the one that was asked for.
 *
 * Idempotent per part per channel: anything that already has an id is left
 * alone unless `force`, so pressing Publish after a half-failed run retries
 * only the half that failed. A channel that throws is recorded and the next
 * one still runs — one platform being down is not a reason to skip the other.
 */
export async function publishDay(date: string, req: PublishRequest = {}): Promise<PublishState> {
  if (state.publishing) throw new Error(`already publishing ${state.publishing}`);
  state.publishing = date;
  try {
    const settings = readSettings();
    const conns = readConnections();
    const pub = readPublish(date);
    const save = () => writeFileSync(publishPath(date), JSON.stringify(pub, null, 2));

    const wanted = (channel: Channel, done: boolean) => {
      if (req.channel && req.channel !== channel) return false;
      if (!conns[channel]) return false;
      // Named explicitly, the toggle is not the question — the press is.
      if (!req.channel && !settings[channel].enabled) return false;
      return !done || Boolean(req.force);
    };

    const parts = req.part ? ([req.part] as const) : (["1", "2"] as const);
    for (const part of parts) {
      const key = `part${part}` as const;
      const mp4 = join(dirFor(date), `rasifal-${date}-part${part}.mp4`);
      // The upload wants a path, so a day that only exists in the bucket is
      // brought back to the volume first.
      if (!existsSync(mp4)) {
        const bytes = await readStudioFile(date, `rasifal-${date}-part${part}.mp4`);
        if (!bytes) continue;
        mkdirSync(dirFor(date), { recursive: true });
        writeFileSync(mp4, bytes);
      }
      const captionBytes = await readStudioFile(date, `rasifal-${date}-part${part}-caption.txt`);
      const caption = captionBytes ? captionBytes.toString("utf8") : "";
      const title = (caption.split("\n")[0] || `Rasifal ${date} · part ${part}`).slice(0, 100);

      if (conns.youtube && wanted("youtube", isDone(pub.youtube?.[key]))) {
        pub.youtube ??= {};
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
          pub.youtube[key] = failure(err);
        }
        save();
      }

      if (conns.tiktok && wanted("tiktok", isDone(pub.tiktok?.[key]))) {
        pub.tiktok ??= {};
        try {
          // Their refresh tokens rotate: the one just used is now dead, and
          // a studio that kept it would post once and never again.
          const { accessToken, refreshToken } = await tiktokRefresh(conns.tiktok.refreshToken);
          if (refreshToken !== conns.tiktok.refreshToken) {
            conns.tiktok = { ...conns.tiktok, refreshToken };
            writeConnections(conns);
          }
          const posted = await tiktokPost({
            accessToken,
            file: mp4,
            caption,
            privacyLevel: settings.tiktok.privacy,
          });
          pub.tiktok[key] = {
            videoId: posted.publishId,
            note: `${posted.status.toLowerCase().replace(/_/g, " ")} · ${posted.privacyLevel}`,
            at: new Date().toISOString(),
          };
        } catch (err) {
          pub.tiktok[key] = failure(err);
        }
        save();
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
    if (state.job && !state.job.finishedAt) return;
    // The bucket may know about a day this container has never rendered.
    void isRendered(now.date).then((done) => {
      if (!done && !(state.job && !state.job.finishedAt)) startRender(now.date);
    });
  }, 60_000);
  state.clock.unref();
}
