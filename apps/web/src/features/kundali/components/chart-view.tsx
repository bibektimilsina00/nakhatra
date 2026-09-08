"use client";

import { useState } from "react";

import {
  AvakhadaPanel,
  BirthDetailsPanel,
  PanchangPanel,
} from "@/features/kundali/components/detail-tables";
import { NorthIndianChart } from "@/features/kundali/components/north-indian-chart";
import { SouthIndianChart } from "@/features/kundali/components/south-indian-chart";
import { Section, ViewMore, useReveal } from "@/features/kundali/components/section";
import { VargaGrid } from "@/features/kundali/components/varga-grid";
import type {
  BirthDetailsIn,
  Chart,
  DashaPeriod,
  Planet,
} from "@/features/kundali/types";

/**
 * One scrolling page. No tabs: every section is reachable by scrolling, and the
 * long ones reveal a useful amount with "view more" rather than hiding behind
 * a click.
 */
export function ChartView({
  chart,
  birth,
  onReset,
}: {
  chart: Chart;
  birth: BirthDetailsIn;
  onReset: () => void;
}) {
  const [house, setHouse] = useState<number | null>(null);
  const [chartStyle, setChartStyle] = useState<"north" | "south">("north");
  // Captured once on mount. Reading the clock during render is impure and
  // makes the server and client renders disagree.
  const [now] = useState(() => Date.now());
  const d1 = chart.vargas.find((v) => v.code === "D1");
  const d9 = chart.vargas.find((v) => v.code === "D9");

  return (
    <div className="space-y-16">
      <Header chart={chart} birth={birth} onReset={onReset} />
      <Jump />

      <Section
        id="chart"
        title="Lagna Chart"
        note="Houses are fixed; signs move. The number in each compartment is the rashi — 1 is Aries. Tap a house for detail."
        action={
          <div className="flex rounded-[8px] border border-white/10 bg-[#090A10] p-0.5 text-[10px]">
            <button
              onClick={() => setChartStyle("north")}
              className={`rounded-[6px] px-2.5 py-1 font-bold transition ${
                chartStyle === "north" ? "bg-[#E5A93C] text-[#090A10]" : "text-[#94A3B8]"
              }`}
            >
              North
            </button>
            <button
              onClick={() => setChartStyle("south")}
              className={`rounded-[6px] px-2.5 py-1 font-bold transition ${
                chartStyle === "south" ? "bg-[#E5A93C] text-[#090A10]" : "text-[#94A3B8]"
              }`}
            >
              South
            </button>
          </div>
        }
      >
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
          <div className="flex flex-col items-center gap-8 lg:flex-row lg:items-start">
            {chartStyle === "north" ? (
              <NorthIndianChart
                chart={chart}
                selectedHouse={house}
                onSelectHouse={(h) => setHouse((prev) => (prev === h ? null : h))}
              />
            ) : (
              <SouthIndianChart
                chart={chart}
                selectedHouse={house}
                onSelectHouse={(h) => setHouse((prev) => (prev === h ? null : h))}
              />
            )}
            {d9 && (
              <div className="flex flex-col items-center">
                <p className="mb-2 text-2xs uppercase tracking-[0.16em] text-muted">
                  D9 · Navamsa
                </p>
                <div className="w-full max-w-[300px]">
                  <VargaMini varga={d9} chartStyle={chartStyle} />
                </div>
              </div>
            )}
          </div>
          <div className="space-y-4">
            <HousePanel chart={chart} house={house} />
            <DashaNow chain={currentChain(chart.dasha.periods, now)} birthLord={chart.dasha.birth_lord} />
          </div>
        </div>
      </Section>

      <Section
        id="basic"
        title="Birth Details & Panchang"
        note="Everything the chart is computed from, and the five limbs of the Vedic day it falls in."
      >
        <div className="grid gap-6 lg:grid-cols-2">
          <BirthDetailsPanel birth={birth} chart={chart} />
          <PanchangPanel panchang={chart.panchang} />
          <div className="lg:col-span-2">
            <AvakhadaPanel avakhada={chart.avakhada} />
          </div>
        </div>
      </Section>

      <PlanetTable planets={chart.planets} onPickHouse={setHouse} />

      <DashaTimeline periods={chart.dasha.periods} now={now} />
      <Bhukta
        bhukta={chart.dasha.bhukta_ghati ?? 0}
        bhabhoga={chart.dasha.bhabhoga_ghati ?? 0}
      />

      {/* Two further schemes over the same janma nakshatra, read beside
          vimshottari rather than instead of it. Rendered only when the chart
          carries them, so an older cached chart still displays. */}
      {chart.tribhagi && (
        <DashaTimeline
          periods={chart.tribhagi.periods}
          now={now}
          id="tribhagi"
          title="Tribhagi Dasha"
          note="Vimshottari with a third taken off every period — the same lords in the same order over 80 years instead of 120, so it moves faster and is read for closer timing."
        />
      )}

      {chart.yogini && (
        <DashaTimeline
          periods={chart.yogini.periods}
          now={now}
          id="yogini"
          title="Yogini Dasha"
          note="Eight yoginis over 36 years, starting from the janma nakshatra. The periods are simply one through eight years, so the whole cycle repeats three times in a long life."
        />
      )}

      <VargaGrid vargas={chart.vargas} />

      {d1 && <Missing />}
    </div>
  );
}

