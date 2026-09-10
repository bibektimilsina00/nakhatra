import { readFileSync, statSync } from "node:fs";

import { SITE_URL } from "@/lib/seo/site";
import { newState, takeState } from "@/lib/studio-oauth";

/**
 * TikTok, for the studio.
 *
 * Direct Post with `FILE_UPLOAD`: the site initialises a post, TikTok hands
 * back a one-off upload URL, the bytes go there, and the post appears on the
 * connected account. `PULL_FROM_URL` would need a verified domain and TikTok
 * fetching from us; pushing the file needs neither.
 *
 * Two rules of theirs that shape this code:
 *
 *  - An unaudited client may only post `SELF_ONLY`. Sending anything else is
 *    rejected outright, so `privacyLevel` is checked against what the account
 *    actually offers and falls back rather than failing the morning's post.
 *  - Refresh tokens rotate. Every refresh returns a new one and invalidates
 *    the old, so the caller is handed it back to persist — a studio that
 *    kept the first one would work once and then stop.
 *
 * Server-only.
 */

const AUTH = "https://www.tiktok.com/v2/auth/authorize/";
const API = "https://open.tiktokapis.com/v2";
const SCOPES = "user.info.basic,video.publish";

const clientKey = () => process.env.TIKTOK_CLIENT_KEY || "";
const clientSecret = () => process.env.TIKTOK_CLIENT_SECRET || "";

export const tiktokConfigured = () => Boolean(clientKey() && clientSecret());
export { newState, takeState };

export const tiktokRedirectUri = () => `${SITE_URL}/api/studio/connect/tiktok/callback`;

export function tiktokAuthUrl(state: string): string {
  const q = new URLSearchParams({
    client_key: clientKey(),
    scope: SCOPES,
    response_type: "code",
    redirect_uri: tiktokRedirectUri(),
    state,
  });
  return `${AUTH}?${q}`;
}

/**
 * TikTok's own words for what went wrong.
 *
 * Several of their refusals carry the same sentence — "Please review our
 * integration guidelines" — and differ only in the code beside it, so a
 * message without its code sends you to the docs to guess. The commonest
 * one is spelled out, because it is a setting on the account rather than
 * anything the studio can fix.
 */
function tiktokError(err: { code?: string; message?: string } | undefined, fallback: string): string {
  const code = err?.code && err.code !== "ok" ? err.code : "";
  if (code === "unaudited_client_can_only_post_to_private_accounts") {
    return "TikTok will not accept posts from an unaudited app unless the account itself is private. Set the account to private (Settings and privacy → Privacy → Private account) and try again, or post once the audit is through.";
  }
  const message = err?.message || fallback;
  return code ? `${code} · ${message}` : message;
}

async function token(body: Record<string, string>): Promise<Record<string, string>> {
  const res = await fetch(`${API}/oauth/token/`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ client_key: clientKey(), client_secret: clientSecret(), ...body }),
  });
  const json = (await res.json()) as Record<string, string>;
  if (!res.ok || json.error) {
    throw new Error(json.error_description || json.error || `tiktok token ${res.status}`);
  }
  return json;
}

/** What an account will let this client do — and what it is called, so the
 *  page can say which channel is connected. */
export interface CreatorInfo {
  nickname: string;
  privacyOptions: string[];
  maxDurationSec: number;
}

export async function tiktokCreatorInfo(accessToken: string): Promise<CreatorInfo> {
  const res = await fetch(`${API}/post/publish/creator_info/query/`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json; charset=UTF-8",
    },
  });
  const json = (await res.json()) as {
    data?: {
      creator_nickname?: string;
      privacy_level_options?: string[];
      max_video_post_duration_sec?: number;
    };
    error?: { code?: string; message?: string };
  };
  if (json.error && json.error.code !== "ok") {
    throw new Error(tiktokError(json.error, "tiktok creator_info failed"));
  }
  return {
    nickname: json.data?.creator_nickname || "TikTok",
    privacyOptions: json.data?.privacy_level_options || ["SELF_ONLY"],
    maxDurationSec: json.data?.max_video_post_duration_sec ?? 0,
  };
}

