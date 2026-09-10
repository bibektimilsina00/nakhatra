"use client";

import { useState } from "react";
import { Music2, Video } from "lucide-react";

import type { StudioConfig, StudioSettings } from "@/features/studio/api/studio-api";
import { useChannelConnect, useSaveSettings } from "@/features/studio/hooks/use-studio";

/**
 * What the studio does on its own, and where it sends the result.
 *
 * One form, saved as a whole: the settings are a single small object on the
 * server and the page is simpler for treating them as one.
 */

/** Gemini's prebuilt voices that read Nepali well. The four at the top were
 *  listened to; the rest are the same engine's other registers. */
const VOICES: { id: string; note: string }[] = [
  { id: "Aoede", note: "female · warm, even — the default" },
  { id: "Kore", note: "female · firm, presenter" },
  { id: "Leda", note: "female · young, light" },
  { id: "Charon", note: "male · low, formal" },
  { id: "Puck", note: "male · upbeat" },
  { id: "Fenrir", note: "male · excitable" },
  { id: "Orus", note: "male · firm" },
  { id: "Zephyr", note: "female · bright" },
  { id: "Callirrhoe", note: "female · easy-going" },
  { id: "Despina", note: "female · smooth" },
];

/** What TikTok's privacy levels are called in English. */
const TIKTOK_PRIVACY: Record<string, string> = {
  SELF_ONLY: "Private — only you",
  MUTUAL_FOLLOW_FRIENDS: "Friends (mutual follows)",
  FOLLOWER_OF_CREATOR: "Followers",
  PUBLIC_TO_EVERYONE: "Public",
};

const field = "rounded-[8px] border border-brd bg-inset px-3 py-2 text-[13.5px] text-fg";
const label = "block text-[12px] font-medium text-mut";

