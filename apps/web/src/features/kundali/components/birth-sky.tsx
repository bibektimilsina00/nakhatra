"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Eye, EyeOff, Sparkles } from "lucide-react";

import { AppShell } from "@/features/dashboard/components/app-shell";
import { BirthSky3D, PLANET_COLORS } from "@/features/kundali/components/birth-sky-3d";
import { loadKundaliFromStorage } from "@/features/kundali/store/kundali-store";
import type { BirthDetailsIn, Chart, Planet } from "@/features/kundali/types";
import { useTranslation } from "@/lib/i18n/language-context";
import {
  getNakshatraName,
  getPlanetName,
  getSignName,
  toLocalizedDigit,
} from "@/lib/i18n/vedic-translations";

/**
 * The sky at the moment of birth — a three.js scene sharing the landing
 * page's engine, but geocentric: the Earth at the centre, because a kundali
 * describes the sky as seen from the birthplace.
 *
 * Every position is the engine's: a graha sits at sign_index * 30 +
 * degree_in_sign of sidereal longitude, the lagna beam at its own degree, the
 * aspect lines come from the engine's aspects_houses, and the Moon's phase is
 * the tithi. Nothing here computes astrology — it only draws what the chart
 * already says.
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
  const [selected, setSelected] = useState<string | null>(null);
  const [showNakshatras, setShowNakshatras] = useState(true);
  const [showAspects, setShowAspects] = useState(true);

  useEffect(() => {
    // No kundali chosen — ask, rather than drawing somebody else's sky.
    if (hydrated && !stored) router.replace("/reading/choose");
  }, [hydrated, stored, router]);

  if (!stored) return null;
  const { chart, birth } = stored;
  const sk = language !== "en";

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
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
          {/* The wheel */}
          <div className="relative overflow-hidden rounded-[12px] border border-white/10 bg-[#090A10] p-2 sm:p-6">
            <BirthSky3D
              chart={chart}
              selected={selected}
              onSelect={(name) => setSelected((s) => (s === name ? null : name))}
              showNakshatras={showNakshatras}
              showAspects={showAspects}
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

/* ------------------------------------------------------------ moon phase */

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
