"use client";

import { useRef, useState } from "react";

import { useLatinTracking, useMarketing } from "@/lib/i18n/language-context";

/** The seven-section reading, read straight through or jumped around. */
export function ReadingSection() {
  const m = useMarketing().reading;
  const eyebrow = useLatinTracking("uppercase tracking-[0.22em]");
  const label = useLatinTracking("uppercase tracking-[0.2em]");
  const [i, setI] = useState(2);
  const listRef = useRef<HTMLDivElement>(null);
  const s = m.entries[i];
  const n = String(i + 1).padStart(2, "0");

  const go = (next: number) => {
    const clamped = Math.min(m.entries.length - 1, Math.max(0, next));
    setI(clamped);
    listRef.current?.querySelectorAll<HTMLButtonElement>(".rsel")[clamped]?.focus();
  };

  return (
    <section id="reading" className="bg-surface py-24">
      <div className="mx-auto max-w-[1360px] px-8">
        <div className="mb-14 max-w-2xl">
          <span className={`font-mono text-xs text-accent-ink ${eyebrow}`}>{m.eyebrow}</span>
          <h2 className="mt-4 font-display text-3xl font-bold leading-tight tracking-tight text-ink sm:text-4xl">{m.title}</h2>
          <p className="mt-4 text-base leading-relaxed text-muted">{m.sub}</p>
        </div>

        <div className="grid items-start gap-10 lg:grid-cols-[minmax(0,.8fr)_minmax(0,1.2fr)] lg:gap-14">
          <div ref={listRef} className="space-y-1">
            <div className="mb-4 flex items-baseline justify-between border-b border-line pb-3">
              <span className={`font-mono text-xs font-semibold text-muted ${label}`}>{m.contents}</span>
              <span className="font-mono text-xs font-semibold text-dim">{m.sectionCount}</span>
            </div>
            {m.toc.map((title, j) => {
              const on = j === i;
              return (
                <button
                  key={title}
                  type="button"
                  aria-current={on ? "true" : undefined}
                  onClick={(e) => {
                    e.preventDefault();
                    setI(j);
                  }}
                  onKeyDown={(e) => {
                    const d = e.key === "ArrowDown" ? 1 : e.key === "ArrowUp" ? -1 : 0;
                    if (!d) return;
                    e.preventDefault();
                    go(i + d);
                  }}
                  className={`rsel group relative flex min-h-12 w-full items-center gap-4 rounded-lg border-l-3 py-3 pl-4 pr-4 text-left transition-all duration-150 cursor-pointer ${
                    on
                      ? "border-accent-ink bg-surface shadow-sm font-semibold text-ink"
                      : "border-transparent text-muted hover:bg-surface/60 hover:text-ink"
                  }`}
                >
                  <span className={`font-mono text-xs tabular-nums ${on ? "text-accent-ink font-bold" : "opacity-60"}`}>
                    {String(j + 1).padStart(2, "0")}
                  </span>
                  <span className="flex-1 text-sm">{title}</span>
                  <svg
                    className={`size-4 shrink-0 transition-all ${on ? "opacity-100 text-accent-ink translate-x-0" : "opacity-0 -translate-x-1 group-hover:opacity-40"}`}
                    viewBox="0 0 16 16"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M6 3l5 5-5 5" />
                  </svg>
                </button>
              );
            })}
          </div>

          <article
            key={i}
            className="relative overflow-hidden rounded-xl border border-line-strong bg-surface shadow-raised transition-all"
          >
            <span aria-hidden="true" className="pointer-events-none absolute -top-6 right-4 select-none font-mono text-8xl font-bold leading-none text-line/30">{n}</span>

            <div className="relative p-8 sm:p-10">
              <div className="flex flex-wrap items-center gap-3">
                <span className="flex size-8 items-center justify-center rounded-md border border-line-strong bg-cream font-mono text-xs font-bold text-ink">{n}</span>
                <span className={`font-mono text-xs font-semibold text-dim ${label}`}>{m.sectionOf.replace("{n}", n)}</span>
              </div>

              <h3 className="mt-5 font-display text-2xl font-bold leading-tight tracking-tight text-ink sm:text-3xl">{s.title}</h3>
              <p className="mt-5 border-l-3 border-accent-ink/70 pl-4 text-sm font-medium leading-relaxed text-ink/90">{s.summary}</p>
              <p className="mt-5 text-sm leading-relaxed text-muted">{s.body}</p>

              <div className="mt-8 border-t border-line/80 pt-5">
                <div className="mb-3 flex items-center gap-2">
                  <svg className="size-3.5 text-accent-ink" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M6.5 9.5a3 3 0 0 0 4.2 0l2-2a3 3 0 0 0-4.2-4.2l-.6.6" /><path d="M9.5 6.5a3 3 0 0 0-4.2 0l-2 2a3 3 0 0 0 4.2 4.2l.6-.6" /></svg>
                  <span className={`font-mono text-xs font-semibold text-accent-ink ${label}`}>{m.drawnFrom}</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {s.refs.map((r) => (
                    <span key={r} className="rounded-md border border-line bg-cream px-3 py-1 font-mono text-xs text-ink">{r}</span>
                  ))}
                </div>
              </div>

              {/* Read straight through controls */}
              <div className="mt-8 flex items-center justify-between gap-4 border-t border-line/80 pt-5">
                <button
                  type="button"
                  disabled={i === 0}
                  onClick={(e) => {
                    e.preventDefault();
                    setI(i - 1);
                  }}
                  className="inline-flex min-h-11 items-center gap-2 rounded-md border border-line bg-cream px-4 py-2 text-sm font-medium text-ink transition-colors hover:border-line-strong hover:bg-surface disabled:pointer-events-none disabled:opacity-30 cursor-pointer"
                >
                  <svg className="size-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10 3 5 8l5 5" /></svg>{m.prev}
                </button>
                <div className="flex items-center gap-2">
                  {m.entries.map((_, j) => (
                    <button
                      key={j}
                      type="button"
                      aria-label={`Go to section ${j + 1}`}
                      onClick={(e) => {
                        e.preventDefault();
                        setI(j);
                      }}
                      className={`h-2 rounded-full transition-all duration-200 cursor-pointer ${j === i ? "w-6 bg-accent-ink" : "w-2 bg-line-strong hover:bg-muted"}`}
                    />
                  ))}
                </div>
                <button
                  type="button"
                  disabled={i === m.entries.length - 1}
                  onClick={(e) => {
                    e.preventDefault();
                    setI(i + 1);
                  }}
                  className="inline-flex min-h-11 items-center gap-2 rounded-md border border-line bg-cream px-4 py-2 text-sm font-medium text-ink transition-colors hover:border-line-strong hover:bg-surface disabled:pointer-events-none disabled:opacity-30 cursor-pointer"
                >
                  {m.next}<svg className="size-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 3l5 5-5 5" /></svg>
                </button>
              </div>
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}