export function StudioSettingsPanel({ config }: { config: StudioConfig }) {
  const [s, setS] = useState<StudioSettings>(config.settings);
  const save = useSaveSettings();
  const dirty = JSON.stringify(s) !== JSON.stringify(config.settings);
  const patch = (p: Partial<StudioSettings>) => setS((cur) => ({ ...cur, ...p }));

  const yt = config.connections.youtube;
  const tt = config.connections.tiktok;

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        save.mutate(s);
      }}
      className="grid gap-4"
    >
      {/* ── Voice & caption ─────────────────────────────────────────── */}
      <section className="rounded-[10px] border border-brd bg-panel p-4">
        <h2 className="text-[15px] font-semibold text-fg">Voice &amp; caption</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <label>
            <span className={label}>Voice</span>
            <select value={s.voice} onChange={(e) => patch({ voice: e.target.value })} className={`mt-1 w-full ${field}`}>
              {VOICES.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.id} — {v.note}
                </option>
              ))}
            </select>
          </label>
          <div className="sm:col-span-2">
            <span className={label}>Hashtags — the caption&apos;s last line</span>
            <textarea
              value={s.hashtags}
              onChange={(e) => patch({ hashtags: e.target.value })}
              rows={2}
              className={`mt-1 w-full ${field}`}
            />
          </div>
        </div>
      </section>

      {/* ── Every day ───────────────────────────────────────────────── */}
      <section className="rounded-[10px] border border-brd bg-panel p-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-[15px] font-semibold text-fg">Every day, by itself</h2>
          <Toggle
            checked={s.daily.enabled}
            onChange={(enabled) => patch({ daily: { ...s.daily, enabled } })}
            label={s.daily.enabled ? "On" : "Off"}
          />
        </div>
        <p className="mt-1 text-[12.5px] leading-[1.7] text-mut">
          Renders both parts at this time (Kathmandu) without anyone pressing the button, then hands
          them to whichever channel below is on. The day&apos;s reading is written a little before 2:00, so
          keep this after that.
        </p>
        <label className="mt-3 inline-block">
          <span className={label}>Render at</span>
          <input
            type="time"
            value={s.daily.time}
            onChange={(e) => patch({ daily: { ...s.daily, time: e.target.value } })}
            className={`mt-1 ${field}`}
          />
        </label>
      </section>

      {/* ── Channels ────────────────────────────────────────────────── */}
      <section className="rounded-[10px] border border-brd bg-panel p-4">
        <h2 className="text-[15px] font-semibold text-fg">Channels</h2>
        <p className="mt-1 text-[12.5px] leading-[1.7] text-mut">
          Where a finished day goes. Uploads happen right after a render — by the clock above or by the
          button — and only to channels that are connected and switched on.
        </p>

        <div className="mt-3 grid gap-3">
          {/* TikTok */}
          <ChannelCard
            channel="tiktok"
            name="TikTok"
            icon={<Music2 className="size-4 text-fg" />}
            conn={tt}
            enabled={s.tiktok.enabled}
            onEnabled={(enabled) => patch({ tiktok: { ...s.tiktok, enabled } })}
            unconfigured="TIKTOK_CLIENT_KEY / TIKTOK_CLIENT_SECRET are not set on the web server."
            note={
              <>
                Posts straight to the profile with Direct Post. While the app is unaudited TikTok allows
                only <em>private</em> posts, whatever is chosen here — the option list below is the
                account&apos;s own, read when it was connected.
                {tt.connected && tt.maxDurationSec > 0 && tt.maxDurationSec < 160 && (
                  <span className="mt-1 block text-amber-300/90">
                    This account accepts videos up to {tt.maxDurationSec}s, and a part runs about 150s.
                    Longer posts will be refused.
                  </span>
                )}
              </>
            }
            redirectUri={config.tiktokRedirectUri}
          >
            <label className="block max-w-xs">
              <span className={label}>Visibility</span>
              <select
                value={s.tiktok.privacy}
                onChange={(e) => patch({ tiktok: { ...s.tiktok, privacy: e.target.value } })}
                className={`mt-1 w-full ${field}`}
              >
                {(tt.privacyOptions.length ? tt.privacyOptions : ["SELF_ONLY"]).map((o) => (
                  <option key={o} value={o}>
                    {TIKTOK_PRIVACY[o] ?? o}
                  </option>
                ))}
              </select>
            </label>
          </ChannelCard>

          {/* YouTube */}
          <ChannelCard
            channel="youtube"
            name="YouTube"
            icon={<Video className="size-4 text-rose-400" />}
            conn={yt}
            enabled={s.youtube.enabled}
            onEnabled={(enabled) => patch({ youtube: { ...s.youtube, enabled } })}
            unconfigured="GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET are not set on the web server."
            note={
              <>
                Uses the Google sign-in client. In Google Cloud: enable <em>YouTube Data API v3</em> and add
                the URI below to the client&apos;s authorised redirect URIs. Until Google audits the project,
                its uploads stay private whatever is chosen here.
              </>
            }
            redirectUri={config.youtubeRedirectUri}
          >
            <div className="grid gap-3 sm:grid-cols-2">
              <label>
                <span className={label}>Visibility</span>
                <select
                  value={s.youtube.privacy}
                  onChange={(e) => patch({ youtube: { ...s.youtube, privacy: e.target.value as StudioSettings["youtube"]["privacy"] } })}
                  className={`mt-1 w-full ${field}`}
                >
                  <option value="private">Private, goes public at the time below</option>
                  <option value="unlisted">Unlisted</option>
                  <option value="public">Public immediately</option>
                </select>
              </label>
              <label>
                <span className={label}>Goes public at (Kathmandu)</span>
                <input
                  type="time"
                  value={s.youtube.publishTime}
                  disabled={s.youtube.privacy !== "private"}
                  onChange={(e) => patch({ youtube: { ...s.youtube, publishTime: e.target.value } })}
                  className={`mt-1 w-full ${field} disabled:opacity-50`}
                />
              </label>
            </div>
          </ChannelCard>

          {/* The two that need an app registered first. Shown, not
              pretended: a Connect button with nothing behind it is worse
              than the honest list of what it would take. */}
          {[
            {
              name: "Instagram",
              needs: "A Meta app with instagram_content_publish, reviewed, and the account switched to Business or Creator.",
            },
            {
              name: "Facebook",
              needs: "The same Meta app with pages_manage_posts, reviewed, and a Page to post to.",
            },
          ].map((p) => (
            <div key={p.name} className="rounded-[8px] border border-dashed border-brd p-3.5">
              <div className="flex items-center justify-between gap-3">
                <span className="text-[14px] font-semibold text-fg">{p.name}</span>
                <span className="rounded-full border border-brd px-2 py-0.5 text-[10.5px] text-mut">needs an app</span>
              </div>
              <p className="mt-1.5 text-[12px] leading-[1.7] text-mut">
                {p.needs} Once you have its id and secret, the connection is the same shape as TikTok&apos;s.
              </p>
            </div>
          ))}
        </div>
      </section>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={!dirty || save.isPending}
          className="rounded-[8px] bg-acc px-4 py-2 text-[14px] font-semibold text-onacc disabled:cursor-not-allowed disabled:opacity-50"
        >
          {save.isPending ? "Saving…" : "Save settings"}
        </button>
        {save.isSuccess && !dirty && <span className="text-[12.5px] text-emerald-300">Saved.</span>}
        {save.error && <span className="text-[12.5px] text-rose-300">{save.error.message}</span>}
      </div>
    </form>
  );
}

