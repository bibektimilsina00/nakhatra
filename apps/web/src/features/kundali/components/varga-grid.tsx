"use client";

import { NorthIndianChart } from "@/features/kundali/components/north-indian-chart";
import { Section, ViewMore, useReveal } from "@/features/kundali/components/section";
import type { Chart, Varga } from "@/features/kundali/types";

/** A divisional chart drawn in the same North Indian frame as the rasi. */
function VargaCard({ varga }: { varga: Varga }) {
  // The chart component wants the rasi shape; a varga has its own lagna and
  // its own placements, so adapt rather than duplicate the geometry.
  const adapted: Chart = {
    lagna_sign_index: varga.lagna_sign_index,
    houses: Array.from({ length: 12 }, (_, i) => {
      const sign = (varga.lagna_sign_index + i) % 12;
      return { number: i + 1, sign: "", sign_index: sign, lord: "", occupants: [] };
    }),
    planets: varga.placements.map((p) => ({
      name: p.planet,
      house: p.house,
      retrograde: false,
      combust: false,
    })),
  } as unknown as Chart;

  return (
    <div className="rounded-lg border border-line bg-surface/40 p-4">
      <div className="mb-1 flex items-baseline justify-between gap-2">
        <h3 className="font-display text-base text-ink">
          {varga.code} · {varga.name}
        </h3>
        <span className="text-2xs text-dim">1/{varga.divisions}</span>
      </div>
      <p className="mb-3 text-2xs leading-snug text-dim">{varga.meaning}</p>
      <div className="flex justify-center">
        <NorthIndianChart chart={adapted} />
      </div>
      <p className="mt-2 text-center text-2xs text-dim">
        Lagna {varga.lagna_sign}
      </p>
    </div>
  );
}

export function VargaGrid({ vargas }: { vargas: Varga[] }) {
  const { visible, hidden, expanded, toggle } = useReveal(vargas, 6);
  return (
    <Section
      id="divisional-charts"
      title="Divisional Charts"
      note="Each varga slices every sign into finer parts and remaps them, giving a chart for one area of life. The mapping rule differs per varga — none is derived from another."
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {visible.map((v) => (
          <VargaCard key={v.code} varga={v} />
        ))}
      </div>
      <ViewMore
        count={hidden}
        label="divisional charts"
        expanded={expanded}
        onToggle={toggle}
      />
    </Section>
  );
}
