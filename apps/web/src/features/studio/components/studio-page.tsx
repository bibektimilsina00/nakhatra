"use client";

import { useState } from "react";

import { AdminOnly } from "@/features/admin/components/admin-only";
import { AppShell } from "@/features/dashboard/components/app-shell";
import {
  useStartRender,
  useStudioCaption,
  useStudioFile,
  useStudioStatus,
} from "@/features/studio/hooks/use-studio";

/**
 * The morning's two TikToks, made from the chair.
 *
 * Press the button; the server shoots the twelve slides, has the Nepali voice
 * read them and cuts the films. Nothing here renders video — it starts the
 * job, watches the log and hands back the files.
 */

/** Today in Kathmandu, which is the day the rasifal is written for. */
const todayInNepal = () =>
  new Date(Date.now() + (5 * 60 + 45) * 60000).toISOString().slice(0, 10);

function Part({ date, part }: { date: string; part: "1" | "2" }) {
  const video = `rasifal-${date}-part${part}.mp4`;
  const caption = `rasifal-${date}-part${part}-caption.txt`;
  const { data: url } = useStudioFile(date, video, true);
  const { data: text } = useStudioCaption(date, caption, true);
  const [copied, setCopied] = useState(false);

  return (
    <section className="rounded-[10px] border border-brd bg-panel p-4">
      <h2 className="mb-3 text-[15px] font-semibold text-fg">
        भाग {part === "1" ? "१" : "२"} · {part === "1" ? "मेष–कन्या" : "तुला–मीन"}
      </h2>

      {url ? (
        <video src={url} controls className="w-full max-w-[260px] rounded-[8px] border border-brd" />
      ) : (
        <p className="text-[13px] text-mut">अझै बनेको छैन।</p>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-2">
        {url && (
          <a
            href={url}
            download={video}
            className="rounded-[8px] border border-brd px-3 py-1.5 text-[13px] font-medium text-fg hover:border-acc"
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
            className="cursor-pointer rounded-[8px] border border-brd px-3 py-1.5 text-[13px] font-medium text-fg hover:border-acc"
          >
            {copied ? "Copied" : "Copy caption"}
          </button>
        )}
      </div>

      {text && (
        <pre className="mt-3 max-h-52 overflow-auto rounded-[8px] bg-inset p-3 text-[12.5px] leading-[1.7] whitespace-pre-wrap text-mid">
          {text}
        </pre>
      )}
    </section>
  );
}

export function StudioPage() {
  const [date, setDate] = useState(todayInNepal());
  const status = useStudioStatus(date);
  const start = useStartRender(date);

  const running = status.data?.running ?? false;
  const done = (status.data?.files.length ?? 0) > 0;

  return (
    <AppShell>
      <AdminOnly>
        <main className="mx-auto w-full max-w-3xl px-5 pt-10 pb-24">
          <h1 className="text-[22px] font-bold text-fg">Rasifal studio</h1>
          <p className="mt-1.5 text-[14px] text-mut">
            बाह्र स्लाइड, नेपाली आवाज र दुई भागको भिडियो — एउटै थिचाइमा।
          </p>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="rounded-[8px] border border-brd bg-inset px-3 py-2 text-[14px] text-fg"
            />
            <button
              type="button"
              disabled={running || start.isPending}
              onClick={() => start.mutate()}
              className="cursor-pointer rounded-[8px] bg-acc px-4 py-2 text-[14px] font-semibold text-onacc disabled:cursor-not-allowed disabled:opacity-50"
            >
              {running ? "Rendering…" : done ? "Render again" : "Generate today's video"}
            </button>
            {running && <span className="text-[13px] text-mut">~६ मिनेट लाग्छ।</span>}
          </div>

          {(start.error || status.data?.error) && (
            <p className="mt-4 rounded-[8px] border border-rose-400/30 bg-rose-500/10 p-3 text-[13px] text-rose-300">
              {start.error?.message || status.data?.error}
            </p>
          )}

          {status.data?.log && (
            <pre className="mt-4 max-h-56 overflow-auto rounded-[8px] border border-brd bg-inset p-3 text-[12px] leading-[1.6] whitespace-pre-wrap text-mid">
              {status.data.log}
            </pre>
          )}

          {done && (
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <Part date={date} part="1" />
              <Part date={date} part="2" />
            </div>
          )}
        </main>
      </AdminOnly>
    </AppShell>
  );
}
