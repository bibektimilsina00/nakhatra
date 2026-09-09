"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Compass, Eye, EyeOff, Sparkles } from "lucide-react";

import { AppShell } from "@/features/dashboard/components/app-shell";
import { loadKundaliFromStorage } from "@/features/kundali/store/kundali-store";
import type { BirthDetailsIn, Chart, Planet } from "@/features/kundali/types";
import { useTranslation } from "@/lib/i18n/language-context";
import {
  getNakshatraName,
  getPlanetAbbrev,
  getPlanetName,
  getSignName,
  toLocalizedDigit,
} from "@/lib/i18n/vedic-translations";

/**
 * The sky at the moment of birth, as one interactive wheel.
 *
 * Every position is the engine's: a planet sits at sign_index * 30 +
 * degree_in_sign of sidereal longitude, the lagna at its own degree, the
 * aspect lines come from the engine's aspects_houses, and the Moon's phase is
 * the tithi. Nothing here computes astrology — it only draws what the chart
 * already says.
 *
 * Default orientation is the traditional one: the lagna on the eastern
 * horizon at the left, the zodiac running anticlockwise, so the wheel reads
 * like a round horoscope. A toggle puts 0° Aries at the top instead for
 * reading raw longitudes.
 */
// The hydration-safe "am I on the client yet" flag: the server snapshot says
// no, the client snapshot says yes, so the first client render matches the
// prerender and the storage read happens on the pass after.
const noSub = () => () => {};
const clientYes = () => true;
const serverNo = () => false;

