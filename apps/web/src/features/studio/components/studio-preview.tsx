"use client";

import { useState } from "react";

import { useStudioSlide } from "@/features/studio/hooks/use-studio";

/**
 * The seven frames of a part, as the camera will see them.
 *
 * Each is the real slide page in a srcdoc iframe, scaled down — not a
 * screenshot, so a change to the voice's hashtags or the day's reading shows
 * here before anything is rendered. Same origin, so the page's own CSS and
 * fonts load; the key that guards it stays on the server.
 */
const W = 540;
const H = 960;

function Slide({ date, part, i, scale }: { date: string; part: "1" | "2"; i: number; scale: number }) {
  const { data, isError } = useStudioSlide(date, part, i, true);
  return (
    <div
      className="relative shrink-0 overflow-hidden rounded-lg border border-line-strong bg-black"
      style={{ width: W * scale, height: H * scale }}
    >
      {data ? (
        <iframe
          title={`slide ${i}`}
          srcDoc={data}
          sandbox="allow-same-origin"
          scrolling="no"
          className="pointer-events-none absolute top-0 left-0 origin-top-left border-0"
          style={{ width: W, height: H, transform: `scale(${scale})` }}
        />
      ) : (
        <div className="grid size-full place-items-center text-xs text-muted">
          {isError ? "—" : "…"}
        </div>
      )}
      <span className="absolute right-1.5 bottom-1.5 rounded-sm bg-black/60 px-1.5 py-0.5 text-2xs text-white/80">
        {i === 0 ? "title" : i}
      </span>
    </div>
  );
}

export function StudioPreview({ date }: { date: string }) {
  const [part, setPart] = useState<"1" | "2">("1");
  const [big, setBig] = useState<number | null>(null);

  return (
    <section className="rounded-lg border border-line-strong bg-surface p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-base font-semibold text-ink">Preview</h2>
        <div className="flex gap-1.5">
          {(["1", "2"] as const).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPart(p)}
              aria-pressed={part === p}
              className={`min-h-11 cursor-pointer rounded-md border px-3 py-2 text-xs font-medium transition-colors ${
                part === p
                  ? "border-accent bg-accent-wash text-accent-ink font-semibold"
                  : "border-line-strong text-muted hover:border-accent hover:text-ink hover:bg-cream"
              }`}
            >
              भाग {p === "1" ? "१ · मेष–कन्या" : "२ · तुला–मीन"}
            </button>
          ))}
        </div>
      </div>
      <p className="mt-1 text-xs text-muted">
        The slides as the camera sees them, live from the page. Click one to see it full size.
      </p>

      <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
        {Array.from({ length: 7 }, (_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setBig(i)}
            className="cursor-zoom-in"
            aria-label={`Slide ${i === 0 ? "title" : i} preview`}
          >
            <Slide date={date} part={part} i={i} scale={0.22} />
          </button>
        ))}
      </div>

      {big !== null && (
        <button
          type="button"
          onClick={() => setBig(null)}
          className="fixed inset-0 z-50 grid cursor-zoom-out place-items-center bg-black/80 p-6"
          aria-label="Close preview"
        >
          <Slide date={date} part={part} i={big} scale={Math.min(0.7, (window.innerHeight - 48) / H)} />
        </button>
      )}
    </section>
  );
}