function VargaMini({
  varga,
  chartStyle = "north",
}: {
  varga: NonNullable<Chart["vargas"][number]>;
  chartStyle?: "north" | "south";
}) {
  const adapted = {
    lagna_sign_index: varga.lagna_sign_index,
    houses: Array.from({ length: 12 }, (_, i) => ({
      number: i + 1,
      sign: "",
      sign_index: (varga.lagna_sign_index + i) % 12,
      lord: "",
      occupants: [],
    })),
    planets: varga.placements.map((p) => ({
      name: p.planet,
      house: p.house,
      retrograde: false,
      combust: false,
    })),
  } as unknown as Chart;

  return chartStyle === "north" ? (
    <NorthIndianChart chart={adapted} />
  ) : (
    <SouthIndianChart chart={adapted} />
  );
}

function Jump() {
  const links = [
    ["chart", "Lagna Chart"],
    ["basic", "Birth & Panchang"],
    ["planets", "Planetary Positions"],
    ["dasha", "Vimshottari Dasha"],
    ["tribhagi", "Tribhagi"],
    ["yogini", "Yogini"],
    ["divisional-charts", "Divisional Charts"],
  ] as const;
  return (
    <nav className="sticky top-0 z-20 -mx-6 border-y border-line bg-cream/85 px-6 py-3 backdrop-blur">
      <div className="flex gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {links.map(([id, label]) => (
          <a
            key={id}
            href={`#${id}`}
            className="shrink-0 rounded-full border border-line px-4 py-1.5 text-xs text-muted transition hover:border-accent-strong/40 hover:text-accent-ink"
          >
            {label}
          </a>
        ))}
      </div>
    </nav>
  );
}

function Missing() {
  return (
    <section className="rounded-lg border border-dashed border-line p-6">
      <h3 className="font-display text-lg text-fg">Not built yet</h3>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">
        Ashtakvarga, KP (its own ayanamsa, Placidus cusps and sub-lords), Bhav
        Chalit, Shadbala, Bhavbala and the Ghata Chakra are still to come. Each
        is a separate calculation system with its own tables, and a wrong table
        produces numbers that look entirely plausible — so they are being built
        and verified one at a time rather than guessed at.
      </p>
    </section>
  );
}