export function BirthSky() {
  const router = useRouter();
  const { language } = useTranslation();
  const hydrated = useSyncExternalStore(noSub, clientYes, serverNo);
  const stored = useMemo<{ birth: BirthDetailsIn; chart: Chart } | null>(
    () => (hydrated ? loadKundaliFromStorage() : null),
    [hydrated],
  );
  const [selected, setSelected] = useState<string | null>("Moon");
  const [showNakshatras, setShowNakshatras] = useState(true);
  const [showAspects, setShowAspects] = useState(true);
  const [lagnaEast, setLagnaEast] = useState(true);

  useEffect(() => {
    // No kundali chosen — ask, rather than drawing somebody else's sky.
    if (hydrated && !stored) router.replace("/reading/choose");
  }, [hydrated, stored, router]);

  if (!stored) return null;
  const { chart, birth } = stored;
  const sk = language !== "en";

  const lagnaLon = chart.lagna_sign_index * 30 + chart.lagna_degree;
  const selectedPlanet = chart.planets.find((p) => p.name === selected) ?? null;

  return (
    <AppShell sidebar={false}>
      <main className="mx-auto w-full max-w-[1500px] px-4 py-6 lg:px-8">
        {/* Header */}
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              aria-label="Back"
              className="flex size-8 items-center justify-center rounded-[8px] border border-white/10 bg-[#161B2B] text-[#94A3B8] transition hover:border-[#E5A93C]/50 hover:text-[#F3C766]"
            >
              <ArrowLeft className="size-4" />
            </button>
            <div>
              <h1 className="font-serif text-lg font-bold text-[#F8FAFC]">
                {sk ? "जन्मकालीन आकाश" : "The Sky at Birth"}
                <Sparkles className="ml-2 inline size-4 text-[#E5A93C]" />
              </h1>
              <p className="text-[11px] text-[#94A3B8]">
                {birth.name} · {birth.date} · {birth.time} ·{" "}
                {birth.place_label.split("(")[0]}
              </p>
            </div>
          </div>

          {/* Toggles */}
          <div className="flex items-center gap-2 text-[10px] font-bold">
            <Toggle
              on={showNakshatras}
              onClick={() => setShowNakshatras((v) => !v)}
              label={sk ? "नक्षत्र" : "Nakshatras"}
            />
            <Toggle
              on={showAspects}
              onClick={() => setShowAspects((v) => !v)}
              label={sk ? "दृष्टि" : "Aspects"}
            />
            <button
              onClick={() => setLagnaEast((v) => !v)}
              className="flex items-center gap-1.5 rounded-[8px] border border-white/10 bg-[#161B2B] px-2.5 py-1.5 text-[#94A3B8] transition hover:border-[#E5A93C]/40 hover:text-[#F3C766]"
              title={sk ? "अभिमुखीकरण" : "Orientation"}
            >
              <Compass className="size-3.5" />
              {lagnaEast ? (sk ? "लग्न पूर्वमा" : "Lagna east") : (sk ? "मेष माथि" : "Aries top")}
            </button>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
          {/* The wheel */}
          <div className="relative overflow-hidden rounded-[12px] border border-white/10 bg-[#090A10] p-2 sm:p-6">
            <SkyWheel
              chart={chart}
              lagnaLon={lagnaLon}
              lagnaEast={lagnaEast}
              showNakshatras={showNakshatras}
              showAspects={showAspects}
              selected={selected}
              onSelect={(name) => setSelected((s) => (s === name ? null : name))}
            />
            {/* Planet legend chips */}
            <div className="mt-2 flex flex-wrap justify-center gap-1.5 pb-2">
              {chart.planets.map((p) => (
                <button
                  key={p.name}
                  onClick={() => setSelected((s) => (s === p.name ? null : p.name))}
                  className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-bold transition ${
                    selected === p.name
                      ? "border-[#E5A93C] bg-[#E5A93C]/15 text-[#F3C766]"
                      : "border-white/10 bg-[#161B2B] text-[#94A3B8] hover:border-white/25 hover:text-[#F8FAFC]"
                  }`}
                >
                  <span
                    className="inline-block size-2 rounded-full"
                    style={{ background: PLANET_COLORS[p.name] ?? "#F8FAFC" }}
                  />
                  {getPlanetName(p.name, language)}
                  {p.retrograde && <span className="text-[#E5A93C]">℞</span>}
                </button>
              ))}
            </div>
          </div>

          {/* Detail panel */}
          <aside className="space-y-4 lg:sticky lg:top-20">
            <MoonCard chart={chart} />
            {selectedPlanet ? (
              <PlanetCard planet={selectedPlanet} />
            ) : (
              <div className="rounded-[8px] border border-white/10 bg-[#161B2B] p-4 text-[12px] text-[#94A3B8]">
                {sk
                  ? "कुनै ग्रह छान्नुहोस् — चक्रमा वा तलका चिप्समा थिच्नुहोस्।"
                  : "Select a graha — tap it on the wheel or in the chips."}
              </div>
            )}
            <LagnaCard chart={chart} />
          </aside>
        </div>
      </main>
    </AppShell>
  );
}

/* ---------------------------------------------------------------- wheel */

const PLANET_COLORS: Record<string, string> = {
  Sun: "#FFB347",
  Moon: "#E8ECF4",
  Mars: "#FF6B5A",
  Mercury: "#7ED957",
  Jupiter: "#F3C766",
  Venus: "#F7C8E0",
  Saturn: "#7A9CC6",
  Rahu: "#8B7BC7",
  Ketu: "#C77B58",
};

const SIGN_GLYPHS = ["♈", "♉", "♊", "♋", "♌", "♍", "♎", "♏", "♐", "♑", "♒", "♓"];

function SkyWheel({
  chart,
  lagnaLon,
  lagnaEast,
  showNakshatras,
  showAspects,
  selected,
  onSelect,
}: {
  chart: Chart;
  lagnaLon: number;
  lagnaEast: boolean;
  showNakshatras: boolean;
  showAspects: boolean;
  selected: string | null;
  onSelect: (name: string) => void;
}) {
  const { language } = useTranslation();
  const C = 250; // centre
  const n = (x: number | string) => toLocalizedDigit(x, language);

  /** Sidereal longitude → SVG point. Lagna-east: the ascendant degree sits on
   *  the left horizon and the zodiac runs anticlockwise; Aries-top: 0° Aries
   *  at twelve o'clock. Pure trigonometry on engine longitudes. */
  const pt = (lon: number, r: number): [number, number] => {
    const a = lagnaEast ? 180 + (lon - lagnaLon) : 90 + lon;
    const rad = (a * Math.PI) / 180;
    return [C + r * Math.cos(rad), C - r * Math.sin(rad)];
  };

  // Stagger planets that share a neighbourhood so none overlap: walk them in
  // longitude order and push each near-neighbour one shelf inward.
  const placed = useMemo(() => {
    const lon = (p: Planet) => p.sign_index * 30 + p.degree_in_sign;
    const ordered = [...chart.planets].sort((a, b) => lon(a) - lon(b));
    const shelves: { p: Planet; lon: number; shelf: number }[] = [];
    for (const p of ordered) {
      const l = lon(p);
      const clash = shelves.filter(
        (s) => Math.min(Math.abs(s.lon - l), 360 - Math.abs(s.lon - l)) < 9,
      );
      shelves.push({ p, lon: l, shelf: clash.length });
    }
    return shelves;
  }, [chart.planets]);

  // A fixed starfield: seeded, so every render of the same chart draws the
  // same sky and hydration never disagrees.
  const stars = useMemo(() => {
    const out: { x: number; y: number; r: number; o: number; d: number }[] = [];
    let seed = Math.floor((chart.julian_day % 1) * 1e6) + 7;
    for (let i = 0; i < 90; i++) {
      const draws: number[] = [];
      for (let k = 0; k < 5; k++) {
        seed = (seed * 1103515245 + 12345) % 2147483648;
        draws.push(seed / 2147483648);
      }
      out.push({
        x: draws[0] * 500,
        y: draws[1] * 500,
        r: 0.4 + draws[2] * 1.1,
        o: 0.15 + draws[3] * 0.5,
        d: 2 + draws[4] * 4,
      });
    }
    return out;
  }, [chart.julian_day]);

  const selectedP = chart.planets.find((p) => p.name === selected);

  return (
    <svg viewBox="0 0 500 500" className="mx-auto block w-full max-w-[720px]">
      <style>{`@keyframes bs-twinkle { 0%,100%{opacity:.15} 50%{opacity:.7} }`}</style>

      {/* starfield */}
      {stars.map((s, i) => (
        <circle
          key={i}
          cx={s.x}
          cy={s.y}
          r={s.r}
          fill="#F8FAFC"
          opacity={s.o}
          style={{ animation: `bs-twinkle ${s.d}s ease-in-out infinite` }}
        />
      ))}

      {/* zodiac ring */}
      {Array.from({ length: 12 }, (_, i) => {
        const isLagnaSign = i === chart.lagna_sign_index;
        return (
          <g key={i}>
            <path
              d={wedge(C, i * 30, (i + 1) * 30, 196, 232, pt)}
              fill={isLagnaSign ? "#E5A93C" : i % 2 ? "#161B2B" : "#0E1220"}
              fillOpacity={isLagnaSign ? 0.12 : 0.75}
              stroke="#E5A93C"
              strokeOpacity="0.25"
              strokeWidth="0.6"
            />
            <WheelLabel
              at={pt(i * 30 + 15, 214)}
              main={`${SIGN_GLYPHS[i]}`}
              sub={getSignName(
                ["Aries","Taurus","Gemini","Cancer","Leo","Virgo","Libra","Scorpio","Sagittarius","Capricorn","Aquarius","Pisces"][i],
                language,
              )}
            />
          </g>
        );
      })}

      {/* nakshatra ring */}
      {showNakshatras &&
        Array.from({ length: 27 }, (_, i) => {
          const start = i * (360 / 27);
          return (
            <g key={i}>
              <path
                d={wedge(C, start, start + 360 / 27, 180, 194, pt)}
                fill={i % 2 ? "#161B2B" : "#0E1220"}
                fillOpacity="0.5"
                stroke="#7A9CC6"
                strokeOpacity="0.18"
                strokeWidth="0.4"
              />
              {/* pada ticks */}
              {[1, 2, 3].map((q) => {
                const [x1, y1] = pt(start + (q * 360) / 108, 180);
                const [x2, y2] = pt(start + (q * 360) / 108, 184);
                return (
                  <line key={q} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#7A9CC6" strokeOpacity="0.25" strokeWidth="0.4" />
                );
              })}
            </g>
          );
        })}

      {/* whole-sign house spokes + numbers */}
      {Array.from({ length: 12 }, (_, i) => {
        const cusp = (chart.lagna_sign_index + i) * 30;
        const [x1, y1] = pt(cusp, 60);
        const [x2, y2] = pt(cusp, 180);
        return (
          <g key={i}>
            <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#E5A93C" strokeOpacity="0.12" strokeWidth="0.6" />
            <text
              {...textAt(pt(cusp + 15, 72))}
              fontSize="9"
              fill="#94A3B8"
              opacity="0.7"
            >
              {n(i + 1)}
            </text>
          </g>
        );
      })}

      {/* aspect lines for the selected planet, from the engine's houses */}
      {showAspects &&
        selectedP?.aspects_houses?.map((h: number) => {
          const targetLon = ((chart.lagna_sign_index + h - 1) % 12) * 30 + 15;
          const from = pt(selectedP.sign_index * 30 + selectedP.degree_in_sign, 150);
          const to = pt(targetLon, 150);
          return (
            <line
              key={h}
              x1={from[0]}
              y1={from[1]}
              x2={to[0]}
              y2={to[1]}
              stroke={PLANET_COLORS[selectedP.name] ?? "#E5A93C"}
              strokeOpacity="0.35"
              strokeWidth="0.8"
              strokeDasharray="3 3"
            />
          );
        })}

      {/* lagna marker */}
      <g>
        {(() => {
          const [x1, y1] = pt(lagnaLon, 150);
          const [x2, y2] = pt(lagnaLon, 236);
          return (
            <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#F3C766" strokeWidth="1.4" strokeOpacity="0.9" />
          );
        })()}
        <text {...textAt(pt(lagnaLon, 244))} fontSize="10" fontWeight="bold" fill="#F3C766">
          {language === "en" ? "Asc" : "ल"}
        </text>
      </g>

      {/* planets */}
      {placed.map(({ p, lon, shelf }) => {
        const r = 150 - shelf * 26;
        const [x, y] = pt(lon, r);
        const on = selected === p.name;
        const color = PLANET_COLORS[p.name] ?? "#F8FAFC";
        return (
          <g
            key={p.name}
            onClick={() => onSelect(p.name)}
            className="cursor-pointer"
            opacity={selected && !on ? 0.55 : 1}
          >
            {/* degree tick on the rim */}
            {(() => {
              const [tx1, ty1] = pt(lon, 192);
              const [tx2, ty2] = pt(lon, 196);
              return <line x1={tx1} y1={ty1} x2={tx2} y2={ty2} stroke={color} strokeWidth="1.2" />;
            })()}
            {on && <circle cx={x} cy={y} r="15" fill={color} opacity="0.18" />}
            {p.combust && <circle cx={x} cy={y} r="12" fill="#FFB347" opacity="0.15" />}
            <circle cx={x} cy={y} r="9" fill="#0E1220" stroke={color} strokeWidth={on ? 2 : 1.2} />
            <text x={x} y={y + 3} textAnchor="middle" fontSize="8" fontWeight="bold" fill={color}>
              {getPlanetAbbrev(p.name, language)}
            </text>
            {p.retrograde && (
              <text x={x + 10} y={y - 7} fontSize="7" fill="#E5A93C">
                ℞
              </text>
            )}
            <text x={x} y={y + 18} textAnchor="middle" fontSize="6.5" fill="#94A3B8">
              {n(Math.floor(p.degree_in_sign))}°
            </text>
          </g>
        );
      })}

      {/* centre: the Moon at its phase */}
      <MoonPhase cx={C} cy={C} r={26} tithiIndex={chart.panchang.tithi_index} />
    </svg>
  );
}

function WheelLabel({ at, main, sub }: { at: [number, number]; main: string; sub: string }) {
  return (
    <g>
      <text x={at[0]} y={at[1]} textAnchor="middle" fontSize="11" fill="#E5A93C" opacity="0.9">
        {main}
      </text>
      <text x={at[0]} y={at[1] + 10} textAnchor="middle" fontSize="6.5" fill="#94A3B8">
        {sub}
      </text>
    </g>
  );
}

function textAt([x, y]: [number, number]) {
  return { x, y, textAnchor: "middle" as const };
}

/** An annular wedge between two longitudes. */
function wedge(
  C: number,
  lonA: number,
  lonB: number,
  rIn: number,
  rOut: number,
  pt: (lon: number, r: number) => [number, number],
): string {
  const [ax, ay] = pt(lonA, rOut);
  const [bx, by] = pt(lonB, rOut);
  const [cx2, cy2] = pt(lonB, rIn);
  const [dx, dy] = pt(lonA, rIn);
  const large = lonB - lonA > 180 ? 1 : 0;
  // sweep flags account for the anticlockwise zodiac
  return `M${ax} ${ay} A${rOut} ${rOut} 0 ${large} 0 ${bx} ${by} L${cx2} ${cy2} A${rIn} ${rIn} 0 ${large} 1 ${dx} ${dy} Z`;
}

/**
 * The Moon lit as the tithi says it was. Waxing tithis (Shukla 1-15) grow the
 * light from the right; waning shrink it. The terminator is an ellipse whose
 * width follows the phase — the standard flat-map of lunation, drawn from the
 * engine's tithi_index alone.
 */
function MoonPhase({ cx, cy, r, tithiIndex }: { cx: number; cy: number; r: number; tithiIndex: number }) {
  const phase = ((tithiIndex + 0.5) / 30) * 2 * Math.PI; // 0 new → π full
  const lit = (1 - Math.cos(phase)) / 2; // 0..1 illuminated
  const waxing = tithiIndex < 15;
  const term = r * Math.abs(1 - 2 * lit); // terminator half-width
  const bulge = lit > 0.5;

  // Two half-discs: dark base, lit overlay built from a semicircle plus a
  // terminator ellipse arc.
  const side = waxing ? 1 : -1;
  const path = [
    `M${cx} ${cy - r}`,
    `A${r} ${r} 0 0 ${waxing ? 1 : 0} ${cx} ${cy + r}`,
    `A${term} ${r} 0 0 ${bulge === waxing ? 0 : 1} ${cx} ${cy - r}`,
    "Z",
  ].join(" ");

  return (
    <g>
      <circle cx={cx} cy={cy} r={r + 6} fill="#E8ECF4" opacity="0.06" />
      <circle cx={cx} cy={cy} r={r} fill="#1B2233" stroke="#7A9CC6" strokeOpacity="0.3" strokeWidth="0.6" />
      <path d={path} fill="#E8ECF4" opacity="0.92" transform={side === -1 ? `scale(-1,1) translate(${-2 * cx},0)` : undefined} />
    </g>
  );
}

/* ------------------------------------------------------------- side cards */

function Card({ title, children }: { title: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="rounded-[8px] border border-white/10 bg-[#161B2B] p-4">
      <h3 className="mb-3 border-b border-white/10 pb-2 font-serif text-xs font-bold uppercase tracking-wider text-[#F8FAFC]">
        {title}
      </h3>
      {children}
    </div>
  );
}

function Row({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-1 text-[12px]">
      <span className="text-[#94A3B8]">{k}</span>
      <span className="text-right font-semibold text-[#F8FAFC]">{v}</span>
    </div>
  );
}

function dms(deg: number): string {
  const d = Math.floor(deg);
  const mF = (deg - d) * 60;
  const m = Math.floor(mF);
  const s = Math.round((mF - m) * 60);
  return `${d}°${String(m).padStart(2, "0")}'${String(s).padStart(2, "0")}"`;
}

function PlanetCard({ planet }: { planet: Planet }) {
  const { language } = useTranslation();
  const sk = language !== "en";
  const n = (x: number | string) => toLocalizedDigit(x, language);
  const color = PLANET_COLORS[planet.name] ?? "#F8FAFC";

  return (
    <Card
      title={
        <span className="flex items-center gap-2">
          <span className="inline-block size-2.5 rounded-full" style={{ background: color }} />
          {getPlanetName(planet.name, language)}
          {planet.retrograde && <span className="text-[#E5A93C]">℞ {sk ? "वक्री" : "retrograde"}</span>}
          {planet.combust && <span className="text-[#FFB347]">{sk ? "अस्त" : "combust"}</span>}
        </span>
      }
    >
      <Row k={sk ? "राशि" : "Sign"} v={`${getSignName(planet.sign, language)} (${n(planet.sign_index + 1)})`} />
      <Row k={sk ? "अंश" : "Degree"} v={n(dms(planet.degree_in_sign))} />
      <Row
        k={sk ? "नक्षत्र" : "Nakshatra"}
        v={`${getNakshatraName(planet.nakshatra.name, language)} · ${n(planet.nakshatra.pada)}`}
      />
      <Row k={sk ? "नक्षत्र स्वामी" : "Nakshatra lord"} v={getPlanetName(planet.nakshatra.lord, language)} />
      <Row k={sk ? "भाव" : "House"} v={n(planet.house)} />
      {planet.dignity && <Row k={sk ? "स्थिति" : "Dignity"} v={planet.dignity} />}
      {planet.avastha && <Row k={sk ? "अवस्था" : "Avastha"} v={planet.avastha} />}
      {planet.aspects_houses && planet.aspects_houses.length > 0 && (
        <Row
          k={sk ? "दृष्टि (भाव)" : "Aspects houses"}
          v={planet.aspects_houses.map((h: number) => n(h)).join(", ")}
        />
      )}
    </Card>
  );
}

function MoonCard({ chart }: { chart: Chart }) {
  const { language } = useTranslation();
  const sk = language !== "en";
  const n = (x: number | string) => toLocalizedDigit(x, language);
  const p = chart.panchang;
  return (
    <Card title={sk ? "चन्द्रमा र तिथि" : "Moon & Tithi"}>
      <div className="flex items-center gap-4">
        <svg viewBox="0 0 64 64" className="size-14 shrink-0">
          <MoonPhase cx={32} cy={32} r={24} tithiIndex={p.tithi_index} />
        </svg>
        <div className="min-w-0 flex-1">
          <Row k={sk ? "तिथि" : "Tithi"} v={`${p.paksha} ${p.tithi_name}`} />
          <Row k={sk ? "चन्द्र राशि" : "Moon sign"} v={getSignName(p.moon_sign, language)} />
          <Row
            k={sk ? "जन्म नक्षत्र" : "Janma nakshatra"}
            v={`${getNakshatraName(p.nakshatra, language)} · ${n(p.nakshatra_pada)}`}
          />
        </div>
      </div>
    </Card>
  );
}

function LagnaCard({ chart }: { chart: Chart }) {
  const { language } = useTranslation();
  const sk = language !== "en";
  const n = (x: number | string) => toLocalizedDigit(x, language);
  const p = chart.panchang;
  return (
    <Card title={sk ? "लग्न र पञ्चाङ्ग" : "Lagna & Panchang"}>
      <Row
        k={sk ? "लग्न" : "Ascendant"}
        v={`${getSignName(chart.lagna_sign, language)} ${n(dms(chart.lagna_degree))}`}
      />
      <Row k={sk ? "वार" : "Vara"} v={p.vara} />
      <Row k={sk ? "योग" : "Yoga"} v={p.yoga} />
      <Row k={sk ? "करण" : "Karana"} v={p.karana} />
      {p.sunrise && (
        <Row k={sk ? "सूर्योदय" : "Sunrise"} v={p.sunrise.slice(11, 16)} />
      )}
      {p.sunset && <Row k={sk ? "सूर्यास्त" : "Sunset"} v={p.sunset.slice(11, 16)} />}
      <p className="mt-2 border-t border-white/10 pt-2 text-[10px] leading-relaxed text-[#94A3B8]">
        {sk
          ? "सबै स्थितिहरू जन्मकुण्डलीकै हुन् — निरयण, लाहिरी अयनांश।"
          : "All positions are this kundali's own — sidereal, Lahiri ayanamsa."}
      </p>
    </Card>
  );
}

function Toggle({ on, onClick, label }: { on: boolean; onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 rounded-[8px] border px-2.5 py-1.5 transition ${
        on
          ? "border-[#E5A93C]/50 bg-[#E5A93C]/10 text-[#F3C766]"
          : "border-white/10 bg-[#161B2B] text-[#94A3B8] hover:text-[#F8FAFC]"
      }`}
    >
      {on ? <Eye className="size-3.5" /> : <EyeOff className="size-3.5" />}
      {label}
    </button>
  );
}
