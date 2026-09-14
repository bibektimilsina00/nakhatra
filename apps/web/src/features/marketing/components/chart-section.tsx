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
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_18%_50%,var(--color-accent-wash),transparent_70%)]" />
      <div className="relative mx-auto max-w-[1360px] px-8">
        <div className="mb-14 max-w-2xl">
          <span className={`font-mono text-2xs text-accent-ink ${eyebrow}`}>{m.eyebrow}</span>
          <h2 className="mt-4 font-display text-3xl font-bold leading-tight tracking-tight text-ink sm:text-4xl">{m.title}</h2>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted">{m.sub}</p>
        </div>

        <div className="grid items-start gap-14 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <div className="reveal">
            <svg viewBox="-2 -2 104 104" className="w-full max-w-[480px]" id="kchart">
              <g fill="none" stroke="var(--color-accent)" strokeOpacity=".4" strokeWidth=".6">
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
                        fill="var(--color-accent)"
                        fillOpacity={on ? ".13" : "0"}
                        className="transition-[fill-opacity] duration-300"
                      />
                      <text
                        x={h.c[0]} y={h.c[1]} textAnchor="middle" fontSize="3.6"
                        fontFamily="ui-monospace,monospace" fill="var(--color-accent)"
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
              <span className={`rounded-sm border border-line-strong bg-accent-wash px-1.5 py-0.5 font-mono text-2xs font-bold text-accent-ink ${badge}`}>{m.sample}</span>
              <span className={`font-mono text-2xs text-dim ${label}`}>{m.stamp}</span>
            </div>
          </div>

          <div className="space-y-10">
            <dl className="border-y border-line font-mono text-xs">
              {m.stats.map((k, i) => (
                <div key={k} className={`flex items-baseline justify-between gap-4 py-3${i < m.stats.length - 1 ? " border-b border-line" : ""}`}>
                  <dt className={`text-2xs text-dim ${label}`}>{k}</dt>
                  <dd className="tabular-nums text-accent-ink">{m.statValues[i]}</dd>
                </div>
              ))}
            </dl>

            <div>
              <div className="flex items-baseline justify-between gap-4 border-b border-line-strong pb-3">
                <h3 className="font-display text-base font-bold text-ink">{m.house} {house.n} · {T(house.sign)}</h3>
                <span className="font-mono text-2xs text-dim">{m.lord}: {T(house.lord)}</span>
              </div>
              <ul className="mt-4 space-y-2.5 text-xs">
                {house.p.length ? (
                  house.p.map((pl) => (
                    <li key={pl.name} className="flex items-baseline justify-between gap-3">
                      <span className="text-ink">
                        {T(pl.name)}
                        {pl.retro && <span className="text-accent-ink"> ℞</span>}
                      </span>
                      <span className="font-mono text-muted">{pl.deg} · {T(pl.nakshatra)}</span>
                    </li>
                  ))
                ) : (
                  <li className="text-xs leading-relaxed text-muted">
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
