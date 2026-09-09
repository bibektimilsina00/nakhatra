"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Eye, EyeOff, Sparkles } from "lucide-react";

import { AppShell } from "@/features/dashboard/components/app-shell";
import {BirthSky3D, MoonPhase3D, PLANET_COLORS, YOGATARA } from "@/features/kundali/components/birth-sky-3d";
import { loadKundaliFromStorage } from "@/features/kundali/store/kundali-store";
import type { BirthDetailsIn, Chart, Planet } from "@/features/kundali/types";
import { useTranslation } from "@/lib/i18n/language-context";
import {
  KARANA_DEV,
  PAKSHA_DEV,
  TITHI_DEV,
  VARA_DEV,
  YOGA_DEV,
  dev,
} from "@/lib/i18n/patro-sanskrit";
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
  const [selectedNak, setSelectedNak] = useState<string | null>(null);
  const [showNakshatras, setShowNakshatras] = useState(false);
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
    <AppShell
      guest
      sidebar={false}
      bar={
        <div className="flex min-w-0 items-center gap-3">
          <button
            onClick={() => router.back()}
            aria-label="Back"
            className="flex size-8 shrink-0 items-center justify-center rounded-[8px] border border-white/10 bg-[#161B2B] text-[#94A3B8] transition hover:border-[#E5A93C]/50 hover:text-[#F3C766]"
          >
            <ArrowLeft className="size-4" />
          </button>
          <div className="min-w-0">
            <p className="truncate font-serif text-[14px] font-bold text-[#F8FAFC]">
              {sk ? "जन्मकालीन आकाश" : "The Sky at Birth"}
              <Sparkles className="ml-1.5 inline size-3.5 text-[#E5A93C]" />
            </p>
            <p className="truncate text-[11px] text-[#94A3B8]">
              {birth.name} · {birth.date} · {birth.time} ·{" "}
              {birth.place_label.split("(")[0]}
            </p>
          </div>
        </div>
      }
    >
      <main className="w-full px-2 py-2 lg:px-3">
        <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
          {/* The wheel — edge to edge, the chrome floats over it */}
          <div className="relative overflow-hidden rounded-[12px] border border-white/10 bg-[#090A10]">
            {/* view toggles live on the sky itself */}
            <div className="absolute right-3 top-3 z-10 flex items-center gap-2 text-[10px] font-bold">
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
            <BirthSky3D
              className="relative h-[calc(100dvh-92px)] min-h-[520px] w-full overflow-hidden rounded-[12px]"
              chart={chart}
              selected={selected}
              onSelect={(name) => {
                setSelectedNak(null);
                setSelected((s) => (s === name ? null : name));
              }}
              onSelectNakshatra={(name) => {
                setSelectedNak(name);
                if (name) setSelected(null);
              }}
              showNakshatras={showNakshatras}
              showAspects={showAspects}
            />
            {/* Planet tiles — floating over the sky, faces from the real maps */}
            <div className="absolute bottom-3 left-1/2 z-10 flex w-max max-w-[96%] -translate-x-1/2 flex-wrap justify-center gap-1.5">
              <button
                key="Earth"
                onClick={() => setSelected((s) => (s === "Earth" ? null : "Earth"))}
                className={`flex size-[54px] flex-col items-center justify-center gap-1 rounded-[10px] border backdrop-blur-md transition ${
                  selected === "Earth"
                    ? "border-[#E5A93C] bg-[#E5A93C]/15"
                    : "border-white/10 bg-[#0B0E18]/75 hover:border-white/30"
                }`}
                title={sk ? "पृथ्वी" : "Earth"}
              >
                <span
                  className="size-6 rounded-full border border-white/20 bg-cover bg-center"
                  style={planetFace("Earth")}
                />
                <span
                  className={`max-w-[50px] truncate text-[8px] font-bold leading-none ${
                    selected === "Earth" ? "text-[#F3C766]" : "text-[#94A3B8]"
                  }`}
                >
                  {sk ? "पृथ्वी" : "Earth"}
                </span>
              </button>
              {chart.planets.map((p) => (
                <button
                  key={p.name}
                  onClick={() => setSelected((s) => (s === p.name ? null : p.name))}
                  className={`flex size-[54px] flex-col items-center justify-center gap-1 rounded-[10px] border backdrop-blur-md transition ${
                    selected === p.name
                      ? "border-[#E5A93C] bg-[#E5A93C]/15"
                      : "border-white/10 bg-[#0B0E18]/75 hover:border-white/30"
                  }`}
                  title={getPlanetName(p.name, language)}
                >
                  <span
                    className="size-6 rounded-full border border-white/20 bg-cover bg-center"
                    style={planetFace(p.name)}
                  />
                  <span
                    className={`max-w-[50px] truncate text-[8px] font-bold leading-none ${
                      selected === p.name ? "text-[#F3C766]" : "text-[#94A3B8]"
                    }`}
                  >
                    {getPlanetName(p.name, language)}
                    {p.retrograde && <span className="text-[#E5A93C]"> ℞</span>}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Detail panel */}
          <aside className="space-y-4 lg:sticky lg:top-20">
            <MoonCard chart={chart} />
            {selectedNak ? (
              <NakshatraCard name={selectedNak} janma={chart.panchang.nakshatra} />
            ) : selected === "Earth" ? (
              <div className="rounded-[8px] border border-brd bg-panel p-4">
                <h3 className="mb-2 border-b border-brd pb-2 font-serif text-xs font-bold uppercase tracking-wider text-fg">
                  {sk ? "पृथ्वी" : "Earth"}
                </h3>
                <p className="text-[12px] leading-relaxed text-mut">
                  {sk
                    ? "यही ठाउँबाट सारा कुण्डली देखिन्छ — हरेक ग्रहको स्थिति पृथ्वीबाट हेरिएको हो। जन्मस्थान यही गोलामा छ।"
                    : "The one place the whole chart is seen from — every graha's position is as viewed from here. The birthplace sits on this globe."}
                </p>
              </div>
            ) : selectedPlanet ? (
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
        <MoonPhase3D phaseDeg={moonElongation(chart)} className="size-16 shrink-0" />
        <div className="min-w-0 flex-1">
          <Row
          k={sk ? "तिथि" : "Tithi"}
          v={
            sk
              ? `${dev(PAKSHA_DEV, p.paksha)} ${dev(TITHI_DEV, p.tithi_name)}`
              : `${p.paksha} ${p.tithi_name}`
          }
        />
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
      <Row k={sk ? "वार" : "Vara"} v={sk ? `${dev(VARA_DEV, p.vara)}वार` : p.vara} />
      <Row k={sk ? "योग" : "Yoga"} v={sk ? dev(YOGA_DEV, p.yoga) : p.yoga} />
      <Row k={sk ? "करण" : "Karana"} v={sk ? dev(KARANA_DEV, p.karana) : p.karana} />
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

/** The chart's exact Sun–Moon elongation — the angle the tithi is 12° slices
 *  of. Display arithmetic on two engine longitudes, not astrology. */
function moonElongation(chart: Chart): number {
  const lon = (name: string) => {
    const pl = chart.planets.find((x) => x.name === name);
    return pl ? pl.sign_index * 30 + pl.degree_in_sign : 0;
  };
  return (lon("Moon") - lon("Sun") + 360) % 360;
}

/** The face each chip wears — a slice of the very texture its sphere wears
 *  in the scene. The nodes have no surface, so they wear their smoke. */
function planetFace(name: string): React.CSSProperties {
  const MAP: Record<string, string> = {
    Earth: "earth_daymap.jpg",
    Sun: "sun.jpg",
    Moon: "moonmap.jpg",
    Mars: "marsmap.jpg",
    Mercury: "mercurymap.jpg",
    Jupiter: "jupiter.jpg",
    Venus: "venusmap.jpg",
    Saturn: "saturnmap.jpg",
  };
  if (MAP[name]) return { backgroundImage: `url(/planets/${MAP[name]})` };
  return {
    background:
      name === "Rahu"
        ? "radial-gradient(circle at 35% 35%, #8B7BC7, #141026 75%)"
        : "radial-gradient(circle at 35% 35%, #C77B58, #1c0f08 75%)",
  };
}

/** Which nakshatra a tapped yogatara belongs to — its star, its Vimshottari
 *  lord, and the 13°20' arc it names. Reference data plus arithmetic on the
 *  index; nothing computed about the chart. */
function NakshatraCard({ name, janma }: { name: string; janma: string }) {
  const { language } = useTranslation();
  const sk = language !== "en";
  const n = (x: number | string) => toLocalizedDigit(x, language);
  const idx = YOGATARA.findIndex((y) => y.name === name);
  if (idx < 0) return null;
  const entry = YOGATARA[idx];
  const LORDS = ["Ketu", "Venus", "Sun", "Moon", "Mars", "Rahu", "Jupiter", "Saturn", "Mercury"];
  const lord = LORDS[idx % 9];
  const start = idx * (360 / 27);
  const end = (idx + 1) * (360 / 27);
  const seg = (deg: number) => {
    const sign = Math.floor(deg / 30) % 12;
    const within = deg - sign * 30;
    const m = Math.round((within - Math.floor(within)) * 60);
    const signName = getSignName(
      ["Aries","Taurus","Gemini","Cancer","Leo","Virgo","Libra","Scorpio","Sagittarius","Capricorn","Aquarius","Pisces"][sign],
      language,
    );
    return `${signName} ${n(Math.floor(within))}°${n(String(m).padStart(2, "0"))}'`;
  };
  // the engine spells a few of these differently (Mula/Moola)
  const isJanma = janma.replace("oo", "u") === name.replace("oo", "u");

  return (
    <div className="rounded-[8px] border border-brd bg-panel p-4">
      <h3 className="mb-2 flex items-center justify-between border-b border-brd pb-2 font-serif text-xs font-bold uppercase tracking-wider text-fg">
        <span>{getNakshatraName(name, language)}</span>
        {isJanma && (
          <span className="rounded-[4px] border border-acc/40 px-1.5 py-0.5 text-[9px] text-acc">
            {sk ? "जन्म नक्षत्र" : "Janma nakshatra"}
          </span>
        )}
      </h3>
      <div className="space-y-1 text-[12px]">
        <div className="flex justify-between gap-3">
          <span className="text-mut">{sk ? "योगतारा" : "Yogatara"}</span>
          <span className="text-right font-semibold text-fg">{entry.star}</span>
        </div>
        <div className="flex justify-between gap-3">
          <span className="text-mut">{sk ? "स्वामी ग्रह" : "Lord"}</span>
          <span className="font-semibold text-fg">{getPlanetName(lord, language)}</span>
        </div>
        <div className="flex justify-between gap-3">
          <span className="text-mut">{sk ? "विस्तार" : "Extent"}</span>
          <span className="text-right font-semibold text-fg">
            {seg(start)} – {seg(end)}
          </span>
        </div>
        <div className="flex justify-between gap-3">
          <span className="text-mut">{sk ? "चरण" : "Padas"}</span>
          <span className="font-semibold text-fg">{n(4)} × {n("3")}°{n("20")}'</span>
        </div>
      </div>
      <p className="mt-2 border-t border-brd pt-2 text-[10px] leading-relaxed text-mut">
        {sk
          ? "यो तारा आकाशमा आफ्नै वास्तविक स्थानमा छ — नक्षत्र भनेको यसैको वरिपरि कोरिएको १३°२०' को खण्ड हो।"
          : "The star stands at its true place in the sky — the nakshatra is the 13°20' arc drawn around it."}
      </p>
    </div>
  );
}
