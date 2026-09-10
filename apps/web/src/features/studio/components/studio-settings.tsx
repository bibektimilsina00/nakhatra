"use client";

import { useState } from "react";
import { Video } from "lucide-react";

import type { StudioConfig, StudioSettings } from "@/features/studio/api/studio-api";
import { useSaveSettings, useYoutubeConnect } from "@/features/studio/hooks/use-studio";

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

const field = "rounded-[8px] border border-brd bg-inset px-3 py-2 text-[13.5px] text-fg";
const label = "block text-[12px] font-medium text-mut";

export function StudioSettingsPanel({ config }: { config: StudioConfig }) {
  const [s, setS] = useState<StudioSettings>(config.settings);
  const save = useSaveSettings();
  const yt = useYoutubeConnect();
  const dirty = JSON.stringify(s) !== JSON.stringify(config.settings);
  const conn = config.connections.youtube;

  const patch = (p: Partial<StudioSettings>) => setS((cur) => ({ ...cur, ...p }));

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
          {/* YouTube — the one that works with keys already in the box. */}
          <div className="rounded-[8px] border border-brd bg-inset p-3.5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="flex items-center gap-2 text-[14px] font-semibold text-fg">
                <Video className="size-4 text-rose-400" />
                YouTube
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
                    onClick={() => yt.disconnect.mutate()}
                    className="rounded-[6px] border border-brd px-2.5 py-1 text-[12px] text-mut hover:border-brd2 hover:text-fg"
                  >
                    Disconnect
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={!conn.configured || yt.connect.isPending}
                    onClick={() => yt.connect.mutate()}
                    className="rounded-[6px] bg-acc px-3 py-1.5 text-[12px] font-semibold text-onacc disabled:opacity-50"
                  >
                    Connect YouTube
                  </button>
                )}
                <Toggle
                  checked={s.youtube.enabled}
                  onChange={(enabled) => patch({ youtube: { ...s.youtube, enabled } })}
                  label={s.youtube.enabled ? "On" : "Off"}
                />
              </span>
            </div>

            {!conn.configured && (
              <p className="mt-2 text-[12px] text-amber-300/90">
                GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET are not set on the web server.
              </p>
            )}
            <p className="mt-2 text-[12px] leading-[1.7] text-mut">
              Uses the Google sign-in client. In Google Cloud: enable <em>YouTube Data API v3</em> and add
              <code className="mx-1 rounded bg-black/30 px-1 py-0.5 text-[11px]">{config.youtubeRedirectUri}</code>
              to the client&apos;s authorised redirect URIs. Until Google audits the project, its uploads stay
              private whatever is chosen below.
            </p>

            <div className="mt-3 grid gap-3 sm:grid-cols-2">
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
          </div>

          {/* The three that need an app registered first. Shown, not
              pretended: a Connect button with nothing behind it is worse
              than the honest list of what it would take. */}
          {[
            {
              name: "TikTok",
              needs: "A TikTok for Developers app with the Content Posting API, audited — unaudited apps can only post privately.",
            },
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
              <p className="mt-1.5 text-[12px] leading-[1.7] text-mut">{p.needs} Once you have its id and secret, the connection is the same shape as YouTube&apos;s.</p>
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
        {yt.connect.error && <span className="text-[12.5px] text-rose-300">{yt.connect.error.message}</span>}
      </div>
    </form>
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
      <span className={`relative h-5 w-9 rounded-full transition-colors ${checked ? "bg-acc" : "bg-brd2"}`}>
        <span
          className={`absolute top-0.5 size-4 rounded-full bg-white transition-transform ${checked ? "translate-x-4" : "translate-x-0.5"}`}
        />
      </span>
      {label}
    </button>
  );
}
