import { spawn } from "node:child_process";
import { existsSync, mkdirSync, openSync, readdirSync, statSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

import { API_URL } from "@/lib/api/proxy";

/**
 * The video studio, server side.
 *
 * `scripts/rasifal-tiktok.mjs` already makes the day's two films from a
 * running site; this is the button that runs it on the box the site is
 * running on, so the morning post does not need a laptop with ffmpeg on it.
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

/** Today in Kathmandu, which is the day the rasifal is written for. */
export function todayInNepal(): string {
  return new Date(Date.now() + (5 * 60 + 45) * 60000).toISOString().slice(0, 10);
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

/** One render at a time. Two at once would fight over the CPU and finish
 *  slower than one after the other, and there is only ever one day to make. */
let job: { date: string; startedAt: number; finishedAt?: number; error?: string } | null = null;

export const currentJob = () => job;

export function startRender(date: string): { started: boolean; reason?: string } {
  if (job && !job.finishedAt) return { started: false, reason: `already rendering ${job.date}` };
  if (!STUDIO_KEY) return { started: false, reason: "STUDIO_KEY is not set on the server" };

  const dir = dirFor(date);
  mkdirSync(dir, { recursive: true });
  const log = openSync(join(dir, "render.log"), "w");

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
    ],
    { stdio: ["ignore", log, log], env: process.env },
  );

  job = { date, startedAt: Date.now() };
  child.on("exit", (code) => {
    job = {
      ...job!,
      finishedAt: Date.now(),
      error: code === 0 ? undefined : `render exited with code ${code}`,
    };
  });
  child.on("error", (err) => {
    job = { ...job!, finishedAt: Date.now(), error: err.message };
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
