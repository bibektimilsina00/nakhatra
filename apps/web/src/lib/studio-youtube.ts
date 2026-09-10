import { readFileSync, statSync } from "node:fs";

import { SITE_URL } from "@/lib/seo/site";

/**
 * YouTube, for the studio.
 *
 * The one channel that can be wired without a new developer account: the
 * Google OAuth client that signs people in also carries the YouTube upload
 * scope once it is enabled in the Cloud console. Two things there before
 * this works — the YouTube Data API v3 switched on for the project, and
 * `redirectUri()` added to the client's authorised redirect URIs.
 *
 * Until Google has audited the project, uploads from it are locked private
 * regardless of what is asked for. That is YouTube's rule, not a bug here.
 *
 * Server-only.
 */

const SCOPES = [
  "https://www.googleapis.com/auth/youtube.upload",
  "https://www.googleapis.com/auth/youtube.readonly",
].join(" ");

const clientId = () => process.env.GOOGLE_CLIENT_ID || "";
const clientSecret = () => process.env.GOOGLE_CLIENT_SECRET || "";

export const redirectUri = () => `${SITE_URL}/api/studio/connect/youtube/callback`;

/**
 * The `state` the consent screen hands back. The callback arrives as a plain
 * browser navigation with no bearer token, so this is what proves the
 * connection was started by an admin on this page a moment ago.
 */
// On `globalThis`: the route that mints a state and the callback that
// checks it are bundled separately, and a module-level Map is one Map per
// bundle. See the same note in `studio.ts`.
const pending = ((globalThis as unknown as { __studioOAuth?: Map<string, number> }).__studioOAuth ??=
  new Map<string, number>());

export function newState(): string {
  const state = crypto.randomUUID();
  pending.set(state, Date.now());
  // Ten minutes is longer than any consent screen takes and shorter than
  // anything worth stealing.
  for (const [s, at] of pending) if (Date.now() - at > 10 * 60_000) pending.delete(s);
  return state;
}

export function takeState(state: string): boolean {
  const ok = pending.has(state);
  pending.delete(state);
  return ok;
}

export function authUrl(state: string): string {
  const q = new URLSearchParams({
    client_id: clientId(),
    redirect_uri: redirectUri(),
    response_type: "code",
    scope: SCOPES,
    // Both are what earn a refresh token rather than a one-hour pass.
    access_type: "offline",
    prompt: "consent",
    include_granted_scopes: "true",
    state,
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${q}`;
}

async function tokenRequest(body: Record<string, string>): Promise<Record<string, string>> {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId(),
      client_secret: clientSecret(),
      ...body,
    }),
  });
  const json = (await res.json()) as Record<string, string>;
  if (!res.ok) throw new Error(json.error_description || json.error || `token ${res.status}`);
  return json;
}

/** Turn the consent code into the standing permission, and learn whose
 *  channel it is so the page can say so. */
export async function exchangeCode(code: string): Promise<{ refreshToken: string; channel: string }> {
  const tok = await tokenRequest({ code, grant_type: "authorization_code", redirect_uri: redirectUri() });
  if (!tok.refresh_token) {
    throw new Error("Google returned no refresh token — revoke the app at myaccount.google.com/permissions and connect again.");
  }
  const channel = await channelName(tok.access_token);
  return { refreshToken: tok.refresh_token, channel };
}

async function accessToken(refreshToken: string): Promise<string> {
  const tok = await tokenRequest({ refresh_token: refreshToken, grant_type: "refresh_token" });
  return tok.access_token;
}

async function channelName(access: string): Promise<string> {
  const res = await fetch("https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true", {
    headers: { Authorization: `Bearer ${access}` },
  });
  if (!res.ok) return "YouTube";
  const json = (await res.json()) as { items?: { snippet?: { title?: string } }[] };
  return json.items?.[0]?.snippet?.title || "YouTube";
}

/**
 * One film, as a resumable upload: metadata first, then the bytes to the
 * session URL Google hands back. Returns the video id.
 */
export async function youtubeUpload(opts: {
  refreshToken: string;
  file: string;
  title: string;
  description: string;
  privacy: "private" | "unlisted" | "public";
  publishAt?: string;
}): Promise<string> {
  const access = await accessToken(opts.refreshToken);
  const size = statSync(opts.file).size;

  const start = await fetch(
    "https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${access}`,
        "Content-Type": "application/json; charset=UTF-8",
        "X-Upload-Content-Type": "video/mp4",
        "X-Upload-Content-Length": String(size),
      },
      body: JSON.stringify({
        snippet: {
          title: opts.title,
          description: opts.description,
          // "People & Blogs" — the closest of YouTube's fixed list.
          categoryId: "22",
          defaultLanguage: "ne",
        },
        status: {
          privacyStatus: opts.privacy,
          ...(opts.publishAt ? { publishAt: opts.publishAt } : {}),
          selfDeclaredMadeForKids: false,
        },
      }),
    },
  );
  if (!start.ok) throw new Error(`youtube upload start ${start.status}: ${(await start.text()).slice(0, 300)}`);
  const session = start.headers.get("location");
  if (!session) throw new Error("youtube upload start returned no session URL");

  const put = await fetch(session, {
    method: "PUT",
    headers: { "Content-Type": "video/mp4", "Content-Length": String(size) },
    body: new Uint8Array(readFileSync(opts.file)),
  });
  if (!put.ok) throw new Error(`youtube upload ${put.status}: ${(await put.text()).slice(0, 300)}`);
  const json = (await put.json()) as { id?: string };
  if (!json.id) throw new Error("youtube upload returned no video id");
  return json.id;
}
