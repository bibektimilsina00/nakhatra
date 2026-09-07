"use client";

import { useState } from "react";

import { HOUSES } from "@/features/marketing/data/demo";
import { useLatinTracking, useMarketing } from "@/lib/i18n/language-context";

const AB: Record<string, string> = {
  Sun: "Su", Moon: "Mo", Mars: "Ma", Mercury: "Me", Jupiter: "Ju",
  Venus: "Ve", Saturn: "Sa", Rahu: "Ra", Ketu: "Ke",
};



/** The sample chart — a real 14 June 1975 Kathmandu birth, not the visitor's. */
export function ChartSection() {
  const m = useMarketing().chart;
  const terms = useMarketing().terms;
  const T = (x: string) => terms[x] ?? x;
  const eyebrow = useLatinTracking("uppercase tracking-[0.22em]");
  const label = useLatinTracking("uppercase tracking-[0.16em]");
  const badge = useLatinTracking("uppercase tracking-[0.14em]");
  const [active, setActive] = useState(1);
  const house = HOUSES.find((h) => h.n === active)!;

  return (
    <section id="chart" className="relative overflow-hidden py-24">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_18%_50%,rgba(229,169,60,.045),transparent_70%)]" />
      <div className="relative mx-auto max-w-[1360px] px-8">
        <div className="mb-14 max-w-2xl">
          <span className={`font-mono text-[11px] text-gold ${eyebrow}`}>{m.eyebrow}</span>
          <h2 className="mt-4 font-disp text-[30px] font-bold leading-[1.12] tracking-[-0.015em] text-paper sm:text-[38px]">{m.title}</h2>
          <p className="mt-4 max-w-2xl text-[15.5px] leading-[1.7] text-muted">{m.sub}</p>
        </div>

        <div className="grid items-start gap-14 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <div className="reveal">
            <svg viewBox="-2 -2 104 104" className="w-full max-w-[480px]" id="kchart">
              <g fill="none" stroke="#E5A93C" strokeOpacity=".4" strokeWidth=".6">
                <rect x="0" y="0" width="100" height="100" />
                <path d="M50 0 L100 50 L50 100 L0 50 Z" />
                <path d="M0 0 L100 100 M100 0 L0 100" strokeOpacity=".22" />
              </g>
              <g>
                {HOUSES.map((h) => {
                  const on = h.n === active;
                  return (
                    <g key={h.n} className="cursor-pointer" onMouseEnter={() => setActive(h.n)}>
                      <path
                        d={h.d}
                        fill="#E5A93C"
                        fillOpacity={on ? ".13" : "0"}
                        className="transition-[fill-opacity] duration-300"
                      />
                      <text
                        x={h.c[0]} y={h.c[1]} textAnchor="middle" fontSize="3.6"
                        fontFamily="ui-monospace,monospace" fill="#E5A93C"
                        fillOpacity={on ? ".95" : ".45"}
                      >
                        {h.p.map((x) => AB[x.name]).join(" ")}
                      </text>
                    </g>
                  );
                })}
              </g>
            </svg>
            <div className="mt-5 flex max-w-[480px] flex-wrap items-center justify-center gap-x-3 gap-y-2">
              <span className={`rounded-[4px] border border-gold/35 px-1.5 py-0.5 font-mono text-[9px] font-bold text-gold ${badge}`}>{m.sample}</span>
              <span className={`font-mono text-[11px] text-faint ${label}`}>{m.stamp}</span>
            </div>
          </div>

          <div className="space-y-10">
            <dl className="border-y border-white/[0.09] font-mono text-[13px]">
              {m.stats.map((k, i) => (
                <div key={k} className={`flex items-baseline justify-between gap-4 py-3${i < m.stats.length - 1 ? " border-b border-white/[0.06]" : ""}`}>
                  <dt className={`text-[11px] text-faint ${label}`}>{k}</dt>
                  <dd className="tabular-nums text-gold2">{m.statValues[i]}</dd>
                </div>
              ))}
            </dl>

            <div>
              <div className="flex items-baseline justify-between gap-4 border-b border-gold/25 pb-3">
                <h3 className="font-disp text-[17px] font-bold text-paper">{m.house} {house.n} · {T(house.sign)}</h3>
                <span className="font-mono text-[11.5px] text-faint">{m.lord}: {T(house.lord)}</span>
              </div>
              <ul className="mt-4 space-y-2.5 text-[13.5px]">
                {house.p.length ? (
                  house.p.map((pl) => (
                    <li key={pl.name} className="flex items-baseline justify-between gap-3">
                      <span className="text-paper">
                        {T(pl.name)}
                        {pl.retro && <span className="text-gold"> ℞</span>}
                      </span>
                      <span className="font-mono text-muted">{pl.deg} · {T(pl.nakshatra)}</span>
                    </li>
                  ))
                ) : (
                  <li className="text-[13.5px] leading-relaxed text-muted">
                    {m.empty}
                  </li>
                )}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