function Header({
  chart,
  birth,
  onReset,
}: {
  chart: Chart;
  birth: BirthDetailsIn;
  onReset: () => void;
}) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-6 text-center sm:text-left">
      <div className="w-full sm:w-auto">
        <h2 className="font-display text-4xl text-fg sm:text-5xl">
          {birth.name}&apos;s Kundali
        </h2>
        <p className="mt-2 text-sm text-muted">
          {birth.date} · {birth.time} · {birth.place_label}
        </p>
        <p className="mt-3 text-sm text-accent-ink">
          {chart.lagna_sign} ascendant {fmtDeg(chart.lagna_degree)} ·{" "}
          {chart.panchang.moon_sign} moon · {chart.panchang.nakshatra}
        </p>
        <p className="mt-1 text-xs text-dim">
          {chart.ayanamsa_name} {chart.ayanamsa_value.toFixed(4)}° · whole-sign
          houses · engine v{chart.engine_version}
        </p>
        {/* Naming the system lets a reader square this chart with a jyotish's
            instead of assuming one of them is broken. Most hand-cast Nepali
            panchangs follow सूर्य सिद्धान्त, whose Moon runs about a quarter
            degree ahead of this one. */}
        {chart.siddhanta && (
          <p className="mt-0.5 text-xs text-dim">{chart.siddhanta}</p>
        )}
      </div>
      <button
        onClick={onReset}
        className="mx-auto rounded-full border border-line px-5 py-2 text-sm text-muted transition hover:border-accent-strong/50 hover:text-fg sm:mx-0"
      >
        New chart
      </button>
    </header>
  );
}

function HousePanel({ chart, house }: { chart: Chart; house: number | null }) {
  const selected = house ? chart.houses.find((h) => h.number === house) : null;
  if (!selected) {
    return (
      <Card>
        <CardLabel>House detail</CardLabel>
        <p className="mt-2 text-sm text-muted">
          Select a house in the chart to see its sign, lord and occupants.
        </p>
      </Card>
    );
  }
  const occupants = chart.planets.filter((p) => p.house === selected.number);
  return (
    <Card accent>
      <CardLabel>House {selected.number}</CardLabel>
      <p className="mt-1.5 font-display text-2xl text-fg">{selected.sign}</p>
      <p className="mt-1 text-xs text-muted">
        Lord {selected.lord} · rashi {selected.sign_index + 1}
      </p>
      <div className="mt-4 space-y-1.5">
        {occupants.length === 0 ? (
          <p className="text-sm text-dim">No planets in this house.</p>
        ) : (
          occupants.map((p) => (
            <div key={p.name} className="flex items-baseline justify-between text-sm">
              <span className="text-fg">{p.name}</span>
              <span className="tabular-nums text-muted">{fmtDeg(p.degree_in_sign)}</span>
            </div>
          ))
        )}
      </div>
    </Card>
  );
}

/** भुक्त / भभोग — the two figures a kundali prints beside the balance, so a
 *  reader can check our dasha against their jyotish's in the same units. */
function Bhukta({ bhukta, bhabhoga }: { bhukta: number; bhabhoga: number }) {
  if (!bhabhoga) return null;
  return (
    <p className="mt-2 text-xs text-dim">
      भुक्त {bhukta.toFixed(2)} ghati of भभोग {bhabhoga.toFixed(2)} —{" "}
      {((bhukta / bhabhoga) * 100).toFixed(1)}% of the janma nakshatra had
      passed at birth, which is what sets the balance.
    </p>
  );
}

function DashaNow({ chain, birthLord }: { chain: DashaPeriod[]; birthLord: string }) {
  if (chain.length === 0) {
    return (
      <Card>
        <CardLabel>Current period</CardLabel>
        <p className="mt-2 text-sm text-muted">Outside the generated 120-year cycle.</p>
      </Card>
    );
  }
  const [maha, antar] = chain;
  return (
    <Card>
      <CardLabel>Current period</CardLabel>
      <p className="mt-1.5 font-display text-2xl text-fg">
        {maha.lord}
        {antar && <span className="text-muted"> / {antar.lord}</span>}
      </p>
      <p className="mt-1 text-xs text-muted">
        Mahadasha {yr(maha.start)}–{yr(maha.end)}
        {antar && ` · antardasha to ${antar.end}`}
      </p>
      <p className="mt-3 text-xs text-dim">
        Vimshottari from the Moon&apos;s nakshatra. Birth lord {birthLord}.
      </p>
    </Card>
  );
}

