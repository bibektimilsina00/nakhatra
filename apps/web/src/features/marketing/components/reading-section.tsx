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
    <section id="reading" className="bg-ink2 py-24">
      <div className="mx-auto max-w-[1360px] px-8">
        <div className="mb-14 max-w-2xl">
          <span className={`font-mono text-[11px] text-gold ${eyebrow}`}>{m.eyebrow}</span>
          <h2 className="mt-4 font-disp text-[30px] font-bold leading-[1.12] tracking-[-0.015em] text-paper sm:text-[38px]">{m.title}</h2>
          <p className="mt-4 text-[15.5px] leading-[1.7] text-muted">{m.sub}</p>
        </div>

        <div className="grid items-start gap-10 lg:grid-cols-[minmax(0,.8fr)_minmax(0,1.2fr)] lg:gap-14">
          <div ref={listRef}>
            <div className="mb-4 flex items-baseline justify-between border-b border-white/[0.09] pb-3">
              <span className={`font-mono text-[10px] text-gold ${label}`}>{m.contents}</span>
              <span className="font-mono text-[10px] text-faint">{m.sectionCount}</span>
            </div>
            {m.toc.map((title, j) => {
              const on = j === i;
              return (
                <button
                  key={title}
                  type="button"
                  className={`rsel group relative flex w-full items-center gap-4 border-l-2 py-3.5 pl-5 pr-4 text-left transition ${
                    on
                      ? "border-gold bg-gradient-to-r from-gold/[0.07] to-transparent text-paper"
                      : "border-white/[0.09] text-muted hover:border-white/30 hover:bg-white/[0.02] hover:text-paper"
                  }`}
                  aria-current={on}
                  onClick={() => setI(j)}
                  onKeyDown={(e) => {
                    const d = e.key === "ArrowDown" ? 1 : e.key === "ArrowUp" ? -1 : 0;
                    if (!d) return;
                    e.preventDefault();
                    go(i + d);
                  }}
                >
                  <span className="font-mono text-[11px] tabular-nums opacity-60">{String(j + 1).padStart(2, "0")}</span>
                  <span className="flex-1 text-[14.5px]">{title}</span>
                  <svg className="size-3.5 shrink-0 transition-opacity" style={{ opacity: on ? 1 : 0 }} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 3l5 5-5 5" /></svg>
                </button>
              );
            })}
          </div>

          <article className="relative overflow-hidden rounded-[8px] border border-white/10 bg-gradient-to-b from-card to-card/40">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold/45 to-transparent" />
            <span aria-hidden="true" className="pointer-events-none absolute -top-8 right-4 select-none font-mono text-[140px] font-bold leading-none text-white/[0.022]">{n}</span>

            <div className="relative p-8 sm:p-10">
              <div className="flex flex-wrap items-center gap-3">
                <span className="flex size-8 items-center justify-center rounded-[6px] border border-gold/30 bg-ink font-mono text-[12px] text-gold">{n}</span>
                <span className={`font-mono text-[10px] text-faint ${label}`}>{m.sectionOf.replace("{n}", n)}</span>
              </div>

              <h3 className="mt-5 font-disp text-[24px] font-bold leading-[1.15] tracking-[-0.01em] text-paper sm:text-[28px]">{s.title}</h3>
              <p className="mt-5 border-l-2 border-gold/50 pl-4 text-[14.5px] font-medium leading-[1.7] text-gold2">{s.summary}</p>
              <p className="mt-5 text-[14.5px] leading-[1.85] text-muted">{s.body}</p>

              <div className="mt-8 border-t border-white/10 pt-5">
                <div className="mb-3 flex items-center gap-2">
                  <svg className="size-3.5 text-gold" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><path d="M6.5 9.5a3 3 0 0 0 4.2 0l2-2a3 3 0 0 0-4.2-4.2l-.6.6" /><path d="M9.5 6.5a3 3 0 0 0-4.2 0l-2 2a3 3 0 0 0 4.2 4.2l.6-.6" /></svg>
                  <span className={`font-mono text-[10px] text-gold ${label}`}>{m.drawnFrom}</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {s.refs.map((r) => (
                    <span key={r} className="rounded-[5px] border border-white/10 bg-ink px-2.5 py-1 font-mono text-[11.5px] text-paper">{r}</span>
                  ))}
                </div>
              </div>

              {/* Read straight through, the way the real reading is read. */}
              <div className="mt-8 flex items-center justify-between gap-4 border-t border-white/10 pt-5">
                <button type="button" disabled={i === 0} onClick={() => setI(i - 1)} className="inline-flex items-center gap-2 text-[13px] font-medium text-muted transition-colors hover:text-paper disabled:pointer-events-none disabled:opacity-30">
                  <svg className="size-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10 3 5 8l5 5" /></svg>{m.prev}
                </button>
                <div className="flex items-center gap-1.5">
                  {m.entries.map((_, j) => (
                    <span key={j} className={`h-1 rounded-full transition-all ${j === i ? "w-5 bg-gold" : "w-1 bg-white/20"}`} />
                  ))}
                </div>
                <button type="button" disabled={i === m.entries.length - 1} onClick={() => setI(i + 1)} className="inline-flex items-center gap-2 text-[13px] font-medium text-muted transition-colors hover:text-paper disabled:pointer-events-none disabled:opacity-30">
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
