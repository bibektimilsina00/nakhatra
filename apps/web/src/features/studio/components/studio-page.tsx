"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ExternalLink } from "lucide-react";

import { AdminOnly } from "@/features/admin/components/admin-only";
import { AppShell } from "@/features/dashboard/components/app-shell";
import { Button } from "@/components/ui/button";
import { inputClasses } from "@/components/ui/input";
import type {
  PartPublish,
  PublishState,
  StudioFile,
  StudioStatus,
} from "@/features/studio/api/studio-api";
import { StudioPreview } from "@/features/studio/components/studio-preview";
import { SnackHost, useSnack } from "@/features/studio/components/studio-snacks";
import { StudioSettingsPanel } from "@/features/studio/components/studio-settings";
import {
  useClearErrors,
  usePublishDay,
  useStartRender,
  useStudioCaption,
  useStudioConfig,
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

const card = "rounded-lg border border-line-strong bg-surface p-4";

/**
 * A link to where this part ended up.
 *
 * Only a link. How a publish went is an event and belongs in a snackbar; a
 * URL is a place, and a place is worth keeping next to the file it came
 * from. A TikTok direct post has no URL until the account makes it public,
 * so there is nothing here to keep for it.
 */
function PublishLine({ label, state }: { label: string; state?: PartPublish }) {
  if (!state || !("videoId" in state) || !state.url) return null;
  return (
    <a
      href={state.url}
      target="_blank"
      rel="noreferrer"
      className="flex items-center gap-1.5 text-xs text-success-ink hover:underline"
    >
      <Check className="size-3.5" /> {label} · {state.url} <ExternalLink className="size-3" />
    </a>
  );
}

function Part({
  date,
  part,
  file,
  poster,
  publish,
}: {
  date: string;
  part: "1" | "2";
  /** The rendered mp4, with the signed URL the player streams from. */
  file?: StudioFile;
  /** Its title card as a still, so the card shows the film immediately. */
  poster?: StudioFile;
  publish: { youtube?: PartPublish; tiktok?: PartPublish };
}) {
  const caption = `rasifal-${date}-part${part}-caption.txt`;
  const { data: text } = useStudioCaption(date, caption, true);
  const [copied, setCopied] = useState(false);
  const mb = file ? (file.size / 1e6).toFixed(1) : null;

  return (
    <section className={card}>
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="font-display text-base font-semibold text-ink">
          भाग {part === "1" ? "१" : "२"} · {part === "1" ? "मेष–कन्या" : "तुला–मीन"}
        </h3>
        {mb && <span className="text-xs text-muted">{mb} MB</span>}
      </div>

      {/* The films are 1080×1920, so the frame is too. Given the shape up
          front, the player has the right box before a byte arrives instead
          of a 300×150 default that snaps once metadata lands. */}
      <div className="mt-3 flex justify-center">
        {file ? (
          <video
            src={file.url}
            poster={poster?.url}
            controls
            // None, not metadata: the poster is already the first frame, so
            // there is nothing to fetch until someone presses play — and a
            // page with two 16 MB films on it should not fetch either.
            preload="none"
            playsInline
            className="aspect-[9/16] w-full max-w-[220px] rounded-lg border border-line-strong bg-black object-cover"
          />
        ) : (
          <div className="grid aspect-[9/16] w-full max-w-[220px] place-items-center rounded-lg border border-dashed border-line-strong text-xs text-muted">
            not rendered
          </div>
        )}
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
        {file && (
          <a
            href={file.url}
            download={file.name}
            className="min-h-11 inline-flex items-center rounded-md border border-line-strong bg-surface px-3 py-1.5 text-xs font-medium text-ink transition hover:border-accent hover:bg-cream"
          >
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
            className="min-h-11 inline-flex items-center cursor-pointer rounded-md border border-line-strong bg-surface px-3 py-1.5 text-xs font-medium text-ink transition hover:border-accent hover:bg-cream"
          >
            {copied ? "Copied" : "Copy caption"}
          </button>
        )}
      </div>

      <div className="mt-2.5 grid gap-1">
        <PublishLine label="TikTok" state={publish.tiktok} />
        <PublishLine label="YouTube" state={publish.youtube} />
      </div>

      {/* Folded away: it is the same text the caption button copies, and
          open it pushed everything else off the screen. */}
      {text && (
        <details className="mt-3 group">
          <summary className="cursor-pointer list-none text-xs text-muted hover:text-ink">
            Caption ▾
          </summary>
          <pre className="mt-2 max-h-52 overflow-auto rounded-lg border border-line bg-cream p-3 text-xs leading-relaxed whitespace-pre-wrap text-muted">
            {text}
          </pre>
        </details>
      )}
    </section>
  );
}

const CHANNEL_NAME = { tiktok: "TikTok", youtube: "YouTube" } as const;

/**
 * What refused, by channel — one line each, not one per part.
 *
 * A publish answers 200 with a per-channel record, so a refusal arrives as
 * data rather than as a thrown error; and both parts of a day fail for the
 * same reason, so two snackbars saying it would be one too many.
 */
function refusals(result?: PublishState): { channel: "tiktok" | "youtube"; text: string }[] {
  if (!result) return [];
  return (["tiktok", "youtube"] as const).flatMap((channel) => {
    const failed = (["part1", "part2"] as const)
      .map((key) => ({ key, state: result[channel]?.[key] }))
      .filter((f) => f.state && !("videoId" in f.state!));
    if (!failed.length) return [];
    const reason = (failed[0].state as { error: string }).error;
    const parts = failed.length === 2 ? "both parts" : `भाग ${failed[0].key === "part1" ? "१" : "२"}`;
    return [{ channel, text: `${CHANNEL_NAME[channel]} · ${parts}: ${reason}` }];
  });
}

function elapsed(status?: StudioStatus): string {
  if (!status?.running || !status.startedAt) return "";
  const s = Math.round((Date.now() - status.startedAt) / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

export function StudioPage() {
  return (
    <SnackHost>
      <Studio />
    </SnackHost>
  );
}

function Studio() {
  const eyebrow = useLatinTracking("uppercase tracking-[0.2em]");
  const [date, setDate] = useState(todayInNepal());
  const status = useStudioStatus(date);
  const config = useStudioConfig();
  const start = useStartRender(date);
  const publish = usePublishDay(date);
  const clearErrors = useClearErrors(date);
  const snack = useSnack();

  /** A publish answers 200 with a per-channel record, so a refusal arrives
   *  as data rather than as a thrown error. Both end up in a snackbar. */
  const runPublish = (req: Parameters<typeof publish.mutate>[0]) =>
    publish.mutate(req, {
      onSuccess: ({ publish: result }) => {
        const failed = refusals(result);
        if (!failed.length) {
          const done = (["tiktok", "youtube"] as const)
            .map((channel) => {
              const parts = (["part1", "part2"] as const).filter((key) => {
                const state = result[channel]?.[key];
                return state && "videoId" in state;
              });
              if (!parts.length) return null;
              const first = result[channel]?.[parts[0]];
              const how = first && "videoId" in first ? (first.note ?? "posted") : "posted";
              return `${CHANNEL_NAME[channel]} · ${parts.length === 2 ? "both parts" : "one part"} · ${how}`;
            })
            .filter(Boolean);
          snack({ tone: "ok", text: done.length ? done.join("  ·  ") : "Nothing to publish." });
          return;
        }
        for (const f of failed) {
          snack({
            tone: "error",
            text: f.text,
            action: { label: "Dismiss", run: () => clearErrors.mutate(f.channel) },
          });
        }
      },
      onError: (err) => snack({ tone: "error", text: err.message }),
    });

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

  // Failures stored by an unattended run are still news the first time the
  // page is opened — and only the first time.
  const told = useRef("");
  useEffect(() => {
    if (status.data?.date !== date) return;
    const failed = refusals(status.data?.publish);
    const seen = `${date}:${failed.map((f) => f.channel).join(",")}`;
    if (!failed.length || told.current === seen) return;
    told.current = seen;
    for (const f of failed) {
      snack({
        tone: "error",
        text: `last try — ${f.text}`,
        action: { label: "Dismiss", run: () => clearErrors.mutate(f.channel) },
      });
    }
  }, [status.data, date, snack, clearErrors]);

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
          <span className={`text-xs font-semibold text-accent-ink ${eyebrow}`}>Admin</span>
          <h1 className="mt-3 font-display text-2xl font-bold leading-tight text-ink sm:text-3xl">Rasifal studio</h1>
          <p className="mt-2 text-sm text-muted">
            बाह्र स्लाइड, नेपाली आवाज र दुई भागको भिडियो — एउटै थिचाइमा।
          </p>

          {notice && (
            <p
              className={`mt-4 rounded-md border p-3 text-xs ${
                notice.ok
                  ? "border-success/30 bg-success-tint text-success-ink"
                  : "border-danger/30 bg-danger-tint text-danger-ink"
              }`}
            >
              {notice.text}
            </p>
          )}

          {/* ── At a glance ────────────────────────────────────────── */}
          {s && (
            <div className="mt-5 grid gap-2 text-xs sm:grid-cols-3">
              <div className={`${card} !p-3`}>
                <span className="text-muted">Every day</span>
                <p className="mt-0.5 font-semibold text-ink">
                  {s.daily.enabled ? `On · renders at ${s.daily.time}` : "Off · by the button only"}
                </p>
              </div>
              <div className={`${card} !p-3`}>
                <span className="text-muted">Voice</span>
                <p className="mt-0.5 font-semibold text-ink">{s.voice}</p>
              </div>
              <div className={`${card} !p-3`}>
                <span className="text-muted">Posts to</span>
                <p className="mt-0.5 font-semibold text-ink">
                  {live.length ? live.join(" · ") : "Nowhere yet"}
                </p>
              </div>
            </div>
          )}

          {/* ── Render ─────────────────────────────────────────────── */}
          <section className={`mt-5 ${card}`}>
            <h2 className="font-display text-base font-semibold text-ink">Render</h2>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <input
                type="date"
                value={date}
                max={todayInNepal() > date ? undefined : date}
                onChange={(e) => setDate(e.target.value)}
                className={inputClasses({ className: "!w-auto" })}
              />
              <Button
                type="button"
                disabled={running || start.isPending}
                onClick={() =>
                  start.mutate(undefined, {
                    onError: (err) => snack({ tone: "error", text: err.message }),
                  })
                }
              >
                {running ? `Rendering… ${elapsed(status.data)}` : done ? "Render again" : "Generate the day's video"}
              </Button>
              {done && !running && (
                <Button
                  type="button"
                  variant="secondary"
                  disabled={!live.length || publish.isPending || status.data?.publishing}
                  onClick={() => runPublish({})}
                  title={live.length ? `Upload to ${live.join(" and ")}` : "Connect a channel below and switch it on"}
                >
                  {publish.isPending || status.data?.publishing ? "Publishing…" : "Publish now"}
                </Button>
              )}
              {running && <span className="text-xs text-muted">About six minutes.</span>}
            </div>

            {status.data?.log && (
              <pre className="mt-4 max-h-56 overflow-auto rounded-md border border-line-strong bg-cream p-3 text-xs leading-relaxed whitespace-pre-wrap text-muted">
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
                  file={status.data?.files.find((f) => f.name === `rasifal-${date}-part${p}.mp4`)}
                  poster={status.data?.files.find((f) => f.name === `rasifal-${date}-part${p}.jpg`)}
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
                onPublish={(channel, force) => runPublish({ channel, force })}
              />
            ) : (
              <p className="text-xs text-muted">{config.error ? config.error.message : "Loading settings…"}</p>
            )}
          </div>

          {/* ── History ────────────────────────────────────────────── */}
          {(status.data?.days.length ?? 0) > 0 && (
            <section className={`mt-8 ${card}`}>
              <h2 className="font-display text-base font-semibold text-ink">Past days</h2>
              <div className="mt-3 flex flex-wrap gap-2">
                {status.data!.days.map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setDate(d)}
                    aria-pressed={d === date}
                    className={`min-h-11 cursor-pointer rounded-md border px-3 py-1.5 text-xs font-medium transition-colors ${
                      d === date
                        ? "border-accent bg-accent-wash text-accent-ink"
                        : "border-line-strong text-muted hover:border-accent hover:text-ink hover:bg-surface"
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