function PlanetTable({
  planets,
  onPickHouse,
}: {
  planets: Planet[];
  onPickHouse: (house: number) => void;
}) {
  return (
    <Section
      id="planets"
      title="Planetary Positions"
      note="Sidereal longitudes from the Swiss Ephemeris. State is the Baladi avastha — the planet's age within its sign."
    >
      <div className="overflow-x-auto rounded-lg border border-line bg-surface/50">
        <table className="w-full min-w-[720px] text-sm">
          <thead>
            <tr className="text-left text-2xs uppercase tracking-[0.16em] text-dim">
              {["Planet", "Sign", "Lord", "Degree", "House", "Nakshatra", "State", "Dignity", ""].map(
                (h) => (
                  <th key={h} className="px-4 py-3 font-medium">
                    {h}
                  </th>
                ),
              )}
            </tr>
          </thead>
          <tbody>
            {planets.map((p) => (
              <tr
                key={p.name}
                onClick={() => onPickHouse(p.house)}
                className="cursor-pointer border-t border-line/70 transition hover:bg-accent-strong/[0.04]"
              >
                <td className="px-4 py-3 font-display text-base text-fg">{p.name}</td>
                <td className="px-4 py-3 text-fg">{p.sign}</td>
                <td className="px-4 py-3 text-muted">{SIGN_LORDS[p.sign_index]}</td>
                <td className="px-4 py-3 tabular-nums text-muted">{fmtDeg(p.degree_in_sign)}</td>
                <td className="px-4 py-3 tabular-nums text-muted">{p.house}</td>
                <td className="px-4 py-3 text-muted">
                  {p.nakshatra.name}
                  <span className="text-dim"> ·{p.nakshatra.pada}</span>
                </td>
                <td className="px-4 py-3 text-muted">{p.avastha}</td>
                <td className="px-4 py-3">
                  {/* null for Rahu and Ketu by design — classical sources
                      disagree, so the engine declines to invent one. */}
                  {p.dignity ? (
                    <span className={dignityClass(p.dignity)}>{p.dignity}</span>
                  ) : (
                    <span className="text-dim">—</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <span className="flex gap-1">
                    {p.retrograde && <Tag title="Retrograde">℞</Tag>}
                    {p.combust && <Tag title="Combust — close to the Sun">C</Tag>}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Section>
  );
}

const SIGN_LORDS = [
  "Mars", "Venus", "Mercury", "Moon", "Sun", "Mercury",
  "Venus", "Mars", "Jupiter", "Saturn", "Saturn", "Jupiter",
];

function DashaTimeline({
  periods,
  now,
  id = "dasha",
  title = "Vimshottari Dasha",
  note = "A 120-year cycle keyed to the Moon's nakshatra. Bar widths are the real durations — Venus runs 20 years, the Sun 6.",
}: {
  periods: DashaPeriod[];
  now: number;
  id?: string;
  title?: string;
  note?: string;
}) {
  const { visible, hidden, expanded, toggle } = useReveal(periods, 4);
  const start = new Date(periods[0].start).getTime();
  const end = new Date(periods[periods.length - 1].end).getTime();
  const span = end - start;

  return (
    <Section
      id={id}
      title={title}
      note={note}
    >
      <div className="mb-6 flex h-12 overflow-hidden rounded-lg border border-line">
        {periods.map((p) => {
          const width =
            ((new Date(p.end).getTime() - new Date(p.start).getTime()) / span) * 100;
          const active = isActive(p, now);
          return (
            <div
              key={`${p.lord}-${p.start}`}
              style={{ width: `${width}%` }}
              title={`${p.lord}  ${p.start} → ${p.end}`}
              className={`flex items-center justify-center border-r border-line/70 text-2xs last:border-r-0 ${
                active
                  ? "bg-accent-strong/25 font-medium text-fg"
                  : "bg-surface text-muted hover:bg-surface/60"
              }`}
            >
              {width > 6 ? p.lord.slice(0, 3) : ""}
            </div>
          );
        })}
      </div>

      <div className="space-y-1.5">
        {visible.map((p) => (
          <MahaRow key={`${p.lord}-${p.start}`} period={p} now={now} />
        ))}
      </div>
      <ViewMore count={hidden} label="mahadashas" expanded={expanded} onToggle={toggle} />
    </Section>
  );
}

function MahaRow({ period, now }: { period: DashaPeriod; now: number }) {
  const active = isActive(period, now);
  return (
    <details
      open={active}
      className={`rounded-lg border px-4 py-3 transition ${
        active
          ? "border-accent-strong/40 bg-accent-strong/[0.06]"
          : "border-line bg-surface/40 hover:border-line"
      }`}
    >
      <summary className="flex cursor-pointer items-center justify-between text-sm marker:content-none">
        <span className="font-display text-base text-fg">
          {period.lord}
          {active && (
            <span className="ml-3 text-2xs uppercase tracking-[0.18em] text-accent-ink">
              you are here
            </span>
          )}
        </span>
        <span className="tabular-nums text-xs text-muted">
          {period.start} → {period.end}
        </span>
      </summary>
      <ul className="mt-3 space-y-1 border-t border-line/60 pt-3">
        {period.children?.map((antar) => (
          <li
            key={`${antar.lord}-${antar.start}`}
            className={`flex justify-between text-xs ${
              isActive(antar, now) ? "text-accent-ink" : "text-muted"
            }`}
          >
            <span className="pl-3">{antar.lord}</span>
            <span className="tabular-nums text-dim">
              {antar.start} → {antar.end}
            </span>
          </li>
        ))}
      </ul>
    </details>
  );
}

function Card({ children, accent }: { children: React.ReactNode; accent?: boolean }) {
  return (
    <div
      className={`rounded-lg border p-5 ${
        accent ? "border-accent-strong/30 bg-accent-strong/[0.04]" : "border-line bg-surface/50"
      }`}
    >
      {children}
    </div>
  );
}

function CardLabel({ children }: { children: React.ReactNode }) {
  return <p className="text-2xs uppercase tracking-[0.22em] text-muted">{children}</p>;
}

function Tag({ children, title }: { children: React.ReactNode; title: string }) {
  return (
    <span
      title={title}
      className="rounded border border-line px-1.5 py-0.5 text-2xs text-accent-ink"
    >
      {children}
    </span>
  );
}

function dignityClass(dignity: string): string {
  if (dignity === "exalted" || dignity === "own" || dignity === "moolatrikona")
    return "text-emerald-300";
  if (dignity === "debilitated" || dignity === "enemy") return "text-rose-300";
  return "text-muted";
}

function isActive(p: DashaPeriod, now: number): boolean {
  return new Date(p.start).getTime() <= now && now < new Date(p.end).getTime();
}

function currentChain(periods: DashaPeriod[], now: number): DashaPeriod[] {
  const maha = periods.find((p) => isActive(p, now));
  if (!maha) return [];
  const antar = maha.children?.find((p) => isActive(p, now));
  return antar ? [maha, antar] : [maha];
}

function yr(iso: string): string {
  return iso.slice(0, 4);
}

/** Degrees as D°MM'SS" — how every reference tool prints a chart. */
function fmtDeg(deg: number): string {
  const d = Math.floor(deg);
  const mFull = (deg - d) * 60;
  const m = Math.floor(mFull);
  const s = Math.round((mFull - m) * 60);
  return `${d}°${String(m).padStart(2, "0")}'${String(s).padStart(2, "0")}"`;
}
