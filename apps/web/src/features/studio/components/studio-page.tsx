"use client";

import { useEffect, useState } from "react";
import { Check, ExternalLink, TriangleAlert } from "lucide-react";

import { AdminOnly } from "@/features/admin/components/admin-only";
import { AppShell } from "@/features/dashboard/components/app-shell";
import type { PartPublish, StudioStatus } from "@/features/studio/api/studio-api";
import { StudioPreview } from "@/features/studio/components/studio-preview";
import { StudioSettingsPanel } from "@/features/studio/components/studio-settings";
import {
  usePublishDay,
  useStartRender,
  useStudioCaption,
  useStudioConfig,
  useStudioFile,
  useStudioStatus,
} from "@/features/studio/hooks/use-studio";
import { useLatinTracking } from "@/lib/i18n/language-context";

/**
 * The morning's two TikToks, made from the chair.
 *
 * Press the button; the server shoots the twelve slides, has the Nepali voice
 * read them and cuts the films. Nothing here renders video — it starts the
 * job, watches the log, hands back the files, and shows where they went.
 */

/** Today in Kathmandu, which is the day the rasifal is written for. */
const todayInNepal = () =>
  new Date(Date.now() + (5 * 60 + 45) * 60000).toISOString().slice(0, 10);

const card = "rounded-[10px] border border-brd bg-panel p-4";

/** Where a part went on one channel. Reporting only — publishing is a
 *  channel's own business, and its button lives on its card. */
function PublishLine({ label, state }: { label: string; state?: PartPublish }) {
  if (!state) return null;
  if (!("videoId" in state)) {
    return (
      <span className="flex items-start gap-1.5 text-[12.5px] text-rose-300">
        <TriangleAlert className="mt-0.5 size-3.5 shrink-0" /> {label} · {state.error}
      </span>
    );
  }
  // YouTube has a watchable URL; a TikTok direct post has only its publish
  // id until the account makes it public, so it says how it went instead.
  return state.url ? (
    <a
      href={state.url}
      target="_blank"
      rel="noreferrer"
      className="flex items-center gap-1.5 text-[12.5px] text-emerald-300 hover:underline"
    >
      <Check className="size-3.5" /> {label} · {state.url} <ExternalLink className="size-3" />
    </a>
  ) : (
    <span className="flex items-center gap-1.5 text-[12.5px] text-emerald-300">
      <Check className="size-3.5" /> {label} · {state.note ?? "posted"}
    </span>
  );
}

