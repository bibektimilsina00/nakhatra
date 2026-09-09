"use client";

import Link from "next/link";

import { KUTAS } from "@/features/marketing/data/demo";
import { useLatinTracking, useMarketing } from "@/lib/i18n/language-context";

/** Ashtakoota matching, broken down koota by koota. */
export function MilanSection() {
  const c = useMarketing().milan;
  const eyebrow = useLatinTracking("uppercase tracking-[0.22em]");
  const micro = useLatinTracking("uppercase tracking-[0.18em]");
  const pill = useLatinTracking("uppercase tracking-[0.14em]");
  const label = useLatinTracking("uppercase tracking-[0.2em]");

  return (
    <section id="milan" className="bg-ink2 py-24">
      <div className="mx-auto grid max-w-[1360px] items-center gap-14 px-8 lg:grid-cols-2 lg:gap-20">
        <div>
          <span className={`font-mono text-[11px] text-gold ${eyebrow}`}>{c.eyebrow}</span>
          <h2 className="mt-4 font-disp text-[30px] font-bold leading-[1.12] tracking-[-0.015em] text-paper sm:text-[38px]">{c.title}</h2>
          <p className="mt-4 text-[15.5px] leading-[1.7] text-muted">{c.sub}</p>

          <dl className="mt-9 max-w-md border-t border-brd text-[13.5px]">
            <div className="flex items-baseline justify-between gap-4 border-b border-brd py-3"><dt className="text-muted">{c.kutasLabel}</dt><dd className="font-mono text-paper">{c.kutasValue}</dd></div>
            <div className="flex items-baseline justify-between gap-4 border-b border-brd py-3"><dt className="text-muted">{c.doshaLabel}</dt><dd className="font-mono text-paper">{c.doshaValue}</dd></div>
            <div className="flex items-baseline justify-between gap-4 py-3"><dt className="text-muted">{c.rulesLabel}</dt><dd className="font-mono text-paper">{c.rulesValue}</dd></div>
          </dl>

          {/* There is a real matching page; this is not a marketing anchor. */}
          <Link href="/milan" className="mt-9 inline-flex items-center gap-2 rounded-[8px] bg-gold px-7 py-3.5 text-[15px] font-semibold text-ink transition hover:bg-gold2">
            Match two charts
            <svg className="size-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 8h11M9 4l4 4-4 4"/></svg>
          </Link>
        </div>

        <div className="reveal overflow-hidden rounded-[8px] border border-brd bg-card/60">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent"></div>

          <div className="flex items-center gap-6 border-b border-brd p-7 sm:p-8">
            <div className="flex-1 text-center">
                  <svg viewBox="-1 -1 102 102" className="mx-auto w-full max-w-[104px]">
                    <g fill="none" stroke="#E5A93C" strokeOpacity=".34" strokeWidth="1.1">
                      <rect x="0" y="0" width="100" height="100"/><path d="M50 0 L100 50 L50 100 L0 50 Z"/>
                      <path d="M0 0 L100 100 M100 0 L0 100" strokeOpacity=".18"/>
                    </g>
                  </svg>
                  <div className={`mt-3 font-mono text-[9.5px] text-gold ${micro}`}>{c.bride}</div>
                  <div className="mt-1.5 font-mono text-[10.5px] leading-relaxed text-faint">{c.brideChart[0]}<br/>{c.brideChart[1]}</div>
                </div>
            <div className="shrink-0 text-center">
              <div className="font-mono text-[46px] font-bold leading-none tracking-tight text-gold">28<span className="text-[20px] text-faint">/36</span></div>
              <div className={`mt-2.5 inline-block rounded-full border border-emerald-400/30 bg-emerald-400/10 px-2.5 py-0.5 font-mono text-[9.5px] text-emerald-300/90 ${pill}`}>{c.verdict}</div>
            </div>
            <div className="flex-1 text-center">
                  <svg viewBox="-1 -1 102 102" className="mx-auto w-full max-w-[104px]">
                    <g fill="none" stroke="#E5A93C" strokeOpacity=".34" strokeWidth="1.1">
                      <rect x="0" y="0" width="100" height="100"/><path d="M50 0 L100 50 L50 100 L0 50 Z"/>
                      <path d="M0 0 L100 100 M100 0 L0 100" strokeOpacity=".18"/>
                    </g>
                  </svg>
                  <div className={`mt-3 font-mono text-[9.5px] text-gold ${micro}`}>{c.groom}</div>
                  <div className="mt-1.5 font-mono text-[10.5px] leading-relaxed text-faint">{c.groomChart[0]}<br/>{c.groomChart[1]}</div>
                </div>
          </div>

          <div className="p-7 sm:p-8">
            <div className="mb-5 flex items-baseline justify-between gap-4">
              <span className={`font-mono text-[10px] text-gold ${label}`}>{c.kootaByKoota}</span>
              <span className="font-mono text-[10px] text-faint">{c.barNote}</span>
            </div>
            <ul className="space-y-3.5">
              {KUTAS.map(([, g, m], ki) => {
                const zero = g === 0;
                return (
                  <li key={c.kutaNames[ki]} className="grid grid-cols-[92px_1fr_44px] items-center gap-4 text-[13px]">
                    <span className={zero ? "text-rose-300/85" : "text-muted"}>{c.kutaNames[ki]}</span>
                    <span className="flex h-2 items-center">
                      {/* Width is what the kuta is worth out of eight; the fill is
                          what it scored. Scaling each bar to its own maximum made
                          Varna 1/1 look identical to Nadi 8/8. */}
                      <span
                        className={`h-1.5 overflow-hidden rounded-full ${
                          zero ? "bg-rose-500/20 ring-1 ring-inset ring-rose-500/35" : "bg-white/[0.07]"
                        }`}
                        style={{ width: `${(m / 8) * 100}%` }}
                      >
                        <span
                          className={`block h-full rounded-full ${g < m ? "bg-gold/70" : "bg-gold"}`}
                          style={{ width: `${(g / m) * 100}%` }}
                        />
                      </span>
                    </span>
                    <span className={`text-right font-mono tabular-nums ${zero ? "text-rose-300/85" : "text-faint"}`}>{g}/{m}</span>
                  </li>
                );
              })}
            </ul>

            {/* The dosha the copy promises, actually shown. */}
            <div className="mt-7 rounded-[8px] border border-brd bg-ink/50 p-4">
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                <span className={`font-mono text-[10px] text-gold ${micro}`}>{c.manglik}</span>
                <span className="font-mono text-[11.5px] text-muted">{c.bride} <span className="text-rose-400/85">{c.yes}</span></span>
                <span className="font-mono text-[11.5px] text-muted">{c.groom} <span className="text-rose-400/85">{c.yes}</span></span>
                <span className={`ml-auto rounded-full border border-emerald-400/30 bg-emerald-400/10 px-2.5 py-0.5 font-mono text-[9.5px] text-emerald-300/90 ${pill}`}>{c.cancelled}</span>
              </div>
              <p className="mt-2.5 text-[12.5px] leading-[1.7] text-faint">{c.manglikNote}</p>
            </div>

            <p className="mt-6 border-t border-brd pt-5 text-[12.5px] leading-[1.7] text-faint">
              {c.illustrative}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