/** The consent code, turned into the standing permission. */
export async function tiktokExchangeCode(code: string): Promise<{
  refreshToken: string;
  info: CreatorInfo;
}> {
  const tok = await token({
    // TikTok percent-encodes the `*` it puts in the code; sent back as-is it
    // is rejected as invalid.
    code: decodeURIComponent(code),
    grant_type: "authorization_code",
    redirect_uri: tiktokRedirectUri(),
  });
  if (!tok.refresh_token) throw new Error("TikTok returned no refresh token.");
  return { refreshToken: tok.refresh_token, info: await tiktokCreatorInfo(tok.access_token) };
}

/** A fresh access token, and the rotated refresh token to store in its place. */
export async function tiktokRefresh(refreshToken: string): Promise<{
  accessToken: string;
  refreshToken: string;
}> {
  const tok = await token({ grant_type: "refresh_token", refresh_token: refreshToken });
  return { accessToken: tok.access_token, refreshToken: tok.refresh_token || refreshToken };
}

/**
 * One film, posted. Returns TikTok's publish id — a direct post has no URL
 * until it is public, and an unaudited client's posts never are.
 */
export async function tiktokPost(opts: {
  accessToken: string;
  file: string;
  caption: string;
  privacyLevel: string;
}): Promise<{ publishId: string; privacyLevel: string; status: string }> {
  const info = await tiktokCreatorInfo(opts.accessToken);
  // Their list, not ours: while the client is unaudited it holds SELF_ONLY
  // alone, and sending a public level is refused rather than downgraded.
  const privacyLevel = info.privacyOptions.includes(opts.privacyLevel)
    ? opts.privacyLevel
    : info.privacyOptions[0] || "SELF_ONLY";

  const size = statSync(opts.file).size;
  const init = await fetch(`${API}/post/publish/video/init/`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${opts.accessToken}`,
      "Content-Type": "application/json; charset=UTF-8",
    },
    body: JSON.stringify({
      post_info: {
        // TikTok reads the hashtags out of the title itself.
        title: opts.caption.slice(0, 2200),
        privacy_level: privacyLevel,
        disable_comment: false,
        disable_duet: false,
        disable_stitch: false,
      },
      source_info: {
        source: "FILE_UPLOAD",
        video_size: size,
        // One chunk: their minimum is 5 MB and their maximum 64 MB, and a
        // part of the day's rasifal is about eleven.
        chunk_size: size,
        total_chunk_count: 1,
      },
    }),
  });
  const initJson = (await init.json()) as {
    data?: { publish_id?: string; upload_url?: string };
    error?: { code?: string; message?: string };
  };
  if (!init.ok || (initJson.error && initJson.error.code !== "ok")) {
    throw new Error(tiktokError(initJson.error, `tiktok init ${init.status}`));
  }
  const { publish_id: publishId, upload_url: uploadUrl } = initJson.data ?? {};
  if (!publishId || !uploadUrl) throw new Error("tiktok init returned no upload URL");

  const put = await fetch(uploadUrl, {
    method: "PUT",
    headers: {
      "Content-Type": "video/mp4",
      "Content-Length": String(size),
      "Content-Range": `bytes 0-${size - 1}/${size}`,
    },
    body: new Uint8Array(readFileSync(opts.file)),
  });
  if (!put.ok) throw new Error(`tiktok upload ${put.status}: ${(await put.text()).slice(0, 200)}`);

  return { publishId, privacyLevel, status: await tiktokStatus(opts.accessToken, publishId) };
}

/** Where the post got to. Uploading is instant; TikTok's own processing is
 *  not, so this is what it says a moment later rather than the final word. */
export async function tiktokStatus(accessToken: string, publishId: string): Promise<string> {
  try {
    const res = await fetch(`${API}/post/publish/status/fetch/`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json; charset=UTF-8",
      },
      body: JSON.stringify({ publish_id: publishId }),
    });
    const json = (await res.json()) as { data?: { status?: string } };
    return json.data?.status || "PROCESSING_UPLOAD";
  } catch {
    return "PROCESSING_UPLOAD";
  }
}
