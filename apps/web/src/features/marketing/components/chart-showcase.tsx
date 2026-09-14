"use client";

import { useState } from "react";

import { NorthIndianChart } from "@/features/kundali/components/north-indian-chart";
import type { Chart } from "@/features/kundali/types";
import demo from "@/features/marketing/demo-chart.json";

const DEMO = demo as unknown as { birth: { name: string; date: string; time: string; place_label: string }; chart: Chart };

/**
 * A real chart, rendered by the same component the product uses.
 *
 * Not an illustration and not a screenshot: the data is a genuine ephemeris
 * result for a real birth moment, and clicking a house does what it does in the
 * app. A drawing of a chart would be easier and would prove nothing.
 */
export function ChartShowcase() {
  const [house, setHouse] = useState<number | null>(1);
  const { chart } = DEMO;

  const selected = chart.houses.find((h) => h.number === house);
  const occupants = chart.planets.filter((p) => p.house === house);

  return (
    <div className="grid items-center gap-10 lg:grid-cols-2">
      <div className="mx-auto w-full max-w-[460px]">
        <NorthIndianChart chart={chart} selectedHouse={house} onSelectHouse={setHouse} />
        <p className="mt-3 text-center text-xs text-dim">
          Kathmandu · 14 June 1975 · 08:30 — tap any house
        </p>
      </div>

      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {[
            ["Lagna", `${chart.lagna_sign} ${chart.lagna_degree.toFixed(2)}°`],
            ["Moon sign", chart.panchang.moon_sign],
            ["Nakshatra", `${chart.panchang.nakshatra} ${chart.panchang.nakshatra_pada}`],
            ["Tithi", chart.panchang.tithi_name],
            ["Yoga", chart.panchang.yoga],
            ["Ayanamsa", `${chart.ayanamsa_value.toFixed(3)}°`],
          ].map(([label, value]) => (
            <div key={label} className="rounded-lg border border-line-strong bg-surface p-3">
              <div className="text-2xs font-semibold uppercase tracking-widest text-dim">
                {label}
              </div>
              <div className="mt-1 font-mono text-xs text-accent-ink">{value}</div>
            </div>
          ))}
        </div>

        <div className="rounded-lg border border-line-strong bg-surface p-5">
          <div className="flex items-baseline justify-between gap-3 border-b border-line pb-3">
            <h3 className="font-display text-base font-bold text-ink">
              House {selected?.number} · {selected?.sign}
            </h3>
            <span className="text-xs text-dim">Lord: {selected?.lord}</span>
          </div>

          {occupants.length > 0 ? (
            <ul className="mt-3 space-y-2">
              {occupants.map((p) => (
                <li key={p.name} className="flex items-baseline justify-between gap-3 text-xs">
                  <span className="text-ink">
                    {p.name}
                    {p.retrograde && <span className="ml-1.5 text-accent-ink">℞</span>}
                    {p.combust && <span className="ml-1.5 text-danger-ink">combust</span>}
                  </span>
                  <span className="font-mono text-muted">
                    {p.degree_in_sign.toFixed(2)}° · {p.nakshatra.name}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-xs text-muted">
              No planets here. An empty house is read through its lord and the
              aspects reaching it, not treated as blank.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