/** One connectable channel: the same head, switch and consent dance for each. */
function ChannelCard({
  channel,
  name,
  icon,
  conn,
  enabled,
  onEnabled,
  unconfigured,
  note,
  redirectUri,
  children,
}: {
  channel: string;
  name: string;
  icon: React.ReactNode;
  conn: { configured: boolean; connected: boolean; channel: string | null };
  enabled: boolean;
  onEnabled: (v: boolean) => void;
  unconfigured: string;
  note: React.ReactNode;
  redirectUri: string;
  children: React.ReactNode;
}) {
  const { connect, disconnect } = useChannelConnect(channel);

  return (
    <div className="rounded-[8px] border border-brd bg-inset p-3.5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="flex items-center gap-2 text-[14px] font-semibold text-fg">
          {icon}
          {name}
          {conn.connected && (
            <span className="rounded-full border border-emerald-400/40 bg-emerald-500/10 px-2 py-0.5 text-[10.5px] text-emerald-300">
              {conn.channel}
            </span>
          )}
        </span>
        <span className="flex items-center gap-2">
          {conn.connected ? (
            <button
              type="button"
              onClick={() => disconnect.mutate()}
              className="rounded-[6px] border border-brd px-2.5 py-1 text-[12px] text-mut hover:border-brd2 hover:text-fg"
            >
              Disconnect
            </button>
          ) : (
            <button
              type="button"
              disabled={!conn.configured || connect.isPending}
              onClick={() => connect.mutate()}
              className="rounded-[6px] bg-acc px-3 py-1.5 text-[12px] font-semibold text-onacc disabled:opacity-50"
            >
              Connect {name}
            </button>
          )}
          <Toggle checked={enabled} onChange={onEnabled} label={enabled ? "On" : "Off"} />
        </span>
      </div>

      {!conn.configured && <p className="mt-2 text-[12px] text-amber-300/90">{unconfigured}</p>}
      {connect.error && <p className="mt-2 text-[12px] text-rose-300">{connect.error.message}</p>}

      <p className="mt-2 text-[12px] leading-[1.7] text-mut">{note}</p>
      <p className="mt-1.5 text-[11.5px] text-mut">
        Redirect URI:{" "}
        <code className="rounded bg-black/30 px-1 py-0.5 text-[11px] break-all">{redirectUri}</code>
      </p>

      <div className="mt-3">{children}</div>
    </div>
  );
}

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="flex items-center gap-2 text-[12px] text-mut"
    >
      {/* inline-block, not a bare span: a span is inline and ignores its
          height and width, so the track sized itself from the line box and
          the knob sat wherever the text put it. */}
      <span
        className={`relative inline-block h-5 w-9 shrink-0 rounded-full transition-colors ${checked ? "bg-acc" : "bg-brd2"}`}
      >
        <span
          className={`absolute top-0.5 left-0.5 size-4 rounded-full bg-white shadow-sm transition-transform ${checked ? "translate-x-4" : ""}`}
        />
      </span>
      {label}
    </button>
  );
}
