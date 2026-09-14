"use client";

import Link from "next/link";

import { buttonClasses } from "@/components/ui/button";
import { KUTAS } from "@/features/marketing/data/demo";
import { useLatinTracking, useMarketing } from "@/lib/i18n/language-context";

/** Ashtakoota matching, broken down koota by koota. */
export function MilanSection() {
  const c = useMarketing().milan;
  const eyebrow = useLatinTracking("uppercase tracking-widest");
  const micro = useLatinTracking("uppercase tracking-wider");
  const pill = useLatinTracking("uppercase tracking-wide");
  const label = useLatinTracking("uppercase tracking-widest");

  return (
    <section id="milan" className="bg-surface py-24">
      <div className="mx-auto grid max-w-[1360px] items-center gap-14 px-8 lg:grid-cols-2 lg:gap-20">
        <div>
          <span className={`font-mono text-xs text-accent-ink ${eyebrow}`}>{c.eyebrow}</span>
          <h2 className="mt-4 font-display text-3xl font-bold leading-tight tracking-tight text-ink sm:text-4xl">{c.title}</h2>
          <p className="mt-4 text-base leading-relaxed text-muted">{c.sub}</p>

          <dl className="mt-9 max-w-md border-t border-line text-sm">
            <div className="flex items-baseline justify-between gap-4 border-b border-line py-3"><dt className="text-muted">{c.kutasLabel}</dt><dd className="font-mono text-ink">{c.kutasValue}</dd></div>
            <div className="flex items-baseline justify-between gap-4 border-b border-line py-3"><dt className="text-muted">{c.doshaLabel}</dt><dd className="font-mono text-ink">{c.doshaValue}</dd></div>
            <div className="flex items-baseline justify-between gap-4 py-3"><dt className="text-muted">{c.rulesLabel}</dt><dd className="font-mono text-ink">{c.rulesValue}</dd></div>
          </dl>

          {/* There is a real matching page; this is not a marketing anchor. */}
          <Link href="/milan" className={buttonClasses("primary", { className: "mt-9 inline-flex min-h-11 items-center gap-2 px-7 py-3 text-sm" })}>
            Match two charts
            <svg className="size-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 8h11M9 4l4 4-4 4"/></svg>
          </Link>
        </div>

        <div className="reveal overflow-hidden rounded-lg border border-line-strong bg-surface shadow-raised">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent/40 to-transparent"></div>

          <div className="flex items-center gap-6 border-b border-line p-7 sm:p-8">
            <div className="flex-1 text-center">
                  <svg viewBox="-1 -1 102 102" className="mx-auto w-full max-w-[104px]">
                    <g fill="none" stroke="var(--color-accent)" strokeOpacity=".34" strokeWidth="1.1">
                      <rect x="0" y="0" width="100" height="100"/><path d="M50 0 L100 50 L50 100 L0 50 Z"/>
                      <path d="M0 0 L100 100 M100 0 L0 100" strokeOpacity=".18"/>
                    </g>
                  </svg>
                  <div className={`mt-3 font-mono text-xs text-accent-ink ${micro}`}>{c.bride}</div>
                  <div className="mt-1.5 font-mono text-xs leading-relaxed text-dim">{c.brideChart[0]}<br/>{c.brideChart[1]}</div>
                </div>
            <div className="shrink-0 text-center">
              <div className="font-mono text-4xl font-bold leading-none tracking-tight text-accent-ink sm:text-5xl">28<span className="text-xl text-dim">/36</span></div>
              <div className={`mt-2.5 inline-block rounded-full border border-success/30 bg-success-tint px-2.5 py-0.5 font-mono text-xs text-success-ink ${pill}`}>{c.verdict}</div>
            </div>
            <div className="flex-1 text-center">
                  <svg viewBox="-1 -1 102 102" className="mx-auto w-full max-w-[104px]">
                    <g fill="none" stroke="var(--color-accent)" strokeOpacity=".34" strokeWidth="1.1">
                      <rect x="0" y="0" width="100" height="100"/><path d="M50 0 L100 50 L50 100 L0 50 Z"/>
                      <path d="M0 0 L100 100 M100 0 L0 100" strokeOpacity=".18"/>
                    </g>
                  </svg>
                  <div className={`mt-3 font-mono text-xs text-accent-ink ${micro}`}>{c.groom}</div>
                  <div className="mt-1.5 font-mono text-xs leading-relaxed text-dim">{c.groomChart[0]}<br/>{c.groomChart[1]}</div>
                </div>
          </div>

          <div className="p-7 sm:p-8">
            <div className="mb-5 flex items-baseline justify-between gap-4">
              <span className={`font-mono text-xs text-accent-ink ${label}`}>{c.kootaByKoota}</span>
              <span className="font-mono text-xs text-dim">{c.barNote}</span>
            </div>
            <ul className="space-y-3.5">
              {KUTAS.map(([, g, m], ki) => {
                const zero = g === 0;
                return (
                  <li key={c.kutaNames[ki]} className="grid grid-cols-[92px_1fr_44px] items-center gap-4 text-sm">
                    <span className={zero ? "text-danger-ink" : "text-muted"}>{c.kutaNames[ki]}</span>
                    <span className="flex h-2 items-center">
                      {/* Width is what the kuta is worth out of eight; the fill is
                          what it scored. Scaling each bar to its own maximum made
                          Varna 1/1 look identical to Nadi 8/8. */}
                      <span
                        className={`h-1.5 overflow-hidden rounded-full ${
                          zero ? "bg-danger-tint ring-1 ring-inset ring-danger/35" : "bg-line/30"
                        }`}
                        style={{ width: `${(m / 8) * 100}%` }}
                      >
                        <span
                          className={`block h-full rounded-full ${g < m ? "bg-accent/70" : "bg-accent"}`}
                          style={{ width: `${(g / m) * 100}%` }}
                        />
                      </span>
                    </span>
                    <span className={`text-right font-mono tabular-nums ${zero ? "text-danger-ink" : "text-dim"}`}>{g}/{m}</span>
                  </li>
                );
              })}
            </ul>

            {/* The dosha the copy promises, actually shown. */}
            <div className="mt-7 rounded-lg border border-line bg-surface p-4">
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                <span className={`font-mono text-xs text-accent-ink ${micro}`}>{c.manglik}</span>
                <span className="font-mono text-xs text-muted">{c.bride} <span className="text-danger-ink">{c.yes}</span></span>
                <span className="font-mono text-xs text-muted">{c.groom} <span className="text-danger-ink">{c.yes}</span></span>
                <span className={`ml-auto rounded-full border border-success/30 bg-success-tint px-2.5 py-0.5 font-mono text-xs text-success-ink ${pill}`}>{c.cancelled}</span>
              </div>
              <p className="mt-2.5 text-xs leading-relaxed text-dim">{c.manglikNote}</p>
            </div>

            <p className="mt-6 border-t border-line pt-5 text-xs leading-relaxed text-dim">
              {c.illustrative}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