function Part({
  date,
  part,
  publish,
}: {
  date: string;
  part: "1" | "2";
  publish: { youtube?: PartPublish; tiktok?: PartPublish };
}) {
  const video = `rasifal-${date}-part${part}.mp4`;
  const caption = `rasifal-${date}-part${part}-caption.txt`;
  const { data: url } = useStudioFile(date, video, true);
  const { data: text } = useStudioCaption(date, caption, true);
  const [copied, setCopied] = useState(false);

  return (
    <section className={card}>
      <h3 className="mb-3 text-[15px] font-semibold text-fg">
        भाग {part === "1" ? "१" : "२"} · {part === "1" ? "मेष–कन्या" : "तुला–मीन"}
      </h3>

      {url ? (
        <video src={url} controls className="w-full max-w-[260px] rounded-[8px] border border-brd" />
      ) : (
        <p className="text-[13px] text-mut">Loading…</p>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-2">
        {url && (
          <a href={url} download={video} className="rounded-[8px] border border-brd px-3 py-1.5 text-[13px] font-medium text-fg hover:border-acc">
            Download mp4
          </a>
        )}
        {text && (
          <button
            type="button"
            onClick={() => {
              void navigator.clipboard.writeText(text);
              setCopied(true);
              setTimeout(() => setCopied(false), 1500);
            }}
            className="cursor-pointer rounded-[8px] border border-brd px-3 py-1.5 text-[13px] font-medium text-fg hover:border-acc"
          >
            {copied ? "Copied" : "Copy caption"}
          </button>
        )}
      </div>

      <div className="mt-2.5 grid gap-1">
        <PublishLine label="TikTok" state={publish.tiktok} />
        <PublishLine label="YouTube" state={publish.youtube} />
      </div>

      {text && (
        <pre className="mt-3 max-h-52 overflow-auto rounded-[8px] bg-inset p-3 text-[12.5px] leading-[1.7] whitespace-pre-wrap text-mid">
          {text}
        </pre>
      )}
    </section>
  );
}

function elapsed(status?: StudioStatus): string {
  if (!status?.running || !status.startedAt) return "";
  const s = Math.round((Date.now() - status.startedAt) / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

export function StudioPage() {
  const eyebrow = useLatinTracking("uppercase tracking-[0.2em]");
  const [date, setDate] = useState(todayInNepal());
  const status = useStudioStatus(date);
  const config = useStudioConfig();
  const start = useStartRender(date);
  const publish = usePublishDay(date);

  // The YouTube callback lands back here with a word in the query string.
  // Read once, on mount — this only ever renders after hydration, behind the
  // admin gate, so the window is there to read.
  const [notice] = useState<{ ok: boolean; text: string } | null>(() => {
    if (typeof window === "undefined") return null;
    const q = new URLSearchParams(window.location.search);
    if (q.get("connected")) return { ok: true, text: `YouTube connected: ${q.get("connected")}` };
    if (q.get("error")) return { ok: false, text: q.get("error")! };
    return null;
  });
  useEffect(() => {
    if (notice) window.history.replaceState(null, "", "/admin/studio");
  }, [notice]);

  const running = status.data?.running ?? false;
  const done = (status.data?.files ?? []).filter((f) => f.name.endsWith(".mp4")).length === 2;
  const live = [
    config.data?.settings.tiktok.enabled && config.data?.connections.tiktok.connected ? "TikTok" : null,
    config.data?.settings.youtube.enabled && config.data?.connections.youtube.connected ? "YouTube" : null,
  ].filter(Boolean) as string[];
  const s = config.data?.settings;

  return (
    <AppShell>
      <AdminOnly>
        <main className="mx-auto w-full max-w-[960px] px-5 pt-10 pb-24 sm:px-8">
          <span className={`text-[11px] text-acc ${eyebrow}`}>Admin</span>
          <h1 className="mt-3 text-[26px] font-bold leading-tight text-fg sm:text-[30px]">Rasifal studio</h1>
          <p className="mt-2 text-[14px] text-mut">
            बाह्र स्लाइड, नेपाली आवाज र दुई भागको भिडियो — एउटै थिचाइमा।
          </p>

          {notice && (
            <p
              className={`mt-4 rounded-[8px] border p-3 text-[13px] ${
                notice.ok
                  ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-300"
                  : "border-rose-400/30 bg-rose-500/10 text-rose-300"
              }`}
            >
              {notice.text}
            </p>
          )}

          {/* ── At a glance ────────────────────────────────────────── */}
          {s && (
            <div className="mt-5 grid gap-2 text-[12.5px] sm:grid-cols-3">
              <div className={`${card} !p-3`}>
                <span className="text-mut">Every day</span>
                <p className="mt-0.5 font-semibold text-fg">
                  {s.daily.enabled ? `On · renders at ${s.daily.time}` : "Off · by the button only"}
                </p>
              </div>
              <div className={`${card} !p-3`}>
                <span className="text-mut">Voice</span>
                <p className="mt-0.5 font-semibold text-fg">{s.voice}</p>
              </div>
              <div className={`${card} !p-3`}>
                <span className="text-mut">Posts to</span>
                <p className="mt-0.5 font-semibold text-fg">
                  {live.length ? live.join(" · ") : "Nowhere yet"}
                </p>
              </div>
            </div>
          )}

          {/* ── Render ─────────────────────────────────────────────── */}
          <section className={`mt-5 ${card}`}>
            <h2 className="text-[15px] font-semibold text-fg">Render</h2>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <input
                type="date"
                value={date}
                max={todayInNepal() > date ? undefined : date}
                onChange={(e) => setDate(e.target.value)}
                className="rounded-[8px] border border-brd bg-inset px-3 py-2 text-[14px] text-fg"
              />
              <button
                type="button"
                disabled={running || start.isPending}
                onClick={() => start.mutate()}
                className="cursor-pointer rounded-[8px] bg-acc px-4 py-2 text-[14px] font-semibold text-onacc disabled:cursor-not-allowed disabled:opacity-50"
              >
                {running ? `Rendering… ${elapsed(status.data)}` : done ? "Render again" : "Generate the day's video"}
              </button>
              {done && !running && (
                <button
                  type="button"
                  disabled={!live.length || publish.isPending || status.data?.publishing}
                  onClick={() => publish.mutate({})}
                  title={live.length ? `Upload to ${live.join(" and ")}` : "Connect a channel below and switch it on"}
                  className="cursor-pointer rounded-[8px] border border-brd px-4 py-2 text-[14px] font-medium text-fg hover:border-acc disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {publish.isPending || status.data?.publishing ? "Publishing…" : "Publish now"}
                </button>
              )}
              {running && <span className="text-[13px] text-mut">About six minutes.</span>}
            </div>

            {(start.error || publish.error || status.data?.error) && (
              <p className="mt-4 rounded-[8px] border border-rose-400/30 bg-rose-500/10 p-3 text-[13px] text-rose-300">
                {start.error?.message || publish.error?.message || status.data?.error}
              </p>
            )}

            {status.data?.log && (
              <pre className="mt-4 max-h-56 overflow-auto rounded-[8px] border border-brd bg-inset p-3 text-[12px] leading-[1.6] whitespace-pre-wrap text-mid">
                {status.data.log}
              </pre>
            )}
          </section>

          {/* ── Preview ────────────────────────────────────────────── */}
          <div className="mt-4">
            <StudioPreview date={date} />
          </div>

          {/* ── Output ─────────────────────────────────────────────── */}
          {done && (
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {(["1", "2"] as const).map((p) => (
                <Part
                  key={p}
                  date={date}
                  part={p}
                  publish={{
                    youtube: status.data?.publish.youtube?.[`part${p}`],
                    tiktok: status.data?.publish.tiktok?.[`part${p}`],
                  }}
                />
              ))}
            </div>
          )}

          {/* ── Settings & channels ────────────────────────────────── */}
          <div className="mt-8">
            {config.data ? (
              <StudioSettingsPanel
                key={JSON.stringify(config.data.settings)}
                config={config.data}
                date={date}
                publish={status.data?.publish ?? {}}
                rendered={done}
                busy={publish.isPending || Boolean(status.data?.publishing)}
                onPublish={(channel, force) => publish.mutate({ channel, force })}
              />
            ) : (
              <p className="text-[13px] text-mut">{config.error ? config.error.message : "Loading settings…"}</p>
            )}
          </div>

          {/* ── History ────────────────────────────────────────────── */}
          {(status.data?.days.length ?? 0) > 0 && (
            <section className={`mt-8 ${card}`}>
              <h2 className="text-[15px] font-semibold text-fg">Past days</h2>
              <div className="mt-3 flex flex-wrap gap-2">
                {status.data!.days.map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setDate(d)}
                    aria-pressed={d === date}
                    className={`rounded-[6px] border px-2.5 py-1 text-[12px] transition-colors ${
                      d === date ? "border-acc/50 bg-acc/[0.09] text-acc2" : "border-brd text-mut hover:border-brd2 hover:text-fg"
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </section>
          )}
        </main>
      </AdminOnly>
    </AppShell>
  );
}
